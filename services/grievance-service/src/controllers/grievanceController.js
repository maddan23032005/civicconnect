import { customAlphabet } from "nanoid";
import {
  asyncHandler, NotFound, Forbidden, TOPICS, ROLES,
} from "../../../../shared/index.js";
import { Grievance } from "../models/Grievance.js";

const ticketCode = customAlphabet("0123456789ABCDEFGHJKMNPQRSTUVWXYZ", 8);

export function makeGrievanceController({ log, producer, triage }) {
  return {
    create: asyncHandler(async (req, res) => {
      const { subject, description, district } = req.body;
      const userId = req.user.sub;

      const verdict = await triage.run({
        subject, description, district,
        citizenName: req.user.name,
      });

      const grievance = await Grievance.create({
        ticketId: `GRV-${ticketCode()}`,
        userId,
        citizenName: req.user.name || "Citizen",
        mobile: req.user.mobile,
        subject,
        description,
        district: district || null,
        category: verdict.category,
        department: verdict.department,
        severity: verdict.severity,
        status: "triaged",
        slaDueAt: triage.slaFor(verdict.severity),
        triage: {
          method: verdict.method,
          confidence: verdict.confidence,
          reasoning: verdict.reasoning,
          draftResponse: verdict.draftResponse,
        },
        timeline: [
          { status: "submitted", note: "Grievance received", actorRole: "citizen" },
          { status: "triaged", note: `Routed to ${verdict.department} (${verdict.method})`, actorRole: "system" },
        ],
      });

      await producer.publish(TOPICS.grievanceCreated, {
        ticketId: grievance.ticketId,
        grievanceId: grievance._id.toString(),
        userId,
        citizenName: grievance.citizenName,
        mobile: grievance.mobile,
        subject: grievance.subject,
        category: grievance.category,
        department: grievance.department,
        severity: grievance.severity,
        slaDueAt: grievance.slaDueAt,
      }, userId);

      log.info({ ticketId: grievance.ticketId, department: grievance.department }, "Grievance created");

      res.status(201).json({ success: true, grievance: grievance.toPublicJSON() });
    }),

    listMine: asyncHandler(async (req, res) => {
      const { page, limit } = req.query;
      const filter = { userId: req.user.sub };
      if (req.query.status) filter.status = req.query.status;

      const [items, total] = await Promise.all([
        Grievance.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
        Grievance.countDocuments(filter),
      ]);

      res.json({
        success: true,
        grievances: items.map((g) => g.toPublicJSON()),
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      });
    }),

    getOne: asyncHandler(async (req, res) => {
      const g = await Grievance.findOne({ ticketId: req.params.ticketId });
      if (!g) throw NotFound("No grievance found with that ticket number");

      if (req.user.role === ROLES.CITIZEN && g.userId !== req.user.sub) {
        throw Forbidden("You can only view your own grievances");
      }

      res.json({ success: true, grievance: g.toPublicJSON() });
    }),

    /** Officer queue, newest and most severe first. */
    queue: asyncHandler(async (req, res) => {
      const { page, limit } = req.query;
      const filter = {};
      if (req.query.department) filter.department = req.query.department;
      if (req.query.status) filter.status = req.query.status;
      if (req.query.severity) filter.severity = req.query.severity;

      const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };

      const [items, total] = await Promise.all([
        Grievance.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
        Grievance.countDocuments(filter),
      ]);

      const sorted = items.sort(
        (a, b) => severityOrder[a.severity] - severityOrder[b.severity]
      );

      res.json({
        success: true,
        grievances: sorted.map((g) => g.toPublicJSON()),
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      });
    }),

    updateStatus: asyncHandler(async (req, res) => {
      const { status, note, resolution } = req.body;

      const g = await Grievance.findOne({ ticketId: req.params.ticketId });
      if (!g) throw NotFound("No grievance found with that ticket number");

      g.status = status;
      if (status === "resolved") {
        g.resolvedAt = new Date();
        g.resolution = resolution || note || "Resolved";
      }
      g.addTimeline(status, note || "", req.user.role);
      await g.save();

      await producer.publish(TOPICS.grievanceUpdated, {
        ticketId: g.ticketId,
        userId: g.userId,
        mobile: g.mobile,
        citizenName: g.citizenName,
        status: g.status,
        note: note || "",
        department: g.department,
      }, g.userId);

      res.json({ success: true, grievance: g.toPublicJSON() });
    }),

    stats: asyncHandler(async (_req, res) => {
      const [byStatus, bySeverity, byDepartment, total] = await Promise.all([
        Grievance.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
        Grievance.aggregate([{ $group: { _id: "$severity", count: { $sum: 1 } } }]),
        Grievance.aggregate([{ $group: { _id: "$department", count: { $sum: 1 } } }]),
        Grievance.countDocuments(),
      ]);

      const overdue = await Grievance.countDocuments({
        status: { $nin: ["resolved", "rejected"] },
        slaDueAt: { $lt: new Date() },
      });

      const fmt = (arr) => Object.fromEntries(arr.map((r) => [r._id, r.count]));

      res.json({
        success: true,
        stats: {
          total,
          overdue,
          byStatus: fmt(byStatus),
          bySeverity: fmt(bySeverity),
          byDepartment: fmt(byDepartment),
        },
      });
    }),
  };
}
