import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Sparkles, ShieldCheck, Zap, FileText, MessageSquareWarning,
  CreditCard, Bell, UserCircle, ArrowRight, Server,
} from "lucide-react";
import { Reveal, Stagger, StaggerItem } from "../components/animation/Reveal";
import { Counter } from "../components/animation/Counter";
import { Button, Card, SectionHeading } from "../components/ui";

const STATS = [
  { value: 1700, suffix: "+", label: "Schemes searchable" },
  { value: 7, suffix: "", label: "Independent services" },
  { value: 99.9, suffix: "%", label: "Target availability", decimals: 1 },
  { value: 3, suffix: "s", label: "Average AI response" },
];

const SERVICES = [
  { icon: UserCircle, title: "One citizen profile", body: "Fill your details once. Every application pre-fills from it automatically.", tone: "text-navy-300" },
  { icon: Sparkles, title: "AI scheme advisor", body: "Ask in plain language and find out what you qualify for, with sources cited.", tone: "text-saffron-500" },
  { icon: FileText, title: "Digital document locker", body: "Store certificates once, attach them to any application in a single tap.", tone: "text-mint-500" },
  { icon: MessageSquareWarning, title: "Smart grievances", body: "Complaints are auto-classified, routed to the right department and SLA-tracked.", tone: "text-rose-500" },
  { icon: CreditCard, title: "Secure payments", body: "Pay application fees and download receipts, backed by transactional integrity.", tone: "text-navy-300" },
  { icon: Bell, title: "Live notifications", body: "Every status change reaches you the moment it happens, across all departments.", tone: "text-saffron-500" },
];

const STEPS = [
  { n: "01", title: "Create your account", body: "Register with your mobile number and a one-time password. Takes under a minute." },
  { n: "02", title: "Complete your profile", body: "Age, district, occupation, income and category — entered once, used everywhere." },
  { n: "03", title: "Ask what you qualify for", body: "Scheme Sahayak compares your details against official eligibility criteria and cites its sources." },
  { n: "04", title: "Apply and track", body: "Submit applications, pay fees, raise grievances and follow every status change in one dashboard." },
];

export default function Landing() {
  return (
    <div className="relative overflow-hidden">
      {/* aurora background */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="animate-aurora absolute -left-40 -top-40 h-[34rem] w-[34rem] rounded-full bg-navy-500/25 blur-[120px]" />
        <div className="animate-aurora absolute -right-40 top-40 h-[30rem] w-[30rem] rounded-full bg-saffron-500/15 blur-[120px]" style={{ animationDelay: "6s" }} />
        <div className="animate-aurora absolute bottom-0 left-1/3 h-[26rem] w-[26rem] rounded-full bg-mint-500/10 blur-[120px]" style={{ animationDelay: "12s" }} />
      </div>

      {/* HERO */}
      <section className="mx-auto flex min-h-screen max-w-7xl flex-col justify-center px-5 pt-24 sm:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="max-w-3xl"
        >
          <div className="glass mb-7 inline-flex items-center gap-2 rounded-full px-4 py-1.5">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-pulse-ring absolute inline-flex h-full w-full rounded-full bg-mint-500" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-mint-500" />
            </span>
            <span className="text-xs font-medium text-slate-300">
              Distributed architecture · AI-assisted · Built for scale
            </span>
          </div>

          <h1 className="font-display text-5xl font-extrabold leading-[1.05] tracking-tight text-white sm:text-6xl lg:text-7xl">
            Government services,
            <br />
            <span className="text-gradient">finally simplified.</span>
          </h1>

          <p className="mt-7 max-w-2xl text-lg leading-relaxed text-slate-400">
            One login for every department. An AI advisor that tells you which schemes
            you actually qualify for — and cites the official document for every
            claim it makes.
          </p>

          <div className="mt-10 flex flex-wrap gap-4">
            <Link to="/register">
              <Button variant="saffron" size="lg">
                Get started free <ArrowRight size={18} />
              </Button>
            </Link>
            <a href="#ai">
              <Button variant="ghost" size="lg">
                <Sparkles size={18} /> See the AI in action
              </Button>
            </a>
          </div>

          <Stagger className="mt-20 grid grid-cols-2 gap-8 sm:grid-cols-4">
            {STATS.map((s) => (
              <StaggerItem key={s.label}>
                <p className="font-display text-3xl font-bold text-white sm:text-4xl">
                  <Counter to={s.value} suffix={s.suffix} decimals={s.decimals || 0} />
                </p>
                <p className="mt-1.5 text-sm text-slate-500">{s.label}</p>
              </StaggerItem>
            ))}
          </Stagger>
        </motion.div>
      </section>

      {/* SERVICES */}
      <section id="services" className="mx-auto max-w-7xl px-5 py-28 sm:px-8">
        <Reveal>
          <SectionHeading
            eyebrow="What you can do"
            title="Every service, one place"
            subtitle="Six independent microservices behind a single, coherent experience — each scaling and failing independently."
            center
          />
        </Reveal>

        <Stagger className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {SERVICES.map((s) => (
            <StaggerItem key={s.title}>
              <Card hover className="h-full p-6">
                <div className="mb-4 inline-flex rounded-xl bg-white/5 p-3">
                  <s.icon size={22} className={s.tone} />
                </div>
                <h3 className="mb-2 font-display text-lg font-semibold text-white">
                  {s.title}
                </h3>
                <p className="text-sm leading-relaxed text-slate-400">{s.body}</p>
              </Card>
            </StaggerItem>
          ))}
        </Stagger>
      </section>

      {/* AI */}
      <section id="ai" className="mx-auto max-w-7xl px-5 py-28 sm:px-8">
        <div className="grid items-center gap-14 lg:grid-cols-2">
          <Reveal direction="right">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-saffron-500">
              Scheme Sahayak
            </p>
            <h2 className="font-display text-3xl font-bold leading-tight text-white sm:text-4xl">
              An AI that admits what it doesn&apos;t know
            </h2>
            <p className="mt-5 leading-relaxed text-slate-400">
              Most chatbots guess. Sahayak retrieves the actual scheme document, answers
              only from it, cites the section, and compares each criterion against your
              profile — telling you plainly which ones it could not verify.
            </p>

            <div className="mt-8 space-y-4">
              {[
                { icon: ShieldCheck, title: "Grounded in official sources", body: "Every claim cites the scheme document and section it came from." },
                { icon: Zap, title: "Automatic provider failover", body: "If the primary model is unavailable, a second provider answers instead." },
                { icon: Server, title: "Privacy by design", body: "Aadhaar, PAN and mobile numbers are stripped before anything leaves the system." },
              ].map((f) => (
                <div key={f.title} className="flex gap-4">
                  <div className="h-fit rounded-lg bg-navy-500/15 p-2">
                    <f.icon size={17} className="text-navy-300" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-200">{f.title}</h4>
                    <p className="mt-0.5 text-sm text-slate-500">{f.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </Reveal>

          <Reveal direction="left" delay={0.15}>
            <Card className="p-6">
              <div className="mb-5 flex items-center gap-2 border-b border-white/10 pb-4">
                <Sparkles size={16} className="text-saffron-500" />
                <span className="text-sm font-medium text-slate-300">Example answer</span>
              </div>

              <div className="space-y-4">
                <div className="flex justify-end">
                  <div className="max-w-[85%] rounded-2xl rounded-br-md bg-navy-500 px-4 py-2.5 text-sm text-white">
                    I am a 62 year old farmer. What pension can I get?
                  </div>
                </div>

                <div className="glass rounded-2xl rounded-bl-md px-4 py-3">
                  <p className="text-sm leading-relaxed text-slate-300">
                    You may qualify under IGNOAPS, which pays Rs. 1,200 per month for
                    applicants aged 60 to 79 <span className="text-navy-300">[3]</span>.
                    At 62 you meet the age criterion. I cannot verify your BPL status or
                    household income from your profile — please confirm those at your
                    e-Sevai centre.
                  </p>
                </div>

                <div className="flex items-center gap-1.5 text-[11px] text-mint-500">
                  <ShieldCheck size={12} /> Verified against official documents · 3.5s
                </div>
              </div>
            </Card>
          </Reveal>
        </div>
      </section>

      {/* HOW */}
      <section id="how" className="mx-auto max-w-7xl px-5 py-28 sm:px-8">
        <Reveal>
          <SectionHeading eyebrow="How it works" title="Four steps, start to finish" center />
        </Reveal>

        <Stagger className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s) => (
            <StaggerItem key={s.n}>
              <Card className="h-full p-6">
                <span className="font-display text-4xl font-extrabold text-white/10">
                  {s.n}
                </span>
                <h3 className="mb-2 mt-3 font-display text-lg font-semibold text-white">
                  {s.title}
                </h3>
                <p className="text-sm leading-relaxed text-slate-400">{s.body}</p>
              </Card>
            </StaggerItem>
          ))}
        </Stagger>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-5 pb-28 sm:px-8">
        <Reveal>
          <Card className="relative overflow-hidden p-12 text-center sm:p-16">
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-navy-500/15 via-transparent to-saffron-500/10" />
            <div className="relative">
              <h2 className="font-display text-3xl font-bold text-white sm:text-4xl">
                Find out what you qualify for
              </h2>
              <p className="mx-auto mt-4 max-w-lg text-slate-400">
                Create an account in under a minute. No paperwork, no queue,
                no department-by-department searching.
              </p>
              <Link to="/register" className="mt-8 inline-block">
                <Button variant="saffron" size="lg">
                  Create your account <ArrowRight size={18} />
                </Button>
              </Link>
            </div>
          </Card>
        </Reveal>
      </section>
    </div>
  );
}
