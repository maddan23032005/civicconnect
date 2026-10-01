import { mongoose } from "../../../../shared/index.js";

const userSchema = new mongoose.Schema(
  {
    mobile:       { type: String, required: true, unique: true, index: true },
    email:        { type: String, lowercase: true, trim: true, sparse: true },
    passwordHash: { type: String, required: true },
    fullName:     { type: String, required: true, trim: true },
    role:         { type: String, enum: ["citizen", "officer", "admin"], default: "citizen", index: true },
    department:   { type: String, default: null },      // officers only
    isVerified:   { type: Boolean, default: false },
    isActive:     { type: Boolean, default: true },
    lastLoginAt:  { type: Date, default: null },
    failedAttempts: { type: Number, default: 0 },
    lockedUntil:  { type: Date, default: null },
  },
  { timestamps: true }
);

userSchema.methods.toSafeJSON = function () {
  return {
    id: this._id.toString(),
    mobile: this.mobile,
    email: this.email,
    fullName: this.fullName,
    role: this.role,
    department: this.department,
    isVerified: this.isVerified,
    createdAt: this.createdAt,
  };
};

userSchema.methods.isLocked = function () {
  return this.lockedUntil && this.lockedUntil > new Date();
};

export const User = mongoose.model("User", userSchema);
