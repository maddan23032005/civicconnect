import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import { Server, Activity, Zap, RefreshCw, CheckCircle2, XCircle } from "lucide-react";
import { systemApi } from "../lib/api";
import { Reveal, Stagger, StaggerItem } from "../components/animation/Reveal";
import { Counter } from "../components/animation/Counter";
import { Card, Badge, Button } from "../components/ui";

const LABELS = {
  "auth-service": "Auth & Identity",
  "profile-service": "Citizen Profile",
  "document-service": "Documents",
  "payment-service": "Payments",
  "grievance-service": "Grievances",
  "notification-service": "Notifications",
  "ai-service": "AI & RAG",
};

export default function SystemHealth() {
  const [data, setData] = useState(null);
  const [history, setHistory] = useState([]);
  const [live, setLive] = useState(true);
  const timer = useRef(null);

  const poll = async () => {
    try {
      const res = await systemApi.health();
      setData(res);
      setHistory((h) => [...h.slice(-29), { t: Date.now(), up: res.summary.up }]);
    } catch {
      setData((d) => d);
    }
  };

  useEffect(() => {
    poll();
    if (live) timer.current = setInterval(poll, 3000);
    return () => clearInterval(timer.current);
  }, [live]);

  const up = data?.summary?.up ?? 0;
  const total = data?.summary?.total ?? 7;
  const pct = total ? (up / total) * 100 : 0;

  return (
    <div className="mx-auto max-w-6xl px-5 pb-20 pt-28 sm:px-8">
      <Reveal>
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold text-white sm:text-4xl">
              System health
            </h1>
            <p className="mt-1.5 text-slate-400">
              Live status of every service behind the portal
            </p>
          </div>
          <div className="flex items-center gap-3">
            {live && (
              <span className="inline-flex items-center gap-2 text-xs text-mint-500">
                <span className="relative flex h-2 w-2">
                  <span className="animate-pulse-ring absolute inline-flex h-full w-full rounded-full bg-mint-500" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-mint-500" />
                </span>
                Live · 3s
              </span>
            )}
            <Button variant="ghost" size="sm" onClick={() => setLive((l) => !l)}>
              <RefreshCw size={14} /> {live ? "Pause" : "Resume"}
            </Button>
          </div>
        </div>
      </Reveal>

      <Stagger className="mb-8 grid gap-4 sm:grid-cols-3">
        <StaggerItem>
          <Card className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-display text-3xl font-bold text-white">
                  {up}<span className="text-slate-600">/{total}</span>
                </p>
                <p className="mt-1 text-sm text-slate-500">Services online</p>
              </div>
              <Server size={20} className={up === total ? "text-mint-500" : "text-saffron-500"} />
            </div>
          </Card>
        </StaggerItem>

        <StaggerItem>
          <Card className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-display text-3xl font-bold text-white">
                  <Counter to={pct} suffix="%" decimals={0} duration={700} />
                </p>
                <p className="mt-1 text-sm text-slate-500">Availability</p>
              </div>
              <Activity size={20} className="text-navy-300" />
            </div>
          </Card>
        </StaggerItem>

        <StaggerItem>
          <Card className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-display text-lg font-bold text-white">
                  {data?.gateway?.instance || "—"}
                </p>
                <p className="mt-1 text-sm text-slate-500">Serving gateway</p>
              </div>
              <Zap size={20} className="text-saffron-500" />
            </div>
          </Card>
        </StaggerItem>
      </Stagger>

      {history.length > 3 && (
        <Reveal>
          <Card className="mb-8 p-6">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-500">
              Services online · last {history.length} checks
            </h2>
            <div className="flex h-20 items-end gap-1">
              {history.map((h, i) => (
                <motion.div
                  key={h.t}
                  initial={{ height: 0 }}
                  animate={{ height: `${(h.up / total) * 100}%` }}
                  transition={{ duration: 0.3 }}
                  className={`flex-1 rounded-t ${
                    h.up === total ? "bg-mint-500/70" : h.up === 0 ? "bg-rose-500/70" : "bg-saffron-500/70"
                  }`}
                  title={`${h.up}/${total}`}
                />
              ))}
            </div>
          </Card>
        </Reveal>
      )}

      <Reveal>
        <h2 className="mb-4 font-display text-xl font-semibold text-white">Services</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {(data?.services || []).map((s) => (
            <motion.div key={s.service} layout>
              <Card className={`p-5 ${s.status === "down" ? "border-rose-500/30 bg-rose-500/5" : ""}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      {s.status === "up" ? (
                        <CheckCircle2 size={16} className="text-mint-500" />
                      ) : (
                        <XCircle size={16} className="text-rose-500" />
                      )}
                      <p className="font-medium text-slate-100">
                        {LABELS[s.service] || s.service}
                      </p>
                    </div>
                    <p className="mt-1 pl-6 text-xs text-slate-500">
                      {s.service}
                      {s.uptimeSeconds != null &&
                        ` · up ${Math.floor(s.uptimeSeconds / 60)}m ${s.uptimeSeconds % 60}s`}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <Badge tone={s.status === "up" ? "mint" : "rose"}>{s.status}</Badge>
                    <p className="mt-1.5 text-xs text-slate-500">{s.latencyMs}ms</p>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </Reveal>

      <Reveal delay={0.1}>
        <Card className="mt-8 border-navy-500/20 bg-navy-500/5 p-6">
          <h3 className="mb-2 font-display font-semibold text-white">
            Why services can fail independently
          </h3>
          <p className="text-sm leading-relaxed text-slate-400">
            Each service runs as its own process with its own database. If one goes down,
            the API gateway returns a clear error for that feature only — every other part
            of the portal keeps serving citizens. Try stopping a service and watch this
            page update within three seconds while the rest of the site stays usable.
          </p>
        </Card>
      </Reveal>
    </div>
  );
}
