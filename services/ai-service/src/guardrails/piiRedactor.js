/**
 * Strips identifiers before any text leaves for a third-party LLM.
 * Returns redacted text plus a map so responses can be rehydrated locally.
 */

const PATTERNS = [
  { label: "AADHAAR", re: /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g },
  { label: "PAN",     re: /\b[A-Z]{5}\d{4}[A-Z]\b/g },
  { label: "MOBILE",  re: /\b(?:\+91[\s-]?)?[6-9]\d{9}\b/g },
  { label: "EMAIL",   re: /\b[\w.%-]+@[\w.-]+\.[A-Za-z]{2,}\b/g },
  { label: "ACCOUNT", re: /\b\d{11,18}\b/g },
  { label: "IFSC",    re: /\b[A-Z]{4}0[A-Z0-9]{6}\b/g },
  { label: "VOTERID", re: /\b[A-Z]{3}\d{7}\b/g },
];

export function redact(text) {
  if (!text || typeof text !== "string") return { text: text ?? "", map: {} };

  let out = text;
  const map = {};
  const counters = {};

  for (const { label, re } of PATTERNS) {
    out = out.replace(re, (match) => {
      counters[label] = (counters[label] || 0) + 1;
      const token = `[${label}_${counters[label]}]`;
      map[token] = match;
      return token;
    });
  }

  return { text: out, map };
}

export function rehydrate(text, map) {
  let out = text;
  for (const [token, original] of Object.entries(map)) {
    out = out.split(token).join(original);
  }
  return out;
}

/** Short, safe string for the audit log. */
export function summarize(text, max = 300) {
  const { text: safe } = redact(text || "");
  return safe.length > max ? safe.slice(0, max) + "…" : safe;
}
