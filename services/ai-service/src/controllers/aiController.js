import { asyncHandler, BadRequest, env } from "../../../../shared/index.js";
import { KnowledgeChunk } from "../models/KnowledgeChunk.js";
import { AiAuditLog } from "../models/AiAuditLog.js";

export function makeAiController({ rag, triageAgent, documentAgent, log }) {
  return {
    verifyDocument: asyncHandler(async (req, res) => {
      const { base64, mimeType, documentType, profile, expectedName } = req.body;

      if (!base64 || !mimeType || !documentType) {
        throw BadRequest("base64, mimeType and documentType are required");
      }

      try {
        const verification = await documentAgent.verify({
          base64, mimeType, documentType, profile, expectedName,
        });
        res.json({ success: true, verification });
      } catch (err) {
        log.error({ err: err.message }, "Document verification failed");
        res.status(503).json({
          success: false,
          error: { code: "AI_UNAVAILABLE", message: "Verification agent unavailable" },
        });
      }
    }),
    /** Scheme Sahayak — the citizen-facing RAG endpoint. */
    ask: asyncHandler(async (req, res) => {
      const { question, state } = req.body;

      const result = await rag.ask({
        question,
        userId: req.user?.sub ?? null,
        authHeader: req.headers.authorization ?? null,
        state: state ?? null,
      });

      res.json({ success: true, ...result });
    }),

    /** Internal — called by the grievance service. */
    triage: asyncHandler(async (req, res) => {
      const { subject, description, district, citizenName } = req.body;

      if (!subject || !description) {
        throw BadRequest("subject and description are required");
      }

      try {
        const triage = await triageAgent.classify({ subject, description, district, citizenName });
        res.json({ success: true, triage });
      } catch (err) {
        log.warn({ err: err.message }, "Triage agent failed; caller will use rule-based fallback");
        res.status(503).json({
          success: false,
          error: { code: "AI_UNAVAILABLE", message: "Triage agent unavailable" },
        });
      }
    }),

    /** Knowledge base status — powers the admin view and confirms ingestion worked. */
    knowledgeStatus: asyncHandler(async (_req, res) => {
      const [total, schemes] = await Promise.all([
        KnowledgeChunk.countDocuments(),
        KnowledgeChunk.aggregate([
          { $group: { _id: "$schemeId", schemeName: { $first: "$schemeName" }, chunks: { $sum: 1 } } },
          { $sort: { schemeName: 1 } },
        ]),
      ]);

      res.json({
        success: true,
        knowledgeBase: {
          totalChunks: total,
          schemeCount: schemes.length,
          schemes: schemes.map((s) => ({ schemeId: s._id, schemeName: s.schemeName, chunks: s.chunks })),
          embedModel: env.ai.embedModel,
          dimensions: env.ai.dims,
          vectorIndex: env.ai.indexName,
        },
      });
    }),

    /** Recent AI activity — transparency view for officers and admins. */
    auditTrail: asyncHandler(async (req, res) => {
      const limit = Math.min(+(req.query.limit || 25), 100);

      const logs = await AiAuditLog.find()
        .sort({ createdAt: -1 })
        .limit(limit)
        .select("-__v")
        .lean();

      const grounded = logs.filter((l) => l.grounded === true).length;
      const fallbacks = logs.filter((l) => l.fellBack).length;
      const avgLatency = logs.length
        ? Math.round(logs.reduce((sum, l) => sum + (l.latencyMs || 0), 0) / logs.length)
        : 0;

      res.json({
        success: true,
        summary: { returned: logs.length, grounded, providerFallbacks: fallbacks, avgLatencyMs: avgLatency },
        logs,
      });
    }),
  };
}
