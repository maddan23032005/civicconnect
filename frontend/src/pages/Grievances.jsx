import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { MessageSquareWarning, Plus, Clock } from "lucide-react";
import { grievanceApi } from "../lib/api";
import { Reveal, Stagger, StaggerItem } from "../components/animation/Reveal";
import { Card, Button, Badge, Skeleton, EmptyState, STATUS_TONE, SEVERITY_TONE } from "../components/ui";
import { PageHeader } from "../components/layout/PageHeader";
import { PageLayout } from "../components/layout/PageLayout";

const FILTERS = [
  { label: "All", value: "" },
  { label: "Triaged", value: "triaged" },
  { label: "In progress", value: "in_progress" },
  { label: "Resolved", value: "resolved" },
];

export default function Grievances() {
  const [items, setItems] = useState([]);
  const [filter, setFilter] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    grievanceApi
      .mine({ limit: 50, ...(filter ? { status: filter } : {}) })
      .then((r) => setItems(r.grievances))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [filter]);

  return (
    <PageLayout>
    <div className="mx-auto max-w-5xl px-5 pb-20 pt-28 sm:px-8">
      <Reveal>
        <PageHeader
          icon={MessageSquareWarning}
          iconTone="text-rose-500"
          iconBg="bg-rose-500/10"
          title="My grievances"
          subtitle="Every complaint you've filed, with its current status and SLA tracking"
          action={
            <Link to="/grievances/new">
              <Button variant="saffron">
                <Plus size={17} /> File new
              </Button>
            </Link>
          }
        />
      </Reveal>

      <Reveal delay={0.05}>
        <div className="mb-6 flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                filter === f.value
                  ? "bg-navy-500 text-white"
                  : "glass text-slate-400 hover:text-white"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </Reveal>

      {loading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => <Skeleton key={i} className="h-28 w-full" />)}
        </div>
      ) : items.length === 0 ? (
        <Card>
          <EmptyState
            icon={MessageSquareWarning}
            title="Nothing here yet"
            message="When you file a grievance it appears here with live status tracking."
            action={
              <Link to="/grievances/new">
                <Button variant="ghost" size="sm">File your first grievance</Button>
              </Link>
            }
          />
        </Card>
      ) : (
        <Stagger className="space-y-3">
          {items.map((g) => {
            const overdue =
              g.slaDueAt &&
              new Date(g.slaDueAt) < new Date() &&
              !["resolved", "rejected"].includes(g.status);

            return (
              <StaggerItem key={g.id}>
                <Link to={`/grievances/${g.ticketId}`}>
                  <Card hover className="p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-slate-100">{g.subject}</p>
                        <p className="mt-1 text-xs text-slate-500">
                          {g.ticketId} · {g.department} ·{" "}
                          {new Date(g.createdAt).toLocaleDateString("en-IN")}
                        </p>
                      </div>
                      <div className="flex shrink-0 flex-wrap gap-2">
                        <Badge tone={SEVERITY_TONE[g.severity]}>{g.severity}</Badge>
                        <Badge tone={STATUS_TONE[g.status]}>
                          {g.status.replace("_", " ")}
                        </Badge>
                      </div>
                    </div>

                    <p className="mt-3 line-clamp-2 text-sm text-slate-400">
                      {g.description}
                    </p>

                    {g.slaDueAt && (
                      <p
                        className={`mt-3 inline-flex items-center gap-1.5 text-xs ${
                          overdue ? "text-rose-500" : "text-slate-500"
                        }`}
                      >
                        <Clock size={12} />
                        {overdue ? "Past due" : "Response due"}{" "}
                        {new Date(g.slaDueAt).toLocaleDateString("en-IN")}
                      </p>
                    )}
                  </Card>
                </Link>
              </StaggerItem>
            );
          })}
        </Stagger>
      )}
    </div>
    </PageLayout>
  );
}
