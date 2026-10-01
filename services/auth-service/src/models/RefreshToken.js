import { mongoose } from "../../../../shared/index.js";

const refreshTokenSchema = new mongoose.Schema(
  {
    userId:    { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
    token:     { type: String, required: true, unique: true },
    expiresAt: { type: Date, required: true },
    revoked:   { type: Boolean, default: false },
    userAgent: { type: String, default: null },
  },
  { timestamps: true }
);

// Mongo auto-deletes expired sessions
refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const RefreshToken = mongoose.model("RefreshToken", refreshTokenSchema);
