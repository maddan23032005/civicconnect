import { env } from "../../../../shared/index.js";
import { KnowledgeChunk } from "../models/KnowledgeChunk.js";

export function createRetriever(embedder, log) {
  return {
    /** Semantic search over Atlas Vector Search. Returns [] when embedding is unavailable. */
    async search(question, { topK = env.ai.topK, state = null, department = null } = {}) {
      // embedQuery returns null when the Gemini key is invalid — skip vector search entirely
      const queryVector = await embedder.embedQuery(question);
      if (!queryVector) {
        log.warn("Skipping vector search (embedding unavailable), falling back to keyword search");
        return [];
      }

      const filter = {};
      if (state) filter["metadata.state"] = state;
      if (department) filter.department = department;

      const pipeline = [
        {
          $vectorSearch: {
            index: env.ai.indexName,
            path: "embedding",
            queryVector,
            numCandidates: topK * 15,
            limit: topK,
            ...(Object.keys(filter).length ? { filter } : {}),
          },
        },
        {
          $project: {
            _id: 0,
            schemeId: 1,
            schemeName: 1,
            department: 1,
            section: 1,
            content: 1,
            metadata: 1,
            score: { $meta: "vectorSearchScore" },
          },
        },
      ];

      try {
        const results = await KnowledgeChunk.aggregate(pipeline);
        log.debug({ count: results.length, top: results[0]?.score }, "Vector search complete");
        return results;
      } catch (err) {
        log.error({ err: err.message }, "Vector search failed — is the Atlas index built?");
        return [];
      }
    },

    /** Keyword fallback when the vector index is missing or returns nothing. */
    async keywordSearch(question, topK = env.ai.topK) {
      const terms = question
        .toLowerCase()
        .split(/\s+/)
        .filter((t) => t.length > 3)
        .slice(0, 8);

      if (!terms.length) return [];

      const regex = new RegExp(terms.join("|"), "i");
      const results = await KnowledgeChunk.find({
        $or: [{ content: regex }, { schemeName: regex }],
      })
        .limit(topK)
        .lean();

      return results.map((r) => ({ ...r, score: 0.5, _keyword: true }));
    },

    /** Vector first, keyword as a safety net. */
    async retrieve(question, opts = {}) {
      let chunks = await this.search(question, opts);
      if (!chunks.length) {
        log.warn("Vector search empty, trying keyword fallback");
        chunks = await this.keywordSearch(question, opts.topK);
      }
      return chunks;
    },
  };
}
