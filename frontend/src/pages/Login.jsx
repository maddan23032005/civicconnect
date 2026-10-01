import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Landmark, ArrowRight } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { Button, Input, Card } from "../components/ui";

export default function Login() {
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setError("");

    if (!/^[6-9]\d{9}$/.test(mobile)) {
      setError("Enter a valid 10-digit mobile number");
      return;
    }

    setLoading(true);
    try {
      const user = await login(mobile, password);
      toast.success(`Welcome back, ${user.fullName.split(" ")[0]}`);
      navigate(user.role === "officer" ? "/officer" : "/dashboard");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center px-5 pt-16">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="animate-aurora absolute left-1/4 top-1/4 h-96 w-96 rounded-full bg-navy-500/20 blur-[120px]" />
        <div className="animate-aurora absolute bottom-1/4 right-1/4 h-80 w-80 rounded-full bg-saffron-500/10 blur-[120px]" style={{ animationDelay: "7s" }} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55 }}
        className="w-full max-w-md"
      >
        <div className="mb-8 text-center">
          <div className="mb-4 inline-flex rounded-2xl bg-navy-500 p-3 glow-navy">
            <Landmark size={24} className="text-white" />
          </div>
          <h1 className="font-display text-2xl font-bold text-white">Welcome back</h1>
          <p className="mt-1.5 text-sm text-slate-400">
            Log in to your CivicConnect account
          </p>
        </div>

        <Card className="p-7">
          <form onSubmit={submit} className="space-y-5">
            <Input
              label="Mobile number"
              type="tel"
              inputMode="numeric"
              maxLength={10}
              placeholder="9876543210"
              value={mobile}
              onChange={(e) => setMobile(e.target.value.replace(/\D/g, ""))}
            />

            <Input
              label="Password"
              type="password"
              placeholder="Your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={error}
            />

            <Button type="submit" loading={loading} className="w-full" size="lg">
              Log in <ArrowRight size={17} />
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            Don&apos;t have an account?{" "}
            <Link to="/register" className="font-medium text-navy-300 hover:text-navy-400">
              Create one
            </Link>
          </p>
        </Card>
      </motion.div>
    </div>
  );
}
