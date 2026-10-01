import axios from "axios";
import { env } from "../../../../shared/index.js";
import { AiAuditLog } from "../models/AiAuditLog.js";

const GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta";

const EXPECTED_FIELDS = {
  aaddhaar: [],
  aadhaar: ["name", "dateOfBirth", "gender", "address"],
  pan: ["name", "dateOfBirth", "panNumber"],
  ration_card: ["name", "address", "cardNumber", "familyMembers"],
  income_certificate: ["name", "annualIncome", "issuedDate", "issuingAuthority", "certificateNumber"],
  community_certificate: ["name", "community", "issuedDate", "issuingAuthority"],
  nativity_certificate: ["name", "nativePlace", "issuedDate", "issuingAuthority"],
  birth_certificate: ["name", "dateOfBirth", "placeOfBirth", "registrationNumber"],
  patta: ["name", "surveyNumber", "extent", "village", "district"],
  bank_passbook: ["name", "accountNumber", "bankName", "ifsc"],
  disability_certificate: ["name", "disabilityType", "percentage", "issuedDate"],
  other: ["name", "documentNumber", "issuedDate"],
};

function buildPrompt(documentType, profile, expectedName) {
  const fields = EXPECTED_FIELDS[documentType] || EXPECTED_FIELDS.other;

  const profileBlock = profile
    ? `CITIZEN RECORD ON FILE:
- Name: ${expectedName || "not provided"}
- Age: ${profile.age ?? "not provided"}
- Gender: ${profile.gender ?? "not provided"}
- District: ${profile.district ?? "not provided"}
- State: ${profile.state ?? "not provided"}
- Annual income: ${profile.annualIncome != null ? `Rs. ${profile.annualIncome}` : "not provided"}
- Category: ${profile.category ?? "not provided"}`
    : `CITIZEN RECORD ON FILE:
- Name: ${expectedName || "not provided"}
(no further profile details available)`;

  return `You are verifying a government document uploaded to a citizen services portal.

DOCUMENT TYPE CLAIMED: ${documentType}
FIELDS TO EXTRACT: ${fields.join(", ")}

${profileBlock}

Examine the image and return ONLY this JSON object:
{
  "readable": true or false,
  "documentTypeMatches": true or false,
  "extracted": { field: value, ... },
  "matches": [ { "field": "...", "documentValue": "...", "recordValue": "..." } ],
  "mismatches": [ { "field": "...", "documentValue": "...", "recordValue": "...", "severity": "minor" or "major" } ],
  "confidence": 0.0 to 1.0,
  "summary": "two sentences describing what the document is and whether it is consistent with the record",
  "recommendation": "approve" or "manual_review" or "reject"
}

Rules:
1. Extract only what is legibly visible. Use null for anything you cannot read. Never guess.
2. Redact identifiers in "extracted": show only the last 4 characters of any Aadhaar, PAN, account or certificate number, prefixed with "XXXX".
3. Treat minor spelling variations in names and expansions of initials as matches, not mismatches.
4. Mark a mismatch "major" only when it would affect eligibility: a different person's name, a materially different income, a different district.
5. Recommend "approve" only when the document is clearly readable, the type matches, and there are no major mismatches.
6. Recommend "reject" only when the document is unreadable, is clearly not the claimed type, or appears altered.
7. Everything else is "manual_review". When in doubt, choose manual_review — a human officer makes the final decision.`;
}

const VALID_RECOMMENDATIONS = new Set(["approve", "manual_review", "reject"]);

export function createDocumentAgent({ log }) {
  return {
    async verify({ base64, mimeType, documentType, profile, expectedName }) {
      const started = Date.now();

      const body = {
        contents: [{
          role: "user",
          parts: [
            { inlineData: { mimeType, data: base64 } },
            { text: buildPrompt(documentType, profile, expectedName) },
          ],
        }],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 8192,
          responseMimeType: "application/json",
        },
      };

      const MODELS = [
        env.ai.chatModel,
        "gemini-2.5-flash",
        "gemini-3.5-flash",
        "gemini-2.5-flash-lite",
      ];

      let data;
      let usedModel = null;

      outer:
      for (const model of MODELS) {
        for (let attempt = 1; attempt <= 3; attempt++) {
          try {
            ({ data } = await axios.post(
              `${GEMINI_BASE}/models/${model}:generateContent?key=${env.ai.geminiKey}`,
              body,
              { timeout: 40000, headers: { "Content-Type": "application/json" } }
            ));
            usedModel = model;
            break outer;
          } catch (err) {
            const status = err.response?.status;
            const detail = err.response?.data?.error?.message || err.message;
            const retryable = status === 503 || status === 429 || status === 500;

            if (!retryable) {
              log.error({ status, detail, model }, "Gemini vision call rejected");
              throw new Error(`Gemini vision error: ${detail}`);
            }

            log.warn({ status, model, attempt }, "Model busy");
            if (attempt < 3) await new Promise((r) => setTimeout(r, attempt * 2500));
          }
        }
        log.warn({ model }, "Model exhausted, trying next");
      }

      if (!data) {
        throw new Error("All Gemini vision models are currently at capacity");
      }

      const candidate = data?.candidates?.[0];
      const text = candidate?.content?.parts?.map((p) => p.text).filter(Boolean).join("") || "";

      if (!text) {
        throw new Error(`Vision model returned nothing (finishReason: ${candidate?.finishReason})`);
      }

      let parsed;
      try {
        parsed = JSON.parse(text.replace(/```json|```/g, "").trim());
      } catch {
        const match = text.match(/\{[\s\S]*\}/);
        if (!match) throw new Error("Vision model returned malformed JSON");
        parsed = JSON.parse(match[0]);
      }

      // Never trust model output shape.
      const verification = {
        readable: parsed.readable === true,
        documentTypeMatches: parsed.documentTypeMatches === true,
        extracted: typeof parsed.extracted === "object" && parsed.extracted ? parsed.extracted : {},
        matches: Array.isArray(parsed.matches) ? parsed.matches.slice(0, 20) : [],
        mismatches: Array.isArray(parsed.mismatches) ? parsed.mismatches.slice(0, 20) : [],
        confidence: typeof parsed.confidence === "number"
          ? Math.min(Math.max(parsed.confidence, 0), 1)
          : 0.5,
        summary: typeof parsed.summary === "string" ? parsed.summary.slice(0, 600) : "",
        recommendation: VALID_RECOMMENDATIONS.has(parsed.recommendation)
          ? parsed.recommendation
          : "manual_review",
      };

      // A major mismatch always forces human review, whatever the model said.
      if (verification.mismatches.some((m) => m.severity === "major")) {
        verification.recommendation = "manual_review";
      }

      await AiAuditLog.create({
        feature: "verify",
        provider: "gemini",
        model: usedModel,
        latencyMs: Date.now() - started,
        inputRedacted: `document type: ${documentType}`,
        outputSummary: `${verification.recommendation} · ${verification.mismatches.length} mismatch(es)`,
        grounded: true,
      });

      log.info(
        {
          documentType,
          recommendation: verification.recommendation,
          mismatches: verification.mismatches.length,
          ms: Date.now() - started,
        },
        "Document verified"
      );

      return verification;
    },
  };
}
