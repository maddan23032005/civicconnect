import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Sparkles, MessageSquareWarning, FileText, Bell, UserCircle,
  TrendingUp, ArrowRight, CheckCircle2, CreditCard,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { profileApi, grievanceApi, notificationApi } from "../lib/api";
import { Reveal, Stagger, StaggerItem } from "../components/animation/Reveal";
import { Counter } from "../components/animation/Counter";
import { Card, Button, Badge, Skeleton, EmptyState, STATUS_TONE, SEVERITY_TONE } from "../components/ui";

const QUICK_ACTIONS = [
  { icon: MessageSquareWarning, label: "File a grievance", desc: "Report civic issues directly to the right department", to: "/grievances/new", tone: "text-rose-500", bg: "bg-rose-500/10" },
  { icon: FileText, label: "My documents", desc: "View and manage your verified certificates", to: "/documents", tone: "text-mint-500", bg: "bg-mint-500/10" },
  { icon: CreditCard, label: "Pay service fees", desc: "Certificates, land tax, property tax & more", to: "/payments", tone: "text-navy-300", bg: "bg-navy-500/10" },
  { icon: Bell, label: "Notifications", desc: "Status updates from every department", to: "/notifications", tone: "text-saffron-500", bg: "bg-saffron-500/10" },
];

const SERVICES_SPOTLIGHT = [
  {
    icon: FileText,
    title: "Digital Document Locker",
    desc: "Upload Aadhaar, PAN, land records once. AI automatically verifies authenticity and pre-fills all future applications.",
    link: "/documents",
    tone: "text-mint-400",
    bg: "bg-mint-500/15"
  },
  {
    icon: MessageSquareWarning,
    title: "Smart Grievance Filing",
    desc: "Your complaint is auto-classified by severity, routed to the correct department, and SLA-tracked to resolution.",
    link: "/grievances/new",
    tone: "text-rose-400",
    bg: "bg-rose-500/15"
  },
  {
    icon: CreditCard,
    title: "Secure Online Payments",
    desc: "Pay fees for income certificates, land tax, trade licences and more via Razorpay. Download receipts instantly.",
    link: "/payments",
    tone: "text-navy-300",
    bg: "bg-navy-500/20"
  },
  {
    icon: Sparkles,
    title: "AI Scheme Advisor",
    desc: "Ask Sahayak which government schemes you qualify for. Answers are grounded in official documents, with citations.",
    link: "/dashboard",
    tone: "text-saffron-400",
    bg: "bg-saffron-500/15"
  },
];

export default function Dashboard() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [grievances, setGrievances] = useState([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [p, g, n] = await Promise.all([
          profileApi.mine(),
          grievanceApi.mine({ limit: 4 }),
          notificationApi.mine({ limit: 1, unreadOnly: true }),
        ]);
        setProfile(p.profile);
        setGrievances(g.grievances);
        setUnread(n.unreadCount);
      } catch {
        /* widgets degrade gracefully */
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const openCount = grievances.filter(
    (g) => !["resolved", "rejected"].includes(g.status)
  ).length;

  return (
    <div className="relative min-h-screen">

      {/* ── Hero with Background.png ── */}
      <div
        className="relative w-full bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/Background.png')", minHeight: "88vh" }}
      >
        {/* gradient overlay — darkens edges, keeps legibility */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/35 to-black/80" />

        {/* hero text */}
        <div className="relative mx-auto flex h-full max-w-7xl flex-col justify-center px-5 pb-48 pt-36 sm:px-8">
          <Reveal>
            <p className="mb-4 text-sm font-semibold uppercase tracking-[0.18em] text-saffron-400">
              Tamil Nadu · City Government Online Services
            </p>
            <h1 className="max-w-4xl font-display text-5xl font-extrabold leading-tight text-white sm:text-6xl lg:text-7xl">
              Good Governance is Part <br className="hidden sm:block" />
              <span className="text-gradient">of the Democracy</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-slate-300">
              Welcome back, <span className="font-semibold text-white">{user?.fullName?.split(" ")[0]}</span>.
              All your government services — documents, payments, grievances and AI scheme advice — in one place.
            </p>

            <div className="mt-10 flex flex-wrap gap-4">
              <Link to="/documents">
                <Button size="lg" className="rounded-none bg-saffron-500 font-semibold text-white hover:bg-saffron-400 border-none px-8">
                  My Documents →
                </Button>
              </Link>
              <Link to="/grievances/new">
                <Button size="lg" variant="ghost" className="rounded-none border border-white/30 px-8">
                  File a Grievance →
                </Button>
              </Link>
            </div>
          </Reveal>
        </div>
      </div>

      {/* ── Overlapping Service Cards ── */}
      <div className="relative z-10 mx-auto -mt-28 max-w-7xl px-5 sm:px-8">
        {profile && (
          <Stagger className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {SERVICES_SPOTLIGHT.map((card) => (
              <StaggerItem key={card.title}>
                <Link to={card.link}>
                  <Card hover className="group flex h-full flex-col p-7">
                    <div className={`mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl ${card.bg}`}>
                      <card.icon size={24} className={card.tone} />
                    </div>
                    <h3 className="mb-3 font-display text-base font-bold text-white group-hover:text-saffron-400 transition-colors">
                      {card.title}
                    </h3>
                    <p className="text-sm leading-relaxed text-slate-400">
                      {card.desc}
                    </p>
                    <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-saffron-400 opacity-0 transition-opacity group-hover:opacity-100">
                      Go <ArrowRight size={12} />
                    </div>
                  </Card>
                </Link>
              </StaggerItem>
            ))}
          </Stagger>
        )}
        {loading && (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {[0, 1, 2, 3].map(i => <Skeleton key={i} className="h-52 w-full" />)}
          </div>
        )}
      </div>

      {/* ── Dashboard functionality ── */}
      <div className="mx-auto max-w-7xl px-5 pb-24 pt-16 sm:px-8">

        {/* Stats row */}
        <Stagger className="grid gap-4 sm:grid-cols-3">
          {[
            { label: "Open grievances", value: openCount, icon: MessageSquareWarning, tone: "text-rose-500", bg: "bg-rose-500/10" },
            { label: "Unread notifications", value: unread, icon: Bell, tone: "text-saffron-500", bg: "bg-saffron-500/10" },
            { label: "Profile completeness", value: profile?.completeness ?? 0, suffix: "%", icon: TrendingUp, tone: "text-mint-500", bg: "bg-mint-500/10" },
          ].map((s) => (
            <StaggerItem key={s.label}>
              <Card className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-display text-3xl font-bold text-white">
                      {loading ? "—" : <Counter to={s.value} suffix={s.suffix || ""} duration={900} />}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">{s.label}</p>
                  </div>
                  <div className={`rounded-xl ${s.bg} p-3`}>
                    <s.icon size={20} className={s.tone} />
                  </div>
                </div>
              </Card>
            </StaggerItem>
          ))}
        </Stagger>

        {/* Profile completeness card */}
        <Reveal delay={0.05}>
          <Card className="mt-6 p-6">
            {loading ? (
              <Skeleton className="h-16 w-full" />
            ) : (
              <div className="flex flex-wrap items-center justify-between gap-5">
                <div className="flex flex-1 items-center gap-4 min-w-[260px]">
                  {profile?.photo ? (
                    <img src={profile.photo} alt="Profile" className="h-12 w-12 rounded-full object-cover shrink-0" />
                  ) : (
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-navy-500/15">
                      <UserCircle size={22} className="text-navy-300" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="mb-1.5 flex items-center justify-between">
                      <span className="text-sm font-medium text-slate-300">Profile completeness</span>
                      <span className="font-display text-base font-bold text-white">
                        <Counter to={profile?.completeness ?? 0} suffix="%" duration={1200} />
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-white/8">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-navy-500 to-saffron-500 transition-all duration-1000"
                        style={{ width: `${profile?.completeness ?? 0}%` }}
                      />
                    </div>
                    <p className="mt-1.5 text-xs text-slate-500">
                      {profile?.completeness >= 90
                        ? "Your profile is complete — Sahayak can verify all eligibility criteria."
                        : "Complete your profile so Sahayak can find all the schemes you qualify for."}
                    </p>
                  </div>
                </div>
                <Link to="/profile">
                  <Button variant="ghost" size="sm">
                    Update <ArrowRight size={14} />
                  </Button>
                </Link>
              </div>
            )}
          </Card>
        </Reveal>

        {/* AI prompt card */}
        <Reveal delay={0.08}>
          <Card className="relative mt-6 overflow-hidden p-7">
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-saffron-500/10 via-transparent to-navy-500/10" />
            <div className="relative flex flex-wrap items-center justify-between gap-5">
              <div className="flex items-start gap-4">
                <div className="rounded-xl bg-saffron-500/15 p-3">
                  <Sparkles size={22} className="text-saffron-500" />
                </div>
                <div>
                  <h3 className="font-display text-lg font-semibold text-white">
                    Not sure what schemes you qualify for?
                  </h3>
                  <p className="mt-1 max-w-md text-sm text-slate-400">
                    Ask <span className="font-medium text-saffron-400">Sahayak</span> — our AI advisor compares official eligibility criteria against your profile and cites every source.
                  </p>
                </div>
              </div>
              <p className="text-xs text-slate-500">
                Tap the <span className="font-medium text-white">Ask Sahayak</span> button →
              </p>
            </div>
          </Card>
        </Reveal>

        {/* Quick actions */}
        <Reveal delay={0.1}>
          <h2 className="mt-10 mb-4 font-display text-xl font-semibold text-white">Quick actions</h2>
        </Reveal>
        {QUICK_ACTIONS.length > 0 && (
          <Stagger className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {QUICK_ACTIONS.map((a) => (
              <StaggerItem key={a.label}>
                <Link to={a.to}>
                  <Card hover className="p-5 h-full">
                    <div className={`mb-3 inline-flex rounded-xl ${a.bg} p-2.5`}>
                      <a.icon size={19} className={a.tone} />
                    </div>
                    <p className="font-semibold text-slate-100">{a.label}</p>
                    <p className="mt-1 text-xs leading-relaxed text-slate-500">{a.desc}</p>
                  </Card>
                </Link>
              </StaggerItem>
            ))}
          </Stagger>
        )}

        {/* Recent grievances */}
        <Reveal delay={0.1}>
          <div className="mt-10 mb-4 flex items-center justify-between">
            <h2 className="font-display text-xl font-semibold text-white">Recent grievances</h2>
            <Link to="/grievances" className="text-sm text-navy-300 hover:text-navy-400 transition-colors">
              View all
            </Link>
          </div>

          <Card>
            {loading ? (
              <div className="space-y-3 p-5">
                {[0, 1, 2].map((i) => <Skeleton key={i} className="h-16 w-full" />)}
              </div>
            ) : grievances.length === 0 ? (
              <EmptyState
                icon={CheckCircle2}
                title="No grievances filed yet"
                message="When you report a civic issue, it's automatically classified and routed to the right department."
                action={
                  <Link to="/grievances/new">
                    <Button variant="ghost" size="sm">File a grievance</Button>
                  </Link>
                }
              />
            ) : (
              <div className="divide-y divide-white/6">
                {grievances.map((g) => (
                  <Link
                    key={g.id}
                    to={`/grievances/${g.ticketId}`}
                    className="flex items-center justify-between gap-4 px-5 py-4 transition hover:bg-white/3"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium text-slate-200">{g.subject}</p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {g.ticketId} · {g.department}
                      </p>
                    </div>
                    <div className="flex shrink-0 gap-2">
                      <Badge tone={SEVERITY_TONE[g.severity]}>{g.severity}</Badge>
                      <Badge tone={STATUS_TONE[g.status]}>{g.status.replace("_", " ")}</Badge>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </Card>
        </Reveal>
      </div>
    </div>
  );
}
