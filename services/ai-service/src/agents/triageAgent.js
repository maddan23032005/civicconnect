import { redact, summarize } from "../guardrails/piiRedactor.js";
import { TRIAGE_SYSTEM_PROMPT, buildTriagePrompt } from "../llm/prompts.js";
import { AiAuditLog } from "../models/AiAuditLog.js";

const VALID_CATEGORIES = new Set([
  "water_supply", "electricity", "roads", "pension", "ration", "health",
  "education", "certificates", "sanitation", "land_records",
  "employment", "housing", "other",
]);

const VALID_SEVERITY = new Set(["low", "medium", "high", "critical"]);

export function createTriageAgent({ llm, log }) {
  return {
    async classify({ subject, description, district, citizenName }) {
      const started = Date.now();

      const { text: safeSubject } = redact(subject);
      const { text: safeDescription } = redact(description);

      const result = await llm.completeJson({
        system: TRIAGE_SYSTEM_PROMPT,
        user: buildTriagePrompt({
          subject: safeSubject,
          description: safeDescription,
          district,
          citizenName,
        }),
        temperature: 0.1,
      });

      const raw = result.data || {};

      // Never trust model output shape — validate every field.
      const triage = {
        category: VALID_CATEGORIES.has(raw.category) ? raw.category : "other",
        department: typeof raw.department === "string" && raw.department.trim()
          ? raw.department.trim().slice(0, 80)
          : "General Administration",
        severity: VALID_SEVERITY.has(raw.severity) ? raw.severity : "medium",
        confidence: typeof raw.confidence === "number"
          ? Math.min(Math.max(raw.confidence, 0), 1)
          : 0.5,
        reasoning: typeof raw.reasoning === "string" ? raw.reasoning.slice(0, 500) : "",
        draftResponse: typeof raw.draftResponse === "string" ? raw.draftResponse.slice(0, 1000) : null,
      };

      await AiAuditLog.create({
        feature: "triage",
        provider: result.provider,
        model: result.model,
        latencyMs: result.latencyMs,
        fellBack: !!result.fellBack,
        inputRedacted: summarize(`${subject} ${description}`),
        outputSummary: `${triage.category} / ${triage.department} / ${triage.severity}`,
        grounded: true,
      });

      log.info({ category: triage.category, severity: triage.severity, ms: Date.now() - started },
        "Triage complete");

      return triage;
    },
  };
}
