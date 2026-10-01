import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Building2, AlertTriangle, CheckCircle2, Clock, TrendingUp, Sparkles,
} from "lucide-react";
import { grievanceApi } from "../../lib/api";
import { Reveal, Stagger, StaggerItem } from "../../components/animation/Reveal";
import { Counter } from "../../components/animation/Counter";
import {
  Card, Badge, Skeleton, EmptyState, STATUS_TONE, SEVERITY_TONE,
} from "../../components/ui";

export default function OfficerDashboard() {
  const [stats, setStats] = useState(null);
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([grievanceApi.stats(), grievanceApi.queue({ limit: 12 })])
      .then(([s, q]) => { setStats(s.stats); setQueue(q.grievances); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const cards = [
    { label: "Total grievances", value: stats?.total ?? 0, icon: Building2, tone: "text-navy-300" },
    { label: "Awaiting action", value: (stats?.byStatus?.triaged ?? 0) + (stats?.byStatus?.in_progress ?? 0), icon: Clock, tone: "text-saffron-500" },
    { label: "Past SLA", value: stats?.overdue ?? 0, icon: AlertTriangle, tone: "text-rose-500" },
    { label: "Resolved", value: stats?.byStatus?.resolved ?? 0, icon: CheckCircle2, tone: "text-mint-500" },
  ];

  return (
    <div className="mx-auto max-w-7xl px-5 pb-20 pt-28 sm:px-8">
      <Reveal>
        <div className="mb-8">
          <Badge tone="navy" className="mb-3">Officer view</Badge>
          <h1 className="font-display text-3xl font-bold text-white sm:text-4xl">
            Department dashboard
          </h1>
          <p className="mt-1.5 text-slate-400">
            Grievances pre-classified and routed by the triage agent
          </p>
        </div>
      </Reveal>

      <Stagger className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <StaggerItem key={c.label}>
            <Card className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-display text-3xl font-bold text-white">
                    <Counter to={c.value} duration={1000} />
                  </p>
                  <p className="mt-1 text-sm text-slate-500">{c.label}</p>
                </div>
                <c.icon size={20} className={c.tone} />
              </div>
            </Card>
          </StaggerItem>
        ))}
      </Stagger>

      {stats?.byDepartment && Object.keys(stats.byDepartment).length > 0 && (
        <Reveal delay={0.05}>
          <Card className="mb-8 p-6">
            <h2 className="mb-5 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-slate-500">
              <TrendingUp size={14} /> Load by department
            </h2>
            <div className="space-y-3">
              {Object.entries(stats.byDepartment)
                .sort((a, b) => b[1] - a[1])
                .map(([dept, count]) => {
                  const pct = stats.total ? (count / stats.total) * 100 : 0;
                  return (
                    <div key={dept}>
                      <div className="mb-1.5 flex justify-between text-sm">
                        <span className="text-slate-300">{dept}</span>
                        <span className="text-slate-500">{count}</span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-white/8">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-navy-500 to-navy-300 transition-all duration-1000"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
            </div>
          </Card>
        </Reveal>
      )}

      <Reveal delay={0.1}>
        <h2 className="mb-4 font-display text-xl font-semibold text-white">
          Triage queue
        </h2>

        {loading ? (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => <Skeleton key={i} className="h-24 w-full" />)}
          </div>
        ) : queue.length === 0 ? (
          <Card>
            <EmptyState
              icon={CheckCircle2}
              title="Queue is clear"
              message="No grievances are currently awaiting action."
            />
          </Card>
        ) : (
          <Stagger className="space-y-3">
            {queue.map((g) => {
              const overdue =
                g.slaDueAt &&
                new Date(g.slaDueAt) < new Date() &&
                !["resolved", "rejected"].includes(g.status);

              return (
                <StaggerItem key={g.id}>
                  <Link to={`/officer/grievances/${g.ticketId}`}>
                    <Card hover className={`p-5 ${overdue ? "border-rose-500/30" : ""}`}>
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-slate-100">{g.subject}</p>
                          <p className="mt-1 text-xs text-slate-500">
                            {g.ticketId} · {g.citizenName} · {g.district || "district not set"}
                          </p>
                        </div>
                        <div className="flex shrink-0 flex-wrap gap-2">
                          {g.triage?.method === "ai" && (
                            <Badge tone="saffron">
                              <Sparkles size={10} /> AI
                            </Badge>
                          )}
                          <Badge tone={SEVERITY_TONE[g.severity]}>{g.severity}</Badge>
                          <Badge tone={STATUS_TONE[g.status]}>
                            {g.status.replace("_", " ")}
                          </Badge>
                        </div>
                      </div>

                      {g.triage?.reasoning && (
                        <p className="mt-3 border-l-2 border-saffron-500/40 pl-3 text-sm italic text-slate-400">
                          {g.triage.reasoning}
                        </p>
                      )}

                      {overdue && (
                        <p className="mt-3 inline-flex items-center gap-1.5 text-xs text-rose-500">
                          <AlertTriangle size={12} /> Past SLA deadline
                        </p>
                      )}
                    </Card>
                  </Link>
                </StaggerItem>
              );
            })}
          </Stagger>
        )}
      </Reveal>
    </div>
  );
}
