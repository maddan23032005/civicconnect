import { mongoose } from "../../../../shared/index.js";

const citizenProfileSchema = new mongoose.Schema(
  {
    userId:      { type: String, required: true, unique: true, index: true },
    fullName:    { type: String, required: true, trim: true },
    mobile:      { type: String, required: true, index: true },
    email:       { type: String, lowercase: true, trim: true, default: null },
    photo:       { type: String, default: null },

    dateOfBirth: { type: Date, default: null },
    gender:      { type: String, enum: ["male", "female", "other", null], default: null },

    address: {
      line1:    { type: String, default: "" },
      line2:    { type: String, default: "" },
      district: { type: String, default: "", index: true },
      state:    { type: String, default: "Tamil Nadu", index: true },
      pincode:  { type: String, default: "" },
    },

    occupation:     { type: String, default: null },
    annualIncome:   { type: Number, default: null },
    category:       { type: String, enum: ["general", "obc", "sc", "st", "ews", null], default: null },
    isRuralResident:{ type: Boolean, default: false },
    landHoldingAcres:{ type: Number, default: null },

    preferredLanguage: { type: String, enum: ["en", "ta"], default: "en" },
    completeness:      { type: Number, default: 0 },
  },
  { timestamps: true }
);

const SCORED_FIELDS = [
  "fullName", "mobile", "email", "photo", "dateOfBirth", "gender",
  "address.district", "address.pincode", "occupation",
  "annualIncome", "category",
];

function valueAt(doc, path) {
  return path.split(".").reduce((o, k) => (o ? o[k] : undefined), doc);
}

citizenProfileSchema.pre("save", function (next) {
  const filled = SCORED_FIELDS.filter((f) => {
    const v = valueAt(this, f);
    return v !== null && v !== undefined && v !== "";
  }).length;
  this.completeness = Math.round((filled / SCORED_FIELDS.length) * 100);
  next();
});

citizenProfileSchema.methods.toPublicJSON = function () {
  const o = this.toObject();
  delete o.__v;
  o.id = o._id.toString();
  delete o._id;
  return o;
};

/** Compact shape the AI service uses for eligibility reasoning. */
citizenProfileSchema.methods.toEligibilityContext = function () {
  const age = this.dateOfBirth
    ? Math.floor((Date.now() - this.dateOfBirth.getTime()) / 31557600000)
    : null;

  return {
    age,
    gender: this.gender,
    district: this.address?.district || null,
    state: this.address?.state || null,
    occupation: this.occupation,
    annualIncome: this.annualIncome,
    category: this.category,
    isRuralResident: this.isRuralResident,
    landHoldingAcres: this.landHoldingAcres,
  };
};

export const CitizenProfile = mongoose.model("CitizenProfile", citizenProfileSchema);
