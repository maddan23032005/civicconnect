import axios from "axios";
import { env } from "../../../../shared/index.js";

const GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta";

export function createEmbedder(log) {
  async function embed(text, taskType = "RETRIEVAL_DOCUMENT") {
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
    if (!Array.isArray(values)) throw new Error("Embedding API returned no vector");
    return values;
  }

  return {
    embedDocument: (text) => embed(text, "RETRIEVAL_DOCUMENT"),
    embedQuery: (text) => embed(text, "RETRIEVAL_QUERY"),

    async embedBatch(texts, onProgress) {
      const out = [];
      for (let i = 0; i < texts.length; i++) {
        out.push(await embed(texts[i], "RETRIEVAL_DOCUMENT"));
        onProgress?.(i + 1, texts.length);
        await new Promise((r) => setTimeout(r, 120));   // stay under the free-tier rate limit
      }
      return out;
    },
  };
}
