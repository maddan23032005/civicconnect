import { createServiceClient, env } from "../../../../shared/index.js";

export function createVerification(log) {
  const aiClient = createServiceClient("ai-service", env.urls.ai, log, { timeout: 45000 });
  const profileClient = createServiceClient("profile-service", env.urls.profile, log, { timeout: 5000 });

  return {
    async profileFor(userId, authHeader) {
      try {
        const res = await profileClient.get(`/api/profile/context/${userId}`, {
          headers: { Authorization: authHeader },
        });
        return res?.context ?? null;
      } catch (err) {
        log.warn({ err: err.message }, "Profile unavailable for cross-check");
        return null;
      }
    },

    async verify({ base64, mimeType, documentType, profile, expectedName }) {
      try {
        const res = await aiClient.post("/api/ai/verify-document", {
          base64, mimeType, documentType, profile, expectedName,
        });
        return res?.success ? res.verification : null;
      } catch (err) {
        log.warn({ err: err.message }, "Document verification agent unavailable");
        return null;
      }
    },
  };
}
