const express = require("express");
const verifyToken = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");
const {
  listAdminNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} = require("../controllers/adminNotificationController");

const router = express.Router();

router.get("/", verifyToken, authorizeRoles("admin"), listAdminNotifications);
router.patch("/read-all", verifyToken, authorizeRoles("admin"), markAllNotificationsRead);
router.patch("/:id/read", verifyToken, authorizeRoles("admin"), markNotificationRead);

module.exports = router;
