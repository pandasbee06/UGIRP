const express = require("express");
const Notification = require("../models/Notification");
const { authMiddleware } = require("../middleware/auth");

const router = express.Router();

// GET /api/notifications -> Retrieve user's notifications for Navbar bell
router.get("/", authMiddleware, async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.user.userId })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    return res.status(200).json({ ok: true, data: notifications });
  } catch (e) {
    return res.status(500).json({ code: "INTERNAL_ERROR", message: "Failed to fetch notifications" });
  }
});

// PUT /api/notifications/read -> Mark all notifications as read for user
router.put("/read", authMiddleware, async (req, res) => {
  try {
    await Notification.updateMany(
      { userId: req.user.userId, isUnread: true },
      { $set: { isUnread: false } }
    );
    return res.status(200).json({ ok: true, message: "Notifications marked as read" });
  } catch (e) {
    return res.status(500).json({ code: "INTERNAL_ERROR", message: "Failed to update notification status" });
  }
});

module.exports = router;
