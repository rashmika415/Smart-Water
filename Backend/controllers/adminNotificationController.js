const mongoose = require("mongoose");
const AdminNotification = require("../models/adminNotificationModel");

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

const listAdminNotifications = async (req, res) => {
  try {
    const parsedLimit = Number(req.query.limit || DEFAULT_LIMIT);
    const limit = Number.isFinite(parsedLimit)
      ? Math.min(Math.max(parsedLimit, 1), MAX_LIMIT)
      : DEFAULT_LIMIT;
    const adminId = req.user?.id;

    const items = await AdminNotification.find({})
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    const notifications = items.map((n) => {
      const readBy = Array.isArray(n.readBy) ? n.readBy : [];
      const isRead = readBy.some((id) => String(id) === String(adminId));
      return {
        _id: n._id,
        type: n.type,
        title: n.title,
        message: n.message,
        userId: n.userId,
        userName: n.userName,
        userEmail: n.userEmail,
        createdAt: n.createdAt,
        isRead,
      };
    });

    const unreadCount = notifications.reduce((sum, n) => sum + (n.isRead ? 0 : 1), 0);
    res.json({ notifications, unreadCount });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to load notifications" });
  }
};

const markNotificationRead = async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = req.user?.id;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid notification id" });
    }
    await AdminNotification.findByIdAndUpdate(id, {
      $addToSet: { readBy: adminId },
    });
    res.json({ message: "Notification marked as read" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to mark notification as read" });
  }
};

const markAllNotificationsRead = async (req, res) => {
  try {
    const adminId = req.user?.id;
    await AdminNotification.updateMany(
      { readBy: { $ne: adminId } },
      { $addToSet: { readBy: adminId } }
    );
    res.json({ message: "All notifications marked as read" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to mark all notifications as read" });
  }
};

module.exports = {
  listAdminNotifications,
  markNotificationRead,
  markAllNotificationsRead,
};
