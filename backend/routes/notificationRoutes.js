
// notificationRoutes.js

import express from "express";
import Notification from "../models/Notification.js";

const router = express.Router();

// ✅ Get notifications by user
/* router.get("/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    const notifications = await Notification.find({ userId })
      .sort({ createdAt: -1 })
      .limit(10);

    res.json(notifications);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}); */

router.get("/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    console.log("📥 Fetch notifications for user:", userId);

    const notifications = await Notification.find({ userId })
      .sort({ createdAt: -1 })
      .limit(10);

    console.log("📦 Notifications fetched:", notifications.length);

    res.json(notifications);
  } catch (err) {
    console.log("❌ Fetch error:", err.message);
    res.status(500).json({ message: err.message });
  }
});

export default router;

