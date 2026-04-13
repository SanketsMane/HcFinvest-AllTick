import express from "express";
import Notification from "../models/Notification.js";
import mongoose from "mongoose";

const router = express.Router();

/**
 * GET /api/notifications/:userId
 * Fetch notifications for a specific user
 */
router.get("/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 20, unreadOnly = "false" } = req.query;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    const query = { userId };
    if (unreadOnly === "true") {
      query.isRead = false;
    }

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    const unreadCount = await Notification.countDocuments({ userId, isRead: false });

    res.json({
      notifications,
      unreadCount
    });
  } catch (error) {
    console.error("[Notifications] Error fetching:", error.message);
    res.status(500).json({ message: "Error fetching notifications" });
  }
});

/**
 * PATCH /api/notifications/:id/read
 * Mark a specific notification as read
 */
router.patch("/:id/read", async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid notification ID" });
    }

    const notification = await Notification.findByIdAndUpdate(
      id,
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    res.json({ success: true, notification });
  } catch (error) {
    res.status(500).json({ message: "Error updating notification" });
  }
});

/**
 * PATCH /api/notifications/read-all/:userId
 * Mark all notifications as read for a user
 */
router.patch("/read-all/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    await Notification.updateMany(
      { userId, isRead: false },
      { isRead: true }
    );

    res.json({ success: true, message: "All notifications marked as read" });
  } catch (error) {
    res.status(500).json({ message: "Error clearing notifications" });
  }
});

export default router;
