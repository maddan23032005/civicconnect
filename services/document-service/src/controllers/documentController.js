import {
  asyncHandler, BadRequest, NotFound, Forbidden, TOPICS, ROLES,
} from "../../../../shared/index.js";
import { Document, DOCUMENT_TYPES } from "../models/Document.js";

const MAX_BYTES = 8 * 1024 * 1024;
const ALLOWED = ["image/jpeg", "image/png", "image/webp", "application/pdf"];

export function makeDocumentController({ log, producer, storage, verification }) {
  return {
    types: asyncHandler(async (_req, res) => {
      res.json({ success: true, documentTypes: DOCUMENT_TYPES });
    }),

    upload: asyncHandler(async (req, res) => {
      if (!req.file) throw BadRequest("No file was uploaded");

      const { documentType, title, documentNumber, issuedOn, validUntil } = req.body;

      if (!DOCUMENT_TYPES.some((t) => t.value === documentType)) {
        throw BadRequest("Unknown document type");
      }
      if (!ALLOWED.includes(req.file.mimetype)) {
        throw BadRequest("Only JPG, PNG, WebP and PDF files are accepted");
      }
      if (req.file.size > MAX_BYTES) {
        throw BadRequest("File must be under 8 MB");
      }

      const userId = req.user.sub;
      const typeMeta = DOCUMENT_TYPES.find((t) => t.value === documentType);

      const storagePath = await storage.upload({
        userId,
        buffer: req.file.buffer,
        mimeType: req.file.mimetype,
        originalName: req.file.originalname,
      });

      const doc = await Document.create({
        userId,
        documentType,
        title: title?.trim() || typeMeta.label,
        storagePath,
        mimeType: req.file.mimetype,
        sizeBytes: req.file.size,
        originalName: req.file.originalname,
        issuingAuthority: typeMeta.authority,
        documentNumber: documentNumber?.trim() || null,
        issuedOn: issuedOn ? new Date(issuedOn) : null,
        validUntil: validUntil ? new Date(validUntil) : null,
      });

      await producer.publish(TOPICS.documentUploaded, {
        userId,
        documentId: doc._id.toString(),
        documentType: typeMeta.label,
      }, userId);

      res.status(201).json({ success: true, document: doc.toPublicJSON() });

      // Verification runs after the response — the citizen never waits for the AI.
      runVerification(doc, req).catch((err) =>
        log.error({ err: err.message, documentId: doc._id.toString() }, "Background verification failed")
      );

      async function runVerification(document, request) {
        if (document.mimeType === "application/pdf") {
          document.aiVerification = {
            ranAt: new Date(),
            readable: false,
            summary: "PDF documents are queued for manual officer review.",
            recommendation: "manual_review",
          };
          document.verificationStatus = "pending";
          await document.save();
          return;
        }

        const profile = await verification.profileFor(userId, request.headers.authorization);

        const result = await verification.verify({
          base64: request.file.buffer.toString("base64"),
          mimeType: document.mimeType,
          documentType: document.documentType,
          profile,
          expectedName: request.user.name,
        });

        if (!result) {
          document.aiVerification = {
            ranAt: new Date(),
            readable: null,
            summary: "Automatic verification was unavailable. An officer will review this document manually.",
            recommendation: "manual_review",
          };
          document.verificationStatus = "pending";
          await document.save();
          log.warn({ documentId: document._id.toString() }, "Verification unavailable, flagged for manual review");
          return;
        }

        document.aiVerification = { ...result, ranAt: new Date() };
        document.verificationStatus = "ai_reviewed";
        await document.save();

        log.info(
          { documentId: document._id.toString(), mismatches: result.mismatches?.length ?? 0 },
          "Document verified by AI"
        );
      }
    }),

    listMine: asyncHandler(async (req, res) => {
      const docs = await Document.find({ userId: req.user.sub }).sort({ createdAt: -1 });
      res.json({ success: true, documents: docs.map((d) => d.toPublicJSON()) });
    }),

    getOne: asyncHandler(async (req, res) => {
      const doc = await Document.findById(req.params.id);
      if (!doc) throw NotFound("Document not found");

      if (req.user.role === ROLES.CITIZEN && doc.userId !== req.user.sub) {
        throw Forbidden("You can only view your own documents");
      }

      res.json({ success: true, document: doc.toPublicJSON() });
    }),

    /** Short-lived signed link — files are never publicly readable. */
    viewUrl: asyncHandler(async (req, res) => {
      const doc = await Document.findById(req.params.id);
      if (!doc) throw NotFound("Document not found");

      if (req.user.role === ROLES.CITIZEN && doc.userId !== req.user.sub) {
        throw Forbidden("You can only view your own documents");
      }

      const url = await storage.signedUrl(doc.storagePath, 300);
      res.json({ success: true, url, expiresInSeconds: 300 });
    }),

    remove: asyncHandler(async (req, res) => {
      const doc = await Document.findOne({ _id: req.params.id, userId: req.user.sub });
      if (!doc) throw NotFound("Document not found");

      await storage.remove(doc.storagePath);
      await doc.deleteOne();

      res.json({ success: true, message: "Document removed" });
    }),

    /** Officer decision — AI never auto-approves. */
    review: asyncHandler(async (req, res) => {
      const { decision, note } = req.body;

      const doc = await Document.findById(req.params.id);
      if (!doc) throw NotFound("Document not found");

      doc.verificationStatus = decision === "approve" ? "verified" : "rejected";
      doc.officerNote = note?.trim() || null;
      doc.reviewedBy = req.user.sub;
      doc.reviewedAt = new Date();
      await doc.save();

      await producer.publish(TOPICS.documentUploaded, {
        userId: doc.userId,
        documentId: doc._id.toString(),
        documentType: `${doc.title} — ${doc.verificationStatus}`,
      }, doc.userId);

      res.json({ success: true, document: doc.toPublicJSON() });
    }),

    /** Officer queue of AI-reviewed documents awaiting a human decision. */
    queue: asyncHandler(async (req, res) => {
      const { page, limit } = req.query;

      const filter = { verificationStatus: { $in: ["pending", "ai_reviewed"] } };

      const [items, total] = await Promise.all([
        Document.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
        Document.countDocuments(filter),
      ]);

      res.json({
        success: true,
        documents: items.map((d) => d.toPublicJSON()),
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      });
    }),
  };
}
