const REFUSAL_MARKERS = [
  "i don't know",
  "i do not know",
  "not enough information",
  "cannot determine from the provided",
];

const RISKY_CLAIMS = [
  /you (are|will be) (definitely|certainly|guaranteed)/i,
  /guaranteed approval/i,
  /100% eligible/i,
];

export function assessAnswer({ answer, chunks, topScore, minScore }) {
  const lower = (answer || "").toLowerCase();

  const admitsIgnorance = REFUSAL_MARKERS.some((m) => lower.includes(m));
  const hasSources = Array.isArray(chunks) && chunks.length > 0;
  const scoreOk = typeof topScore === "number" && topScore >= minScore;

  const grounded = hasSources && scoreOk && !admitsIgnorance;

  const warnings = [];
  for (const re of RISKY_CLAIMS) {
    if (re.test(answer)) warnings.push("Answer contains an over-confident eligibility claim");
  }
  if (hasSources && !scoreOk) warnings.push("Retrieved sources scored below the confidence threshold");

  return {
    grounded,
    confidence: grounded ? "high" : hasSources ? "low" : "none",
    warnings,
    shouldEscalate: !grounded || warnings.length > 0,
  };
}

export const NO_ANSWER_RESPONSE =
  "I couldn't find this in the official scheme documents available to me. " +
  "Please contact your local e-Sevai centre or the relevant department office, " +
  "and they can confirm the current rules for your situation.";
