import axios from "axios";
import { env } from "../../../../shared/index.js";

const GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta";

export function createEmbedder(log) {
  /** Returns a float[] on success, or null on any failure (caller falls back to keyword search). */
  async function embed(text, taskType = "RETRIEVAL_DOCUMENT") {
    try {
      const { data } = await axios.post(
        `${GEMINI_BASE}/models/${env.ai.embedModel}:embedContent?key=${env.ai.geminiKey}`,
        {
          content: { parts: [{ text }] },
          taskType,
          outputDimensionality: env.ai.dims,
        },
        { timeout: 20000, headers: { "Content-Type": "application/json" } }
      );

      const values = data?.embedding?.values;
      if (!Array.isArray(values)) {
        log.warn("Embedding API returned no vector — falling back to keyword search");
        return null;
      }
      return values;
    } catch (err) {
      const status = err.response?.status;
      const detail = err.response?.data?.error?.message || err.message;

      if (status === 401 || status === 403) {
        log.error(
          { status, detail },
          "Gemini embedding key is invalid or unauthorised — " +
          "vector search disabled, keyword fallback will be used. " +
          "Fix GEMINI_API_KEY in .env to restore semantic search."
        );
      } else {
        log.warn({ status, detail }, "Embedding call failed — keyword fallback active");
      }
      return null;   // signal to retriever: skip vector search
    }
  }

  return {
    /** Returns null when the API key is invalid — retriever handles this gracefully. */
    embedDocument: (text) => embed(text, "RETRIEVAL_DOCUMENT"),
    embedQuery:    (text) => embed(text, "RETRIEVAL_QUERY"),

    async embedBatch(texts, onProgress) {
      const out = [];
      for (let i = 0; i < texts.length; i++) {
        const vec = await embed(texts[i], "RETRIEVAL_DOCUMENT");
        out.push(vec);
        onProgress?.(i + 1, texts.length);
        if (vec) await new Promise((r) => setTimeout(r, 120));  // rate-limit only when calls succeed
      }
      return out;
    },
  };
}
