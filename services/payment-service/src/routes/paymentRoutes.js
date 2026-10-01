import { Router } from "express";
import { requireAuth, requireRole, validate, z, ROLES } from "../../../../shared/index.js";
import { makePaymentController } from "../controllers/paymentController.js";

const createSchema = z.object({
  purposeCode: z.string().min(2).max(60),
  referenceId: z.string().max(80).optional(),
});

const confirmSchema = z.object({
  razorpay_order_id: z.string(),
  razorpay_payment_id: z.string().optional(),
  razorpay_signature: z.string().optional(),
  simulate: z.enum(["success", "failure"]).optional(),
});

export function paymentRoutes(deps) {
  const c = makePaymentController(deps);
  const r = Router();

  r.get("/fees", c.catalogue);
  r.get("/mine", requireAuth, c.listMine);
  r.get("/stats", requireAuth, requireRole(ROLES.OFFICER, ROLES.ADMIN), c.stats);

  r.post("/", requireAuth, validate(createSchema), c.create);
  r.post("/:receiptId/confirm", requireAuth, validate(confirmSchema), c.confirm);
  r.get("/:receiptId", requireAuth, c.receipt);

  return r;
}
