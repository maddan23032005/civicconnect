import { createServiceClient, env } from "../../../../shared/index.js";

const SLA_HOURS = { critical: 24, high: 72, medium: 168, low: 336 };

const DEPARTMENT_RULES = [
  { match: /water|drinking water|tap|pipeline|borewell|sewage/i,        category: "water_supply",    department: "Water Resources", severity: "high" },
  { match: /electric|power|current|transformer|voltage|outage/i,        category: "electricity",     department: "Electricity Board", severity: "high" },
  { match: /road|pothole|street|bridge|footpath|drainage/i,             category: "roads",           department: "Public Works", severity: "medium" },
  { match: /pension|old age|widow|disability allowance/i,               category: "pension",         department: "Social Welfare", severity: "high" },
  { match: /ration|pds|food|fair price shop|smart card/i,               category: "ration",          department: "Civil Supplies", severity: "high" },
  { match: /hospital|health|doctor|medicine|ambulance|phc/i,            category: "health",          department: "Health & Family Welfare", severity: "critical" },
  { match: /school|teacher|education|scholarship|college/i,             category: "education",       department: "School Education", severity: "medium" },
  { match: /certificate|income certificate|caste|nativity|birth|death/i,category: "certificates",    department: "Revenue", severity: "medium" },
  { match: /garbage|waste|sanitation|toilet|cleaning/i,                 category: "sanitation",      department: "Municipal Administration", severity: "medium" },
  { match: /land|patta|survey|encroach/i,                               category: "land_records",    department: "Revenue", severity: "medium" },
];

/** Deterministic fallback used whenever the AI service is unavailable. */
export function ruleBasedTriage(subject, description) {
  const text = `${subject} ${description}`;

  for (const rule of DEPARTMENT_RULES) {
    if (rule.match.test(text)) {
      return {
        category: rule.category,
        department: rule.department,
        severity: rule.severity,
        method: "rules",
        confidence: 0.6,
        reasoning: `Matched keyword pattern for ${rule.category}`,
        draftResponse: null,
      };
    }
  }

  return {
    category: "uncategorized",
    department: "General Administration",
    severity: "medium",
    method: "rules",
    confidence: 0.3,
    reasoning: "No keyword pattern matched; routed to general administration for manual review",
    draftResponse: null,
  };
}

export function createTriage(log) {
  const aiClient = createServiceClient("ai-service", env.urls.ai, log, { timeout: 12000 });

  return {
    async run({ subject, description, district, citizenName }) {
      try {
        const result = await aiClient.post("/api/ai/triage", {
          subject, description, district, citizenName,
        });

        if (result?.success && result.triage) {
          return { ...result.triage, method: "ai" };
        }
        log.warn("AI triage returned an unexpected shape, falling back to rules");
      } catch (err) {
        log.warn({ err: err.message }, "AI triage unavailable, falling back to rules");
      }

      return ruleBasedTriage(subject, description);
    },

    slaFor(severity) {
      const hours = SLA_HOURS[severity] ?? SLA_HOURS.medium;
      return new Date(Date.now() + hours * 3600 * 1000);
    },
  };
}
