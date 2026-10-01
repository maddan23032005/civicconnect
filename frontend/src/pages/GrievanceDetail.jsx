import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Sparkles, Clock, Building2, CheckCircle2 } from "lucide-react";
import { grievanceApi } from "../lib/api";
import { Reveal } from "../components/animation/Reveal";
import { Card, Badge, Skeleton, STATUS_TONE, SEVERITY_TONE } from "../components/ui";
import { PageLayout } from "../components/layout/PageLayout";

export default function GrievanceDetail() {
  const { ticketId } = useParams();
  const [g, setG] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    grievanceApi
      .one(ticketId)
      .then((r) => setG(r.grievance))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [ticketId]);

  if (loading) {
    return (
      <PageLayout>
      <div className="mx-auto max-w-3xl space-y-4 px-5 pt-28 sm:px-8">
        <Skeleton className="h-10 w-2/3" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-56 w-full" />
      </div>
      </PageLayout>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-3xl px-5 pt-28 text-center sm:px-8">
        <p className="text-rose-500">{error}</p>
        <Link to="/grievances" className="mt-4 inline-block text-navy-300">
          Back to grievances
        </Link>
      </div>
    );
  }

  return (
    <PageLayout>
    <div className="mx-auto max-w-3xl px-5 pb-20 pt-28 sm:px-8">
      <Link
        to="/grievances"
        className="mb-6 inline-flex items-center gap-2 text-sm text-slate-400 transition hover:text-white"
      >
        <ArrowLeft size={15} /> All grievances
      </Link>

      <Reveal>
        <div className="mb-6">
          <div className="mb-3 flex flex-wrap gap-2">
            <Badge tone="neutral">{g.ticketId}</Badge>
            <Badge tone={SEVERITY_TONE[g.severity]}>{g.severity}</Badge>
            <Badge tone={STATUS_TONE[g.status]}>{g.status.replace("_", " ")}</Badge>
          </div>
          <h1 className="font-display text-2xl font-bold leading-snug text-white sm:text-3xl">
            {g.subject}
          </h1>
          <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500">
            <span className="inline-flex items-center gap-1.5">
              <Building2 size={13} /> {g.department}
            </span>
            {g.slaDueAt && (
              <span className="inline-flex items-center gap-1.5">
                <Clock size={13} /> Due {new Date(g.slaDueAt).toLocaleDateString("en-IN")}
              </span>
            )}
          </p>
        </div>
      </Reveal>

      <Reveal delay={0.05}>
        <Card className="mb-5 p-6">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-500">
            Your complaint
          </h2>
          <p className="whitespace-pre-wrap leading-relaxed text-slate-300">
            {g.description}
          </p>
        </Card>
      </Reveal>

      {g.triage?.method && (
        <Reveal delay={0.1}>
          <Card className="mb-5 border-saffron-500/20 bg-saffron-500/5 p-6">
            <div className="mb-4 flex items-center gap-2">
              <Sparkles size={16} className="text-saffron-500" />
              <h2 className="text-sm font-semibold text-slate-200">
                {g.triage.method === "ai" ? "AI triage" : "Rule-based triage"}
              </h2>
              {g.triage.confidence != null && (
                <Badge tone="saffron">
                  {(g.triage.confidence * 100).toFixed(0)}% confidence
                </Badge>
              )}
            </div>

            <dl className="mb-4 grid gap-4 sm:grid-cols-3">
              {[
                ["Category", g.category.replace("_", " ")],
                ["Department", g.department],
                ["Severity", g.severity],
              ].map(([k, v]) => (
                <div key={k}>
                  <dt className="text-xs text-slate-500">{k}</dt>
                  <dd className="mt-0.5 text-sm font-medium capitalize text-slate-200">{v}</dd>
                </div>
              ))}
            </dl>

            {g.triage.reasoning && (
              <p className="border-t border-white/8 pt-4 text-sm leading-relaxed text-slate-400">
                <span className="text-slate-500">Reasoning: </span>
                {g.triage.reasoning}
              </p>
            )}

            {g.triage.draftResponse && (
              <div className="mt-4 rounded-xl bg-white/4 p-4">
                <p className="mb-1.5 text-xs font-medium uppercase tracking-wider text-slate-500">
                  Acknowledgement
                </p>
                <p className="text-sm leading-relaxed text-slate-300">
                  {g.triage.draftResponse}
                </p>
              </div>
            )}
          </Card>
        </Reveal>
      )}

      <Reveal delay={0.15}>
        <Card className="p-6">
          <h2 className="mb-5 text-sm font-semibold uppercase tracking-wider text-slate-500">
            Timeline
          </h2>
          <ol className="relative space-y-6 border-l border-white/10 pl-6">
            {g.timeline.map((t, i) => (
              <motion.li
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + i * 0.1 }}
                className="relative"
              >
                <span className="absolute -left-[31px] top-1 flex h-3 w-3 items-center justify-center">
                  <span
                    className={`h-3 w-3 rounded-full ring-4 ring-ink-950 ${
                      i === g.timeline.length - 1 ? "bg-saffron-500" : "bg-navy-500"
                    }`}
                  />
                </span>
                <p className="text-sm font-medium capitalize text-slate-200">
                  {t.status.replace("_", " ")}
                </p>
                {t.note && <p className="mt-0.5 text-sm text-slate-400">{t.note}</p>}
                <p className="mt-1 text-xs text-slate-600">
                  {new Date(t.at).toLocaleString("en-IN")} · {t.actorRole}
                </p>
              </motion.li>
            ))}
          </ol>

          {g.status === "resolved" && g.resolution && (
            <div className="mt-6 flex gap-3 rounded-xl border border-mint-500/25 bg-mint-500/10 p-4">
              <CheckCircle2 size={17} className="mt-0.5 shrink-0 text-mint-500" />
              <div>
                <p className="text-sm font-medium text-mint-500">Resolved</p>
                <p className="mt-0.5 text-sm text-slate-300">{g.resolution}</p>
              </div>
            </div>
          )}
        </Card>
      </Reveal>
    </div>
    </PageLayout>
  );
}
