import { mongoose, env } from "../../../../shared/index.js";

const knowledgeChunkSchema = new mongoose.Schema(
  {
    schemeId:   { type: String, required: true, index: true },
    schemeName: { type: String, required: true },
    department: { type: String, default: null },
    section:    { type: String, default: "general" },
    content:    { type: String, required: true },
    embedding:  { type: [Number], required: true },

    metadata: {
      state:        { type: String, default: "Tamil Nadu" },
      minAge:       { type: Number, default: null },
      maxAge:       { type: Number, default: null },
      maxIncome:    { type: Number, default: null },
      categories:   { type: [String], default: [] },
      ruralOnly:    { type: Boolean, default: false },
      occupations:  { type: [String], default: [] },
      sourceUrl:    { type: String, default: null },
    },
  },
  { timestamps: true }
);

export const KnowledgeChunk = mongoose.model("KnowledgeChunk", knowledgeChunkSchema);

/** Atlas Vector Search index definition — created via the Atlas UI. */
export const VECTOR_INDEX_DEFINITION = {
  name: env.ai.indexName,
  type: "vectorSearch",
  definition: {
    fields: [
      { type: "vector", path: "embedding", numDimensions: env.ai.dims, similarity: "cosine" },
      { type: "filter", path: "metadata.state" },
      { type: "filter", path: "department" },
    ],
  },
};
