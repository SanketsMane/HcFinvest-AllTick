/**
 * Notification Model
 * Holds individual alerts, system messages, and trade results for users.
 */
import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    title: {
      type: String,
      required: true,
      trim: true
    },
    message: {
      type: String,
      required: true
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "low"
    },
    type: {
      type: String,
      enum: ["system", "trade", "deposit", "withdrawal", "competition"],
      default: "system"
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true
    },
    metadata: {
      type: Map,
      of: String
    }
  },
  {
    timestamps: true
  }
);

// 🚀 Performance: Compound index for fast fetching of unread notifications
notificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });

const Notification = mongoose.model("Notification", notificationSchema);

export default Notification;
