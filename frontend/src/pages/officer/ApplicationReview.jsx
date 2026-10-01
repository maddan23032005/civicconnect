import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Sparkles, Send, Building2, User, Clock } from "lucide-react";
import { grievanceApi } from "../../lib/api";
import { useToast } from "../../context/ToastContext";
import { Reveal } from "../../components/animation/Reveal";
import {
  Card, Button, Badge, Textarea, Select, Skeleton, STATUS_TONE, SEVERITY_TONE,
} from "../../components/ui";

export default function ApplicationReview() {
  const { ticketId } = useParams();
  const [g, setG] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState("in_progress");
  const [note, setNote] = useState("");

  const toast = useToast();
  const navigate = useNavigate();

  const load = () =>
    grievanceApi
      .one(ticketId)
      .then((r) => {
        setG(r.grievance);
        if (r.grievance.triage?.draftResponse) setNote(r.grievance.triage.draftResponse);
      })
      .catch((e) => toast.error(e.message))
      .finally(() => setLoading(false));

  useEffect(() => { load(); }, [ticketId]);

  const submit = async () => {
    setSaving(true);
    try {
      await grievanceApi.updateStatus(ticketId, {
        status,
        note: note.trim(),
        ...(status === "resolved" ? { resolution: note.trim() } : {}),
      });
      toast.success(`${ticketId} marked ${status.replace("_", " ")}`);
      navigate("/officer");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl space-y-4 px-5 pt-28 sm:px-8">
        <Skeleton className="h-10 w-2/3" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!g) return null;

  return (
    <div className="mx-auto max-w-4xl px-5 pb-20 pt-28 sm:px-8">
      <Link
        to="/officer"
        className="mb-6 inline-flex items-center gap-2 text-sm text-slate-400 transition hover:text-white"
      >
        <ArrowLeft size={15} /> Back to queue
      </Link>

      <Reveal>
        <div className="mb-6 flex flex-wrap gap-2">
          <Badge tone="neutral">{g.ticketId}</Badge>
          <Badge tone={SEVERITY_TONE[g.severity]}>{g.severity}</Badge>
          <Badge tone={STATUS_TONE[g.status]}>{g.status.replace("_", " ")}</Badge>
          {g.triage?.method === "ai" && (
            <Badge tone="saffron"><Sparkles size={10} /> AI triaged</Badge>
          )}
        </div>

        <h1 className="font-display text-2xl font-bold leading-snug text-white sm:text-3xl">
          {g.subject}
        </h1>

        <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm text-slate-500">
          <span className="inline-flex items-center gap-1.5">
            <User size={13} /> {g.citizenName} · {g.mobile}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Building2 size={13} /> {g.department}
          </span>
          {g.slaDueAt && (
            <span className="inline-flex items-center gap-1.5">
              <Clock size={13} /> Due {new Date(g.slaDueAt).toLocaleDateString("en-IN")}
            </span>
          )}
        </div>
      </Reveal>

      <div className="mt-8 grid gap-5 lg:grid-cols-5">
        <div className="space-y-5 lg:col-span-3">
          <Reveal delay={0.05}>
            <Card className="p-6">
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-500">
                Citizen's complaint
              </h2>
              <p className="whitespace-pre-wrap leading-relaxed text-slate-300">
                {g.description}
              </p>
            </Card>
          </Reveal>

          <Reveal delay={0.1}>
            <Card className="p-6">
              <h2 className="mb-5 text-sm font-semibold uppercase tracking-wider text-slate-500">
                Take action
              </h2>

              <div className="space-y-4">
                <Select
                  label="Set status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                >
                  <option value="in_progress">In progress</option>
                  <option value="resolved">Resolved</option>
                  <option value="rejected">Rejected</option>
                  <option value="triaged">Back to triaged</option>
                </Select>

                <Textarea
                  label="Message to citizen"
                  rows={5}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  hint={
                    g.triage?.draftResponse
                      ? "Pre-filled with the AI's draft — edit before sending"
                      : "This is sent to the citizen as a notification"
                  }
                />

                <Button onClick={submit} loading={saving} size="lg" className="w-full">
                  <Send size={16} /> Update and notify citizen
                </Button>
              </div>
            </Card>
          </Reveal>
        </div>

        <div className="space-y-5 lg:col-span-2">
          {g.triage?.method && (
            <Reveal delay={0.15}>
              <Card className="border-saffron-500/20 bg-saffron-500/5 p-5">
                <div className="mb-4 flex items-center gap-2">
                  <Sparkles size={15} className="text-saffron-500" />
                  <h3 className="text-sm font-semibold text-slate-200">Triage analysis</h3>
                </div>

                <dl className="space-y-3 text-sm">
                  {[
                    ["Category", g.category.replace("_", " ")],
                    ["Routed to", g.department],
                    ["Severity", g.severity],
                    ["Method", g.triage.method === "ai" ? "AI agent" : "Keyword rules"],
                    ["Confidence", g.triage.confidence != null ? `${(g.triage.confidence * 100).toFixed(0)}%` : "—"],
                  ].map(([k, v]) => (
                    <div key={k} className="flex justify-between gap-3">
                      <dt className="text-slate-500">{k}</dt>
                      <dd className="text-right capitalize text-slate-200">{v}</dd>
                    </div>
                  ))}
                </dl>

                {g.triage.reasoning && (
                  <p className="mt-4 border-t border-white/8 pt-4 text-sm leading-relaxed text-slate-400">
                    {g.triage.reasoning}
                  </p>
                )}
              </Card>
            </Reveal>
          )}

          <Reveal delay={0.2}>
            <Card className="p-5">
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-500">
                History
              </h3>
              <ol className="relative space-y-4 border-l border-white/10 pl-5">
                {g.timeline.map((t, i) => (
                  <li key={i} className="relative">
                    <span className="absolute -left-[26px] top-1.5 h-2 w-2 rounded-full bg-navy-500 ring-4 ring-ink-950" />
                    <p className="text-sm font-medium capitalize text-slate-200">
                      {t.status.replace("_", " ")}
                    </p>
                    {t.note && <p className="mt-0.5 text-xs text-slate-400">{t.note}</p>}
                    <p className="mt-0.5 text-xs text-slate-600">
                      {new Date(t.at).toLocaleString("en-IN")}
                    </p>
                  </li>
                ))}
              </ol>
            </Card>
          </Reveal>
        </div>
      </div>
    </div>
  );
}
