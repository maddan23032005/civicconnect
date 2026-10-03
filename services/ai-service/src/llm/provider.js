import axios from "axios";
import { env } from "../../../../shared/index.js";

const GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta";
const GROQ_BASE = "https://api.groq.com/openai/v1";

async function callGemini({ system, user, json = false, temperature = 0.2 }) {
  const body = {
    contents: [{ role: "user", parts: [{ text: user }] }],
    generationConfig: {
      temperature,
      maxOutputTokens: 8192,
      thinkingConfig: { thinkingBudget: 0 },
      ...(json ? { responseMimeType: "application/json" } : {}),
    },
  };
  if (system) body.systemInstruction = { parts: [{ text: system }] };

  const { data } = await axios.post(
    `${GEMINI_BASE}/models/${env.ai.chatModel}:generateContent?key=${env.ai.geminiKey}`,
    body,
    { timeout: 30000, headers: { "Content-Type": "application/json" } }
  );

  const candidate = data?.candidates?.[0];
  const text = candidate?.content?.parts?.map((p) => p.text).filter(Boolean).join("") || "";

  if (!text) {
    throw new Error(
      `Gemini returned no text (finishReason: ${candidate?.finishReason || "unknown"})`
    );
  }

  return { text, provider: "gemini", model: env.ai.chatModel };
}

async function callGroq({ system, user, json = false, temperature = 0.2 }) {
  const messages = [];
  if (system) messages.push({ role: "system", content: system });
  messages.push({ role: "user", content: user });

  const { data } = await axios.post(
    `${GROQ_BASE}/chat/completions`,
    {
      model: env.ai.groqModel,
      messages,
      temperature,
      max_tokens: 2048,
      ...(json ? { response_format: { type: "json_object" } } : {}),
    },
    {
      timeout: 25000,
      headers: {
        Authorization: `Bearer ${env.ai.groqKey}`,
        "Content-Type": "application/json",
      },
    }
  );

  const text = data?.choices?.[0]?.message?.content || "";
  if (!text) throw new Error("Groq returned an empty response");
  return { text, provider: "groq", model: env.ai.groqModel };
}

export function createLlm(log) {
  // A valid Google AI Studio key always starts with "AIza".
  // If the key is missing or has the wrong format, skip Gemini entirely
  // and route all calls straight to Groq — avoiding a 401 on every request.
  const geminiKeyValid = env.ai.geminiKey && env.ai.geminiKey.startsWith("AIza");

  if (!geminiKeyValid) {
    log.warn(
      "GEMINI_API_KEY is missing or invalid (must start with 'AIza'). " +
      "All LLM calls will use Groq. Update GEMINI_API_KEY in .env to enable Gemini."
    );
  }

  return {
    /** Tries Gemini first (if key is valid), falls back to Groq. Throws only if both fail. */
    async complete(opts) {
      const started = Date.now();

      if (geminiKeyValid) {
        try {
          const result = await callGemini(opts);
          log.debug({ provider: "gemini", ms: Date.now() - started }, "LLM call ok");
          return { ...result, latencyMs: Date.now() - started };
        } catch (err) {
          const status = err.response?.status;
          log.warn({ err: err.message, status }, "Gemini failed, falling back to Groq");
        }
      }

      try {
        const result = await callGroq(opts);
        log.info({ provider: "groq", ms: Date.now() - started }, "LLM call ok (Groq)");
        return { ...result, latencyMs: Date.now() - started, fellBack: !geminiKeyValid };
      } catch (err2) {
        log.error({ err: err2.message }, "Groq LLM call failed");
        throw new Error("AI providers are unavailable");
      }
    },

    /** Parses a JSON response, tolerating markdown fences. */
    async completeJson(opts) {
      const result = await this.complete({ ...opts, json: true });
      const cleaned = result.text.replace(/```json|```/g, "").trim();
      try {
        return { ...result, data: JSON.parse(cleaned) };
      } catch {
        const match = cleaned.match(/\{[\s\S]*\}/);
        if (match) return { ...result, data: JSON.parse(match[0]) };
        throw new Error("AI returned malformed JSON");
      }
    },
  };
}
