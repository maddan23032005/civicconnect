import { mongoose } from "../../../../shared/index.js";

const timelineEntrySchema = new mongoose.Schema(
  {
    status:    { type: String, required: true },
    note:      { type: String, default: "" },
    actorRole: { type: String, default: "system" },
    at:        { type: Date, default: Date.now },
  },
  { _id: false }
);

const grievanceSchema = new mongoose.Schema(
  {
    ticketId:    { type: String, required: true, unique: true, index: true },
    userId:      { type: String, required: true, index: true },
    citizenName: { type: String, required: true },
    mobile:      { type: String, required: true },

    subject:     { type: String, required: true, trim: true },
    description: { type: String, required: true },
    district:    { type: String, default: null, index: true },

    category:   { type: String, default: "uncategorized", index: true },
    department: { type: String, default: "General Administration", index: true },
    severity:   { type: String, enum: ["low", "medium", "high", "critical"], default: "medium", index: true },

    status: {
      type: String,
      enum: ["submitted", "triaged", "in_progress", "resolved", "rejected"],
      default: "submitted",
      index: true,
    },

    slaDueAt:    { type: Date, default: null },
    resolvedAt:  { type: Date, default: null },
    resolution:  { type: String, default: null },

    triage: {
      method:        { type: String, enum: ["ai", "rules", "manual"], default: null },
      confidence:    { type: Number, default: null },
      reasoning:     { type: String, default: null },
      draftResponse: { type: String, default: null },
    },

    timeline: { type: [timelineEntrySchema], default: [] },
  },
  { timestamps: true }
);

grievanceSchema.index({ status: 1, severity: 1, createdAt: -1 });

grievanceSchema.methods.addTimeline = function (status, note, actorRole = "system") {
  this.timeline.push({ status, note, actorRole, at: new Date() });
};

grievanceSchema.methods.toPublicJSON = function () {
  const o = this.toObject();
  o.id = o._id.toString();
  delete o._id;
  delete o.__v;
  return o;
};

export const Grievance = mongoose.model("Grievance", grievanceSchema);
