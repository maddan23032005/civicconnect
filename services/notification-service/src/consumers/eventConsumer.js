import { TOPICS } from "../../../../shared/index.js";
import { Notification } from "../models/Notification.js";

const SEVERITY_LABEL = {
  critical: "Critical priority",
  high: "High priority",
  medium: "Standard priority",
  low: "Low priority",
};

function buildNotification(topic, payload) {
  switch (topic) {
    case TOPICS.grievanceCreated:
      return {
        userId: payload.userId,
        type: "grievance.created",
        title: `Grievance ${payload.ticketId} received`,
        message: `Your complaint has been routed to ${payload.department}. ${SEVERITY_LABEL[payload.severity] || ""}. We aim to respond by ${new Date(payload.slaDueAt).toLocaleDateString("en-IN")}.`,
        link: `/grievances/${payload.ticketId}`,
        meta: { ticketId: payload.ticketId, department: payload.department, severity: payload.severity },
      };

    case TOPICS.grievanceUpdated:
      return {
        userId: payload.userId,
        type: "grievance.updated",
        title: `Grievance ${payload.ticketId} updated`,
        message: payload.note
          ? `Status: ${payload.status}. ${payload.note}`
          : `Your grievance status changed to ${payload.status}.`,
        link: `/grievances/${payload.ticketId}`,
        meta: { ticketId: payload.ticketId, status: payload.status },
      };

    case TOPICS.paymentCompleted:
      return {
        userId: payload.userId,
        type: "payment.completed",
        title: "Payment successful",
        message: `Your payment of Rs. ${payload.amount} for ${payload.purpose} was received. Receipt: ${payload.receiptId}.`,
        link: `/payments/${payload.receiptId}`,
        meta: { receiptId: payload.receiptId, amount: payload.amount },
      };

    case TOPICS.documentUploaded:
      return {
        userId: payload.userId,
        type: "document.uploaded",
        title: "Document uploaded",
        message: `${payload.documentType} was added to your digital locker and is pending verification.`,
        link: "/documents",
        meta: { documentId: payload.documentId },
      };

    default:
      return null;
  }
}

export function createEventHandler(log) {
  return async function handle(topic, payload) {
    if (topic === TOPICS.auditLog) return;   // audit events aren't citizen-facing

    const spec = buildNotification(topic, payload);
    if (!spec || !spec.userId) {
      log.debug({ topic }, "Event produced no notification");
      return;
    }

    const notification = await Notification.create(spec);
    log.info({ topic, userId: spec.userId, notificationId: notification._id.toString() },
      `Notification created: ${spec.title}`);
  };
}
