import { mongoose } from "../../../../shared/index.js";

const notificationSchema = new mongoose.Schema(
  {
    userId:  { type: String, required: true, index: true },
    type:    { type: String, required: true },
    title:   { type: String, required: true },
    message: { type: String, required: true },
    channel: { type: String, enum: ["in_app", "email", "sms"], default: "in_app" },
    link:    { type: String, default: null },
    meta:    { type: Object, default: {} },
    read:    { type: Boolean, default: false, index: true },
    readAt:  { type: Date, default: null },
  },
  { timestamps: true }
);

notificationSchema.index({ userId: 1, read: 1, createdAt: -1 });

notificationSchema.methods.toPublicJSON = function () {
  const o = this.toObject();
  o.id = o._id.toString();
  delete o._id;
  delete o.__v;
  return o;
};

export const Notification = mongoose.model("Notification", notificationSchema);
