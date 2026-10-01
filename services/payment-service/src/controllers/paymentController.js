import { customAlphabet } from "nanoid";
import {
  asyncHandler, BadRequest, NotFound, Forbidden, TOPICS, ROLES,
} from "../../../../shared/index.js";
import { pool, withTransaction } from "../db/pool.js";
import { FEE_CATALOGUE, feeFor, rupees, recordLedger } from "../services/ledgerService.js";
import Razorpay from "razorpay";
import crypto from "crypto";
import { env } from "../../../../shared/index.js";

const rzp = new Razorpay({
  key_id: env.razorpay.keyId,
  key_secret: env.razorpay.keySecret,
});

const receiptCode = customAlphabet("0123456789ABCDEFGHJKMNPQRSTUVWXYZ", 10);

function toPublic(row) {
  return {
    id: String(row.id),
    receiptId: row.receipt_id,
    purpose: row.purpose,
    purposeCode: row.purpose_code,
    referenceId: row.reference_id,
    amountPaise: Number(row.amount_paise),
    amount: rupees(Number(row.amount_paise)),
    currency: row.currency,
    status: row.status,
    method: row.method,
    gateway: row.gateway,
    failureReason: row.failure_reason,
    citizenName: row.citizen_name,
    createdAt: row.created_at,
    completedAt: row.completed_at,
  };
}

export function makePaymentController({ log, producer }) {
  return {
    catalogue: asyncHandler(async (_req, res) => {
      res.json({
        success: true,
        fees: FEE_CATALOGUE.map((f) => ({ ...f, amount: rupees(f.amountPaise) })),
      });
    }),

    /** Step 1 — create the payment intent via Razorpay or Mock. */
    create: asyncHandler(async (req, res) => {
      const { purposeCode, referenceId } = req.body;

      const fee = feeFor(purposeCode);
      if (!fee) throw BadRequest("Unknown fee type");

      const receiptId = `RCP-${receiptCode()}`;

      let rzpOrderId;
      if (env.razorpay.keyId === "rzp_test_demo123") {
        rzpOrderId = `mock_order_${Date.now()}`;
      } else {
        const rzpOrder = await rzp.orders.create({
          amount: fee.amountPaise,
          currency: "INR",
          receipt: receiptId,
        });
        rzpOrderId = rzpOrder.id;
      }

      const payment = await withTransaction(async (client) => {
        const { rows } = await client.query(
          `INSERT INTO payments
             (receipt_id, user_id, citizen_name, mobile, purpose, purpose_code,
              reference_id, amount_paise, status, gateway)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'created','razorpay')
           RETURNING *`,
          [
            rzpOrderId, req.user.sub, req.user.name || "Citizen", req.user.mobile,
            fee.label, fee.code, referenceId || null, fee.amountPaise,
          ]
        );

        await recordLedger(client, {
          paymentId: rows[0].id,
          event: "payment.created",
          toStatus: "created",
          detail: { amountPaise: fee.amountPaise, purpose: fee.label, orderId: rzpOrderId },
        });

        return rows[0];
      });

      log.info({ receiptId: rzpOrderId, amount: rupees(fee.amountPaise) }, "Order created");
      res.status(201).json({ success: true, payment: toPublic(payment), orderId: rzpOrderId, amountPaise: fee.amountPaise, currency: "INR" });
    }),

    /** Step 2 — confirm payment (mock or real signature validation) */
    confirm: asyncHandler(async (req, res) => {
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature, simulate } = req.body;

      if (env.razorpay.keyId !== "rzp_test_demo123") {
        // Verify Signature for real Razorpay
        const hmac = crypto.createHmac("sha256", env.razorpay.keySecret);
        hmac.update(`${razorpay_order_id}|${razorpay_payment_id}`);
        const expectedSignature = hmac.digest("hex");

        if (expectedSignature !== razorpay_signature) {
          throw BadRequest("Invalid payment signature");
        }
      }

      const succeeded = simulate !== "failure";
      const newStatus = succeeded ? "succeeded" : "failed";
      const failureReason = succeeded ? null : "Simulated gateway decline";
      const gatewayRef = razorpay_payment_id || `mock_pay_${Date.now()}`;

      const result = await withTransaction(async (client) => {
        // Row lock prevents a double-confirm under concurrent requests.
        const { rows } = await client.query(
          `SELECT * FROM payments WHERE receipt_id = $1 FOR UPDATE`,
          [razorpay_order_id]
        );

        if (!rows.length) throw NotFound("Payment not found");
        const payment = rows[0];

        if (payment.user_id !== req.user.sub) {
          throw Forbidden("You can only confirm your own payments");
        }
        if (payment.status !== "created") {
          throw BadRequest(`This payment is already ${payment.status}`);
        }

        const { rows: updated } = await client.query(
          `UPDATE payments
             SET status = $1, method = $2, gateway_ref = $3,
                 failure_reason = $4, completed_at = NOW(), updated_at = NOW()
           WHERE id = $5
           RETURNING *`,
          [
            newStatus,
            "razorpay",
            gatewayRef,
            failureReason,
            payment.id,
          ]
        );

        await recordLedger(client, {
          paymentId: payment.id,
          event: succeeded ? "payment.succeeded" : "payment.failed",
          fromStatus: "created",
          toStatus: newStatus,
          detail: { gatewayRef },
        });

        return updated[0];
      });

      if (succeeded) {
        await producer.publish(TOPICS.paymentCompleted, {
          userId: result.user_id,
          receiptId: result.receipt_id,
          amount: rupees(Number(result.amount_paise)),
          purpose: result.purpose,
        }, result.user_id);
      }

      log.info({ receiptId: result.receipt_id, status: result.status }, "Payment confirmed");
      res.json({ success: true, payment: toPublic(result) });
    }),

    listMine: asyncHandler(async (req, res) => {
      const { rows } = await pool.query(
        `SELECT * FROM payments WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50`,
        [req.user.sub]
      );
      res.json({ success: true, payments: rows.map(toPublic) });
    }),

    receipt: asyncHandler(async (req, res) => {
      const { rows } = await pool.query(
        `SELECT * FROM payments WHERE receipt_id = $1`,
        [req.params.receiptId]
      );
      if (!rows.length) throw NotFound("Receipt not found");

      const payment = rows[0];
      if (req.user.role === ROLES.CITIZEN && payment.user_id !== req.user.sub) {
        throw Forbidden("You can only view your own receipts");
      }

      const { rows: ledger } = await pool.query(
        `SELECT event, from_status, to_status, detail, recorded_at
           FROM payment_ledger WHERE payment_id = $1 ORDER BY recorded_at`,
        [payment.id]
      );

      res.json({ success: true, payment: toPublic(payment), ledger });
    }),

    stats: asyncHandler(async (_req, res) => {
      const { rows } = await pool.query(
        `SELECT status, COUNT(*)::int AS count, COALESCE(SUM(amount_paise),0)::bigint AS total
           FROM payments GROUP BY status`
      );

      const byStatus = {};
      let collectedPaise = 0;

      for (const r of rows) {
        byStatus[r.status] = { count: r.count, amount: rupees(Number(r.total)) };
        if (r.status === "succeeded") collectedPaise = Number(r.total);
      }

      res.json({
        success: true,
        stats: {
          byStatus,
          totalCollected: rupees(collectedPaise),
          transactionCount: rows.reduce((s, r) => s + r.count, 0),
        },
      });
    }),
  };
}
