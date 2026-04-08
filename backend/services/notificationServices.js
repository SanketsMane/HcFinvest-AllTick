
// services/notificationService.js

import mongoose from "mongoose";
import Notification from "../models/Notification.js";

const createNotification = async ({
  req, 
  userId,
  title,
  message,
  type = "SYSTEM",
  transactionId = null,
  meta = {}
}) => {
  try {
    console.log("🔥 createNotification CALLED");

    const notification = await Notification.create({
  userId: new mongoose.Types.ObjectId(userId),
  title,
  message,
  type,
  transactionId,
  meta
});

console.log("✅ Notification saved:", notification._id);

// 🔥 REALTIME EMIT
try {
  const io = req?.app?.get("io");

  if (io) {
    io.to(userId.toString()).emit("newNotification", {
      _id: notification._id,
      title: notification.title,
      message: notification.message,
      createdAt: notification.createdAt,
      isRead: false,
      type: notification.type,
      meta: notification.meta
    });

    console.log("📡 Real-time notification sent");
  } else {
    console.log("⚠️ IO not found");
  }
} catch (socketErr) {
  console.log("❌ Socket emit error:", socketErr.message);
}

return notification;


  } catch (err) {
    console.error("❌ FULL ERROR:", err);
    throw err;
  }
};

export default createNotification;