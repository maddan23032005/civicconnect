import { Router } from "express";
import { requireAuth, validate, paginationSchema } from "../../../../shared/index.js";
import { makeNotificationController } from "../controllers/notificationController.js";

export function notificationRoutes() {
  const c = makeNotificationController();
  const r = Router();

  r.get("/mine", requireAuth, validate(paginationSchema, "query"), c.listMine);
  r.patch("/read-all", requireAuth, c.markAllRead);
  r.patch("/:id/read", requireAuth, c.markRead);

  return r;
}
