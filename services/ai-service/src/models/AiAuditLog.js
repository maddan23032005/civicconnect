import { mongoose } from "../../../../shared/index.js";

const aiAuditLogSchema = new mongoose.Schema(
  {
    userId:      { type: String, default: null, index: true },
    feature:     { type: String, required: true, index: true },  // ask | triage | verify
    provider:    { type: String, default: null },
    model:       { type: String, default: null },
    latencyMs:   { type: Number, default: null },
    fellBack:    { type: Boolean, default: false },

    inputRedacted:  { type: String, default: null },
    outputSummary:  { type: String, default: null },
    retrievedChunks:{ type: Number, default: 0 },
    topScore:       { type: Number, default: null },
    grounded:       { type: Boolean, default: null },
    error:          { type: String, default: null },
  },
  { timestamps: true }
);

aiAuditLogSchema.index({ createdAt: -1 });

export const AiAuditLog = mongoose.model("AiAuditLog", aiAuditLogSchema);
