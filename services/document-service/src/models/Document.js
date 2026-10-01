import { mongoose } from "../../../../shared/index.js";

const documentSchema = new mongoose.Schema(
  {
    userId:       { type: String, required: true, index: true },
    documentType: { type: String, required: true, index: true },
    title:        { type: String, required: true },

    storagePath:  { type: String, required: true },
    mimeType:     { type: String, required: true },
    sizeBytes:    { type: Number, required: true },
    originalName: { type: String, required: true },

    issuingAuthority: { type: String, default: null },
    documentNumber:   { type: String, default: null },
    issuedOn:         { type: Date, default: null },
    validUntil:       { type: Date, default: null },

    verificationStatus: {
      type: String,
      enum: ["pending", "ai_reviewed", "verified", "rejected"],
      default: "pending",
      index: true,
    },

    aiVerification: {
      ranAt:        { type: Date, default: null },
      confidence:   { type: Number, default: null },
      extracted:    { type: Object, default: {} },
      matches:      { type: [Object], default: [] },
      mismatches:   { type: [Object], default: [] },
      readable:     { type: Boolean, default: null },
      summary:      { type: String, default: null },
      recommendation: { type: String, default: null },
    },

    officerNote:  { type: String, default: null },
    reviewedBy:   { type: String, default: null },
    reviewedAt:   { type: Date, default: null },
  },
  { timestamps: true }
);

documentSchema.index({ userId: 1, documentType: 1 });

documentSchema.methods.toPublicJSON = function () {
  const o = this.toObject();
  o.id = o._id.toString();
  delete o._id;
  delete o.__v;
  delete o.storagePath;   // never expose the raw storage path
  return o;
};

export const DOCUMENT_TYPES = [
  { value: "aadhaar",             label: "Aadhaar Card",          authority: "UIDAI" },
  { value: "pan",                 label: "PAN Card",              authority: "Income Tax Department" },
  { value: "ration_card",         label: "Ration Card",           authority: "Civil Supplies" },
  { value: "income_certificate",  label: "Income Certificate",    authority: "Revenue Department" },
  { value: "community_certificate",label: "Community Certificate",authority: "Revenue Department" },
  { value: "nativity_certificate",label: "Nativity Certificate",  authority: "Revenue Department" },
  { value: "birth_certificate",   label: "Birth Certificate",     authority: "Municipal Administration" },
  { value: "patta",               label: "Patta / Land Record",   authority: "Revenue Department" },
  { value: "bank_passbook",       label: "Bank Passbook",         authority: "Bank" },
  { value: "disability_certificate", label: "Disability Certificate", authority: "Health Department" },
  { value: "other",               label: "Other Document",        authority: null },
];

export const Document = mongoose.model("Document", documentSchema);
