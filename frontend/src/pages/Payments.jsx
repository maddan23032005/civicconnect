import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CreditCard, Receipt, CheckCircle2, XCircle, Clock, X, ShieldCheck, ArrowRight,
} from "lucide-react";
import { paymentApi } from "../lib/api";
import { useToast } from "../context/ToastContext";
import { Reveal, Stagger, StaggerItem } from "../components/animation/Reveal";
import { Card, Button, Badge, Skeleton, EmptyState } from "../components/ui";
import { PageHeader } from "../components/layout/PageHeader";
import { PageLayout } from "../components/layout/PageLayout";

const STATUS_META = {
  created:    { tone: "neutral", label: "Pending",    icon: Clock },
  processing: { tone: "navy",    label: "Processing", icon: Clock },
  succeeded:  { tone: "mint",    label: "Paid",       icon: CheckCircle2 },
  failed:     { tone: "rose",    label: "Failed",     icon: XCircle },
  refunded:   { tone: "saffron", label: "Refunded",   icon: Receipt },
};

function PayModal({ fee, onClose, onDone }) {
  const [stage, setStage] = useState("confirm");
  const [result, setResult] = useState(null);
  const toast = useToast();

  const isMockMode = import.meta.env.VITE_RAZORPAY_KEY_ID === "rzp_test_demo123" || !import.meta.env.VITE_RAZORPAY_KEY_ID;

  const loadRazorpay = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) return resolve(true);
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const payReal = async () => {
    setStage("processing");
    try {
      const created = await paymentApi.create({ purposeCode: fee.code });
      
      const loaded = await loadRazorpay();
      if (!loaded) {
        toast.error("Razorpay SDK failed to load. Are you offline?");
        setStage("confirm");
        return;
      }

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: created.amountPaise,
        currency: created.currency,
        name: "CivicConnect",
        description: fee.label,
        order_id: created.orderId,
        handler: async function (response) {
          try {
            setStage("processing");
            const confirmed = await paymentApi.confirm(created.payment.receiptId, {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            setResult(confirmed.payment);
            setStage("done");
            toast.success(`Payment of Rs. ${confirmed.payment.amount} received`);
            onDone();
          } catch (err) {
            toast.error(err.message || "Payment verification failed");
            setStage("confirm");
          }
        },
        prefill: { name: "Citizen", email: "citizen@example.com", contact: "9999999999" },
        theme: { color: "#2563EB" }
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (response){
        toast.error(response.error.description);
        setStage("confirm");
      });
      rzp.open();
    } catch (err) {
      toast.error(err.message);
      setStage("confirm");
    }
  };

  const payMock = async (simulate) => {
    setStage("processing");
    try {
      const created = await paymentApi.create({ purposeCode: fee.code });
      await new Promise((r) => setTimeout(r, 1000));
      const confirmed = await paymentApi.confirm(created.payment.receiptId, {
        razorpay_order_id: created.orderId,
        simulate,
      });

      setResult(confirmed.payment);
      setStage("done");

      if (confirmed.payment.status === "succeeded") {
        toast.success(`Payment of Rs. ${confirmed.payment.amount} received`);
        onDone();
      } else {
        toast.error("Payment was declined");
      }
    } catch (err) {
      toast.error(err.message);
      setStage("confirm");
    }
  };

  const pay = isMockMode ? () => payMock("success") : payReal;

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={stage === "processing" ? undefined : onClose}
        className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="fixed inset-x-4 top-1/2 z-50 mx-auto max-w-md -translate-y-1/2"
      >
        <Card className="glass-strong p-7">
          {stage === "confirm" && (
            <>
              <div className="mb-6 flex items-center justify-between">
                <h2 className="font-display text-xl font-semibold text-white">Confirm payment</h2>
                <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-white/5 hover:text-white">
                  <X size={19} />
                </button>
              </div>

              <div className="mb-6 rounded-xl bg-white/4 p-5 text-center">
                <p className="text-sm text-slate-400">{fee.label}</p>
                <p className="mt-2 font-display text-4xl font-bold text-white">
                  ₹{fee.amount}
                </p>
              </div>

              <div className="mt-6 space-y-3">
                <Button onClick={pay} size="lg" className="w-full">
                  Pay {isMockMode ? `₹${fee.amount} (Demo)` : "with Razorpay"}
                </Button>
                {isMockMode && (
                  <Button onClick={() => payMock("failure")} variant="ghost" size="sm" className="w-full">
                    Simulate a declined payment
                  </Button>
                )}
              </div>

              <p className="mt-5 flex items-center justify-center gap-1.5 text-xs text-slate-600">
                <ShieldCheck size={12} /> Secure Gateway
              </p>
            </>
          )}

          {stage === "processing" && (
            <div className="py-12 text-center">
              <div className="mx-auto mb-5 h-10 w-10 animate-spin rounded-full border-2 border-navy-500 border-t-transparent" />
              <p className="font-medium text-slate-200">Contacting payment gateway…</p>
              <p className="mt-1 text-sm text-slate-500">Please don't close this window</p>
            </div>
          )}

          {stage === "done" && result && (
            <div className="py-6 text-center">
              {result.status === "succeeded" ? (
                <motion.div
                  initial={{ scale: 0 }} animate={{ scale: 1 }}
                  transition={{ type: "spring", damping: 12 }}
                  className="mx-auto mb-5 inline-flex rounded-full bg-mint-500/15 p-4"
                >
                  <CheckCircle2 size={34} className="text-mint-500" />
                </motion.div>
              ) : (
                <div className="mx-auto mb-5 inline-flex rounded-full bg-rose-500/15 p-4">
                  <XCircle size={34} className="text-rose-500" />
                </div>
              )}

              <h3 className="font-display text-xl font-semibold text-white">
                {result.status === "succeeded" ? "Payment successful" : "Payment declined"}
              </h3>
              <p className="mt-1.5 text-sm text-slate-400">
                {result.status === "succeeded"
                  ? `₹${result.amount} paid for ${result.purpose}`
                  : result.failureReason || "The payment could not be completed"}
              </p>

              <div className="mt-5 rounded-xl bg-white/4 p-4">
                <p className="text-xs text-slate-500">Receipt number</p>
                <p className="mt-1 font-mono text-sm text-slate-200">{result.receiptId}</p>
              </div>

              <Button onClick={onClose} variant="ghost" className="mt-6 w-full">
                Done
              </Button>
            </div>
          )}
        </Card>
      </motion.div>
    </>
  );
}

export default function Payments() {
  const [fees, setFees] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  const load = () =>
    paymentApi.mine()
      .then((r) => setPayments(r.payments))
      .catch(() => setPayments([]))
      .finally(() => setLoading(false));

  useEffect(() => {
    paymentApi.fees().then((r) => setFees(r.fees)).catch(() => {});
    load();
  }, []);

  const totalPaid = payments
    .filter((p) => p.status === "succeeded")
    .reduce((s, p) => s + Number(p.amount), 0);

  return (
    <PageLayout>
    <div className="mx-auto max-w-5xl px-5 pb-20 pt-28 sm:px-8">
      <Reveal>
        <PageHeader
          icon={CreditCard}
          iconTone="text-navy-300"
          iconBg="bg-navy-500/10"
          title="Payments"
          subtitle="Pay government service fees securely and download official receipts"
        />
      </Reveal>

      {payments.length > 0 && (
        <Reveal delay={0.05}>
          <Card className="mb-8 p-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="font-display text-2xl font-bold text-white">
                  ₹{totalPaid.toFixed(2)}
                </p>
                <p className="mt-0.5 text-sm text-slate-500">Total paid</p>
              </div>
              <div className="text-right">
                <p className="font-display text-2xl font-bold text-white">{payments.length}</p>
                <p className="mt-0.5 text-sm text-slate-500">Transactions</p>
              </div>
            </div>
          </Card>
        </Reveal>
      )}

      <Reveal delay={0.1}>
        <h2 className="mb-4 font-display text-xl font-semibold text-white">Service fees</h2>
        {fees.length > 0 && (
          <Stagger className="mb-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {fees.map((f) => (
              <StaggerItem key={f.code}>
                <Card hover className="flex h-full flex-col justify-between p-5">
                  <div>
                    <p className="font-medium text-slate-100">{f.label}</p>
                    <p className="mt-2 font-display text-2xl font-bold text-white">₹{f.amount}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-4 w-full"
                    onClick={() => setSelected(f)}
                  >
                    Pay now <ArrowRight size={14} />
                  </Button>
                </Card>
              </StaggerItem>
            ))}
          </Stagger>
        )}
      </Reveal>

      <Reveal delay={0.15}>
        <h2 className="mb-4 font-display text-xl font-semibold text-white">
          Transaction history
        </h2>

        {loading ? (
          <div className="space-y-3">
            {[0, 1].map((i) => <Skeleton key={i} className="h-20 w-full" />)}
          </div>
        ) : payments.length === 0 ? (
          <Card>
            <EmptyState
              icon={CreditCard}
              title="No payments yet"
              message="Fees you pay will appear here with downloadable receipts."
            />
          </Card>
        ) : (
          <Card>
            <div className="divide-y divide-white/6">
              {payments.map((p) => {
                const meta = STATUS_META[p.status] || STATUS_META.created;
                const Icon = meta.icon;

                return (
                  <div key={p.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
                    <div className="min-w-0">
                      <p className="font-medium text-slate-100">{p.purpose}</p>
                      <p className="mt-0.5 font-mono text-xs text-slate-500">
                        {p.receiptId} · {new Date(p.createdAt).toLocaleString("en-IN")}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      <span className="font-display font-semibold text-white">₹{p.amount}</span>
                      <Badge tone={meta.tone}><Icon size={10} /> {meta.label}</Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        )}
      </Reveal>

      <AnimatePresence>
        {selected && (
          <PayModal fee={selected} onClose={() => setSelected(null)} onDone={load} />
        )}
      </AnimatePresence>
    </div>
    </PageLayout>
  );
}
