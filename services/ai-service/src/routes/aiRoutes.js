import { Router } from "express";
import {
  validate, z, requireAuth, optionalAuth, requireRole, ROLES,
} from "../../../../shared/index.js";
import { makeAiController } from "../controllers/aiController.js";

const askSchema = z.object({
  question: z.string().min(1, "Please type a question").max(1000),
  state: z.string().max(60).optional(),
});

const triageSchema = z.object({
  subject: z.string().min(3).max(200),
  description: z.string().min(10).max(5000),
  district: z.string().max(60).optional().nullable(),
  citizenName: z.string().max(80).optional().nullable(),
});

export function aiRoutes(deps) {
  const c = makeAiController(deps);
  const r = Router();

  // Public so visitors can try Scheme Sahayak before signing up.
  // optionalAuth means a logged-in citizen gets profile-aware answers.
  r.post("/ask", optionalAuth, validate(askSchema), c.ask);

  // Internal, service-to-service.
  r.post("/triage", validate(triageSchema), c.triage);
  r.post("/verify-document", c.verifyDocument);

  r.get("/knowledge", c.knowledgeStatus);
  r.get("/audit", requireAuth, requireRole(ROLES.OFFICER, ROLES.ADMIN), c.auditTrail);

  return r;
}
