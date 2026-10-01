import { env, createServiceClient } from "../../../../shared/index.js";
import { redact, summarize } from "../guardrails/piiRedactor.js";
import { assessAnswer, NO_ANSWER_RESPONSE } from "../guardrails/outputFilter.js";
import {
  RAG_SYSTEM_PROMPT, buildRagPrompt,
  SCOPE_SYSTEM_PROMPT, buildScopePrompt,
  GENERAL_SYSTEM_PROMPT, buildGeneralPrompt,
} from "../llm/prompts.js";
import { AiAuditLog } from "../models/AiAuditLog.js";

const GREETING_REPLY =
  "Hello! I'm Scheme Sahayak. I can help you find government schemes you may qualify for, " +
  "explain what documents you need, and walk you through how to apply.\n\n" +
  "Try asking something like \"What pension can I get at 62?\" or \"What documents do I need for an income certificate?\"";



const PORTAL_REPLY =
  "You can do all of that from your dashboard:\n\n" +
  "• File a grievance — Grievances → File new. It's auto-routed to the right department.\n" +
  "• Update your details — Profile. A fuller profile lets me check more eligibility criteria.\n" +
  "• Track anything — every application, grievance and payment appears on your dashboard.\n\n" +
  "Ask me about a specific scheme and I'll pull up the official criteria.";

export function createRagPipeline({ llm, retriever, log }) {
  const profileClient = createServiceClient("profile-service", env.urls.profile, log, { timeout: 5000 });

  async function fetchProfile(userId, authHeader) {
    if (!userId) return null;
    try {
      const res = await profileClient.get(`/api/profile/context/${userId}`, {
        headers: { Authorization: authHeader },
      });
      return res?.context ?? null;
    } catch (err) {
      log.warn({ err: err.message }, "Profile context unavailable, answering without it");
      return null;
    }
  }

  async function classifyIntent(message) {
    // Fast path — obvious greetings don't need an LLM call
    if (/^\s*(hi|hey+|hello+|yo|vanakkam|namaste|thanks|thank you|thx|bye|ok|okay)\s*[!.?]*\s*$/i.test(message)) {
      return "greeting";
    }

    try {
      const result = await llm.completeJson({
        system: SCOPE_SYSTEM_PROMPT,
        user: buildScopePrompt(message),
        temperature: 0,
      });
      const intent = result.data?.intent;
      return ["greeting", "scheme", "portal", "general"].includes(intent) ? intent : "scheme";
    } catch (err) {
      log.warn({ err: err.message }, "Intent classification failed, defaulting to scheme");
      return "scheme"; // fail open — better to attempt retrieval than to refuse
    }
  }

  return {
    async ask({ question, userId, authHeader, state = null }) {
      const started = Date.now();
      const { text: safeQuestion } = redact(question);

      const intent = await classifyIntent(safeQuestion);

      if (intent === "greeting" || intent === "portal") {
        const answer = intent === "greeting" ? GREETING_REPLY : PORTAL_REPLY;

        await AiAuditLog.create({
          userId, feature: "ask",
          inputRedacted: summarize(question),
          outputSummary: `intent: ${intent}`,
          retrievedChunks: 0, grounded: true,
        });

        return {
          answer, sources: [], grounded: true, confidence: "high",
          intent, latencyMs: Date.now() - started,
        };
      }

      if (intent === "general") {
        const result = await llm.complete({
          system: GENERAL_SYSTEM_PROMPT,
          user: buildGeneralPrompt(safeQuestion),
          temperature: 0.4,
        });

        await AiAuditLog.create({
          userId, feature: "ask",
          provider: result.provider, model: result.model,
          latencyMs: result.latencyMs, fellBack: !!result.fellBack,
          inputRedacted: summarize(question),
          outputSummary: summarize(result.text, 400),
          retrievedChunks: 0, grounded: false,
        });

        return {
          answer: result.text,
          sources: [],
          grounded: false,
          confidence: "general",
          intent: "general",
          provider: result.provider,
          latencyMs: Date.now() - started,
        };
      }

      const [chunks, profile] = await Promise.all([
        retriever.retrieve(safeQuestion, { state }),
        fetchProfile(userId, authHeader),
      ]);

      if (!chunks.length) {
        await AiAuditLog.create({
          userId, feature: "ask",
          inputRedacted: summarize(question),
          outputSummary: "no sources retrieved",
          retrievedChunks: 0, grounded: false,
          latencyMs: Date.now() - started,
        });

        return {
          answer: NO_ANSWER_RESPONSE,
          sources: [],
          grounded: false,
          confidence: "none",
          latencyMs: Date.now() - started,
        };
      }

      const topScore = chunks[0]?.score ?? null;

      const result = await llm.complete({
        system: RAG_SYSTEM_PROMPT,
        user: buildRagPrompt({ question: safeQuestion, chunks, profile }),
        temperature: 0.15,
      });

      const assessment = assessAnswer({
        answer: result.text,
        chunks,
        topScore,
        minScore: env.ai.minScore,
      });

      const sources = chunks.map((c, i) => ({
        ref: i + 1,
        schemeName: c.schemeName,
        department: c.department,
        section: c.section,
        score: c.score != null ? +c.score.toFixed(3) : null,
        sourceUrl: c.metadata?.sourceUrl ?? null,
      }));

      await AiAuditLog.create({
        userId,
        feature: "ask",
        provider: result.provider,
        model: result.model,
        latencyMs: result.latencyMs,
        fellBack: !!result.fellBack,
        inputRedacted: summarize(question),
        outputSummary: summarize(result.text, 400),
        retrievedChunks: chunks.length,
        topScore,
        grounded: assessment.grounded,
      });

      return {
        answer: result.text,
        sources,
        grounded: assessment.grounded,
        confidence: assessment.confidence,
        warnings: assessment.warnings,
        usedProfile: !!profile,
        provider: result.provider,
        latencyMs: Date.now() - started,
      };
    },
  };
}
