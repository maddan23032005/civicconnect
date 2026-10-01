import { Router } from "express";
import multer from "multer";
import {
  requireAuth, requireRole, validate, z, paginationSchema, ROLES,
} from "../../../../shared/index.js";
import { makeDocumentController } from "../controllers/documentController.js";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 },
});

const reviewSchema = z.object({
  decision: z.enum(["approve", "reject"]),
  note: z.string().max(1000).optional(),
});

export function documentRoutes(deps) {
  const c = makeDocumentController(deps);
  const r = Router();

  r.get("/types", c.types);
  r.get("/mine", requireAuth, c.listMine);
  r.get("/queue", requireAuth, requireRole(ROLES.OFFICER, ROLES.ADMIN),
    validate(paginationSchema, "query"), c.queue);

  r.post("/", requireAuth, upload.single("file"), c.upload);

  r.get("/:id", requireAuth, c.getOne);
  r.get("/:id/view", requireAuth, c.viewUrl);
  r.delete("/:id", requireAuth, c.remove);
  r.patch("/:id/review", requireAuth, requireRole(ROLES.OFFICER, ROLES.ADMIN),
    validate(reviewSchema), c.review);

  return r;
}
