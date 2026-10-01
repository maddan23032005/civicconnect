import { Router } from "express";
import {
  validate, z, requireAuth, requireRole, paginationSchema, ROLES,
} from "../../../../shared/index.js";
import { makeGrievanceController } from "../controllers/grievanceController.js";

const createSchema = z.object({
  subject:     z.string().min(5, "Subject must be at least 5 characters").max(150),
  description: z.string().min(20, "Please describe the issue in at least 20 characters").max(3000),
  district:    z.string().max(60).optional(),
});

const updateSchema = z.object({
  status:     z.enum(["triaged", "in_progress", "resolved", "rejected"]),
  note:       z.string().max(1000).optional(),
  resolution: z.string().max(2000).optional(),
});

export function grievanceRoutes(deps) {
  const c = makeGrievanceController(deps);
  const r = Router();

  r.post("/", requireAuth, validate(createSchema), c.create);
  r.get("/mine", requireAuth, validate(paginationSchema, "query"), c.listMine);
  r.get("/stats", requireAuth, requireRole(ROLES.OFFICER, ROLES.ADMIN), c.stats);
  r.get("/queue", requireAuth, requireRole(ROLES.OFFICER, ROLES.ADMIN),
    validate(paginationSchema, "query"), c.queue);
  r.get("/:ticketId", requireAuth, c.getOne);
  r.patch("/:ticketId/status", requireAuth, requireRole(ROLES.OFFICER, ROLES.ADMIN),
    validate(updateSchema), c.updateStatus);

  return r;
}
