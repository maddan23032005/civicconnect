import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { MessageSquareWarning, Sparkles, ArrowRight } from "lucide-react";
import { grievanceApi } from "../lib/api";
import { useToast } from "../context/ToastContext";
import { Reveal } from "../components/animation/Reveal";
import { Button, Input, Textarea, Card } from "../components/ui";
import { PageHeader } from "../components/layout/PageHeader";
import { PageLayout } from "../components/layout/PageLayout";

const DISTRICTS = [
  "Chennai", "Coimbatore", "Cuddalore", "Dindigul", "Erode", "Kanchipuram",
  "Kanyakumari", "Karur", "Madurai", "Nagapattinam", "Namakkal", "Salem",
  "Thanjavur", "Theni", "Tiruchirappalli", "Tirunelveli", "Tiruppur",
  "Tiruvallur", "Vellore", "Villupuram", "Virudhunagar",
];

export default function NewGrievance() {
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [district, setDistrict] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const toast = useToast();
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setError("");

    if (subject.trim().length < 5) return setError("Subject must be at least 5 characters");
    if (description.trim().length < 20) return setError("Please describe the issue in at least 20 characters");

    setLoading(true);
    try {
      const res = await grievanceApi.create({
        subject: subject.trim(),
        description: description.trim(),
        ...(district ? { district } : {}),
      });
      toast.success(`Grievance ${res.grievance.ticketId} filed and routed`);
      navigate(`/grievances/${res.grievance.ticketId}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageLayout>
    <div className="mx-auto max-w-3xl px-5 pb-20 pt-28 sm:px-8">
      <Reveal>
        <PageHeader
          icon={MessageSquareWarning}
          iconTone="text-rose-500"
          iconBg="bg-rose-500/10"
          title="File a grievance"
          subtitle="Describe the problem. AI will classify, route it to the right department, and set an SLA deadline automatically."
        />
      </Reveal>

      <Reveal delay={0.05}>
        <Card className="mb-6 border-saffron-500/20 bg-saffron-500/5 p-5">
          <div className="flex gap-3">
            <Sparkles size={18} className="mt-0.5 shrink-0 text-saffron-500" />
            <p className="text-sm leading-relaxed text-slate-300">
              An AI agent reads your complaint, assigns a category and severity, routes it
              to the correct department and sets a response deadline — usually within a
              few seconds of submission.
            </p>
          </div>
        </Card>
      </Reveal>

      <Reveal delay={0.1}>
        <Card className="p-7">
          <form onSubmit={submit} className="space-y-5">
            <Input
              label="Subject"
              placeholder="e.g. No drinking water supply for five days"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              maxLength={150}
              hint={`${subject.length}/150`}
            />

            <Textarea
              label="Describe the issue"
              rows={7}
              placeholder="Explain what happened, when it started, how many people are affected, and anything you have already tried."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={3000}
              hint={`${description.length}/3000 — more detail helps the AI route it correctly`}
            />

            <div className="w-full">
              <label className="mb-1.5 block text-sm font-medium text-slate-300">
                District (optional)
              </label>
              <select
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-ink-800/60 px-4 py-3 text-slate-100 outline-none transition focus:border-navy-500 focus:ring-2 focus:ring-navy-500/20"
              >
                <option value="">Select your district</option>
                {DISTRICTS.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            {error && <p className="text-sm text-rose-500">{error}</p>}

            <Button type="submit" loading={loading} size="lg" className="w-full">
              Submit grievance <ArrowRight size={17} />
            </Button>
          </form>
        </Card>
      </Reveal>
    </div>
    </PageLayout>
  );
}
