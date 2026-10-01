import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Landmark, ArrowRight, ArrowLeft, ShieldCheck } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { authApi } from "../lib/api";
import { Button, Input, Card } from "../components/ui";

export default function Register() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [devOtp, setDevOtp] = useState(null);

  const [form, setForm] = useState({
    mobile: "",
    fullName: "",
    email: "",
    otp: "",
    password: "",
    confirm: "",
  });

  const { register } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const sendOtp = async (e) => {
    e.preventDefault();
    setError("");

    if (!/^[6-9]\d{9}$/.test(form.mobile)) return setError("Enter a valid 10-digit mobile number");
    if (form.fullName.trim().length < 2) return setError("Enter your full name");

    setLoading(true);
    try {
      const res = await authApi.sendOtp(form.mobile);
      setDevOtp(res.devOtp || null);
      toast.success(`OTP sent to ${form.mobile}`);
      setStep(2);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const complete = async (e) => {
    e.preventDefault();
    setError("");

    if (!/^\d{6}$/.test(form.otp)) return setError("Enter the 6-digit OTP");
    if (form.password.length < 8) return setError("Password must be at least 8 characters");
    if (form.password !== form.confirm) return setError("Passwords do not match");

    setLoading(true);
    try {
      const user = await register({
        mobile: form.mobile,
        otp: form.otp,
        password: form.password,
        fullName: form.fullName.trim(),
        ...(form.email ? { email: form.email } : {}),
      });
      toast.success(`Account created. Welcome, ${user.fullName.split(" ")[0]}`);
      navigate("/dashboard");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center px-5 py-24">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="animate-aurora absolute right-1/4 top-1/3 h-96 w-96 rounded-full bg-saffron-500/15 blur-[120px]" />
        <div className="animate-aurora absolute bottom-1/4 left-1/4 h-80 w-80 rounded-full bg-navy-500/20 blur-[120px]" style={{ animationDelay: "8s" }} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55 }}
        className="w-full max-w-md"
      >
        <div className="mb-8 text-center">
          <div className="mb-4 inline-flex rounded-2xl bg-saffron-500 p-3">
            <Landmark size={24} className="text-ink-950" />
          </div>
          <h1 className="font-display text-2xl font-bold text-white">
            {step === 1 ? "Create your account" : "Verify your number"}
          </h1>
          <p className="mt-1.5 text-sm text-slate-400">
            {step === 1
              ? "One account for every government department"
              : `We sent a 6-digit code to ${form.mobile}`}
          </p>
        </div>

        <div className="mb-6 flex gap-2">
          {[1, 2].map((s) => (
            <div
              key={s}
              className={`h-1 flex-1 rounded-full transition-colors duration-400 ${
                step >= s ? "bg-saffron-500" : "bg-white/10"
              }`}
            />
          ))}
        </div>

        <Card className="p-7">
          <AnimatePresence mode="wait">
            {step === 1 ? (
              <motion.form
                key="step1"
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 16 }}
                onSubmit={sendOtp}
                className="space-y-5"
              >
                <Input
                  label="Full name"
                  placeholder="As printed on your Aadhaar"
                  value={form.fullName}
                  onChange={set("fullName")}
                />
                <Input
                  label="Mobile number"
                  type="tel"
                  inputMode="numeric"
                  maxLength={10}
                  placeholder="9876543210"
                  value={form.mobile}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, mobile: e.target.value.replace(/\D/g, "") }))
                  }
                />
                <Input
                  label="Email (optional)"
                  type="email"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={set("email")}
                  error={error}
                />

                <Button type="submit" variant="saffron" loading={loading} className="w-full" size="lg">
                  Send OTP <ArrowRight size={17} />
                </Button>
              </motion.form>
            ) : (
              <motion.form
                key="step2"
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                onSubmit={complete}
                className="space-y-5"
              >
                {devOtp && (
                  <div className="flex items-center gap-2 rounded-xl border border-mint-500/25 bg-mint-500/10 px-4 py-2.5">
                    <ShieldCheck size={15} className="text-mint-500" />
                    <p className="text-xs text-mint-500">
                      Demo mode — your OTP is <strong>{devOtp}</strong>
                    </p>
                  </div>
                )}

                <Input
                  label="6-digit OTP"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="000000"
                  className="text-center text-2xl tracking-[0.4em]"
                  value={form.otp}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, otp: e.target.value.replace(/\D/g, "") }))
                  }
                />
                <Input
                  label="Create password"
                  type="password"
                  placeholder="At least 8 characters"
                  value={form.password}
                  onChange={set("password")}
                />
                <Input
                  label="Confirm password"
                  type="password"
                  placeholder="Re-enter your password"
                  value={form.confirm}
                  onChange={set("confirm")}
                  error={error}
                />

                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => { setStep(1); setError(""); }}
                    size="lg"
                  >
                    <ArrowLeft size={17} />
                  </Button>
                  <Button type="submit" variant="saffron" loading={loading} className="flex-1" size="lg">
                    Create account
                  </Button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>

          <p className="mt-6 text-center text-sm text-slate-500">
            Already registered?{" "}
            <Link to="/login" className="font-medium text-navy-300 hover:text-navy-400">
              Log in
            </Link>
          </p>
        </Card>
      </motion.div>
    </div>
  );
}
