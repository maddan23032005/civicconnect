import { Router } from "express";
import {
  validate, z, requireAuth, requireRole, paginationSchema, ROLES,
} from "../../../../shared/index.js";
import { makeProfileController } from "../controllers/profileController.js";

const updateSchema = z.object({
  fullName:    z.string().min(2).max(80).optional(),
  email:       z.string().email().optional().nullable(),
  dateOfBirth: z.coerce.date().optional().nullable(),
  gender:      z.enum(["male", "female", "other"]).optional().nullable(),
  address: z.object({
    line1:    z.string().max(120).optional(),
    line2:    z.string().max(120).optional(),
    district: z.string().max(60).optional(),
    state:    z.string().max(60).optional(),
    pincode:  z.string().regex(/^\d{6}$/, "Pincode must be 6 digits").optional(),
  }).optional(),
  occupation:       z.string().max(60).optional().nullable(),
  annualIncome:     z.number().min(0).max(100000000).optional().nullable(),
  category:         z.enum(["general", "obc", "sc", "st", "ews"]).optional().nullable(),
  isRuralResident:  z.boolean().optional(),
  landHoldingAcres: z.number().min(0).max(10000).optional().nullable(),
  preferredLanguage:z.enum(["en", "ta"]).optional(),
});

export function profileRoutes(deps) {
  const c = makeProfileController(deps);
  const r = Router();

  r.get("/me", requireAuth, c.getMine);
  r.patch("/me", requireAuth, validate(updateSchema), c.updateMine);
  r.get("/context/:userId", requireAuth, c.getEligibilityContext);
  r.get("/search", requireAuth, requireRole(ROLES.OFFICER, ROLES.ADMIN),
    validate(paginationSchema, "query"), c.search);

  return r;
}
