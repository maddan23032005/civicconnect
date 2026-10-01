import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Send, X, FileText, ShieldCheck, AlertTriangle, Info } from "lucide-react";
import { aiApi } from "../../lib/api";

const SUGGESTIONS = [
  "I am a 62 year old farmer. What pension can I get?",
  "What documents do I need for an income certificate?",
  "Am I eligible for crop insurance?",
  "How do I transfer land patta to my name?",
];

function SourceChip({ source }) {
  return (
    <div className="glass flex items-start gap-2 rounded-lg px-3 py-2">
      <FileText size={13} className="mt-0.5 shrink-0 text-navy-300" />
      <div className="min-w-0">
        <p className="truncate text-xs font-medium text-slate-300">
          [{source.ref}] {source.schemeName}
        </p>
        <p className="text-[11px] text-slate-500">
          {source.section}
          {source.score != null && ` · match ${(source.score * 100).toFixed(0)}%`}
        </p>
      </div>
    </div>
  );
}

function Message({ msg }) {
  if (msg.role === "user") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] rounded-2xl rounded-br-md bg-navy-500 px-4 py-2.5 text-sm text-white">
          {msg.text}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      <div className="glass max-w-[92%] rounded-2xl rounded-bl-md px-4 py-3">
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-200">
          {msg.text}
        </p>
      </div>

      {msg.grounded != null && (
        <div className="flex flex-wrap items-center gap-2 pl-1">
          {msg.grounded ? (
            <span className="inline-flex items-center gap-1.5 text-[11px] text-mint-500">
              <ShieldCheck size={12} /> Verified against official documents
            </span>
          ) : msg.intent === "general" ? (
            <span className="inline-flex items-center gap-1.5 text-[11px] text-slate-500">
              <Info size={12} /> General knowledge — not from official scheme documents
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-[11px] text-saffron-500">
              <AlertTriangle size={12} /> Not found in available documents
            </span>
          )}
          {msg.latencyMs && (
            <span className="text-[11px] text-slate-600">
              {(msg.latencyMs / 1000).toFixed(1)}s
            </span>
          )}
        </div>
      )}

      {msg.sources?.length > 0 && (
        <div className="space-y-1.5 pl-1">
          <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
            Sources
          </p>
          {msg.sources.map((s) => (
            <SourceChip key={s.ref} source={s} />
          ))}
        </div>
      )}
    </div>
  );
}

export function ChatPanel() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const send = async (question) => {
    const q = (question ?? input).trim();
    if (!q || loading) return;

    setMessages((m) => [...m, { role: "user", text: q }]);
    setInput("");
    setLoading(true);

    try {
      const res = await aiApi.ask(q);
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          text: res.answer,
          sources: res.sources,
          grounded: res.grounded,
          intent: res.intent,
          latencyMs: res.latencyMs,
        },
      ]);
    } catch (err) {
      setMessages((m) => [
        ...m,
        { role: "assistant", text: `Sorry — ${err.message}`, grounded: false },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <motion.button
        onClick={() => setOpen(true)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2 rounded-2xl bg-saffron-500 px-5 py-3.5 font-semibold text-ink-950 shadow-2xl shadow-saffron-500/30"
      >
        <span className="relative flex h-2 w-2">
          <span className="animate-pulse-ring absolute inline-flex h-full w-full rounded-full bg-ink-950 opacity-60" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-ink-950" />
        </span>
        <Sparkles size={17} />
        Ask Sahayak
      </motion.button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            />

            <motion.aside
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 32, stiffness: 280 }}
              className="fixed inset-y-0 right-0 z-50 flex w-full max-w-lg flex-col border-l border-white/10 bg-ink-900"
            >
              <header className="flex items-center justify-between border-b border-white/10 px-5 py-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-saffron-500/15 p-2">
                    <Sparkles size={18} className="text-saffron-500" />
                  </div>
                  <div>
                    <h3 className="font-display font-semibold text-white">Scheme Sahayak</h3>
                    <p className="text-xs text-slate-500">
                      Answers grounded in official scheme documents
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  className="rounded-lg p-2 text-slate-400 transition hover:bg-white/5 hover:text-white"
                >
                  <X size={19} />
                </button>
              </header>

              <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5">
                {messages.length === 0 && (
                  <div className="space-y-4">
                    <p className="text-sm leading-relaxed text-slate-400">
                      Ask about any government scheme in plain language. Every answer
                      cites the official document it came from — and says so when the
                      answer isn&apos;t there.
                    </p>
                    <div className="space-y-2">
                      {SUGGESTIONS.map((s) => (
                        <button
                          key={s}
                          onClick={() => send(s)}
                          className="glass w-full rounded-xl px-4 py-3 text-left text-sm text-slate-300 transition hover:bg-white/8"
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {messages.map((m, i) => (
                  <Message key={i} msg={m} />
                ))}

                {loading && (
                  <div className="glass inline-flex items-center gap-2 rounded-2xl rounded-bl-md px-4 py-3">
                    {[0, 1, 2].map((i) => (
                      <motion.span
                        key={i}
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.18 }}
                        className="h-1.5 w-1.5 rounded-full bg-slate-400"
                      />
                    ))}
                  </div>
                )}

                <div ref={bottomRef} />
              </div>

              <footer className="border-t border-white/10 p-4">
                <div className="flex gap-2">
                  <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && send()}
                    placeholder="Ask about a scheme, document or eligibility…"
                    className="flex-1 rounded-xl border border-white/10 bg-ink-800 px-4 py-3 text-sm text-slate-100 placeholder-slate-500 outline-none focus:border-navy-500"
                  />
                  <button
                    onClick={() => send()}
                    disabled={loading || !input.trim()}
                    className="rounded-xl bg-navy-500 px-4 text-white transition hover:bg-navy-400 disabled:opacity-40"
                  >
                    <Send size={17} />
                  </button>
                </div>
                <p className="mt-2 text-center text-[11px] text-slate-600">
                  AI-generated guidance. Confirm with your local e-Sevai centre before acting.
                </p>
              </footer>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
