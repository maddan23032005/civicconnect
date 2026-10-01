import { asyncHandler, NotFound } from "../../../../shared/index.js";
import { Notification } from "../models/Notification.js";

export function makeNotificationController() {
  return {
    listMine: asyncHandler(async (req, res) => {
      const { page, limit } = req.query;
      const filter = { userId: req.user.sub };
      if (req.query.unreadOnly === "true") filter.read = false;

      const [items, total, unread] = await Promise.all([
        Notification.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
        Notification.countDocuments(filter),
        Notification.countDocuments({ userId: req.user.sub, read: false }),
      ]);

      res.json({
        success: true,
        notifications: items.map((n) => n.toPublicJSON()),
        unreadCount: unread,
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      });
    }),

    markRead: asyncHandler(async (req, res) => {
      const n = await Notification.findOne({ _id: req.params.id, userId: req.user.sub });
      if (!n) throw NotFound("Notification not found");

      n.read = true;
      n.readAt = new Date();
      await n.save();

      res.json({ success: true, notification: n.toPublicJSON() });
    }),

    markAllRead: asyncHandler(async (req, res) => {
      const result = await Notification.updateMany(
        { userId: req.user.sub, read: false },
        { read: true, readAt: new Date() }
      );
      res.json({ success: true, updated: result.modifiedCount });
    }),
  };
}
