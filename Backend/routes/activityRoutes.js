const express = require("express");
const router = express.Router();
const activityController = require("../controllers/activityController");
const verifyToken = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

// READ - Get all activities
router.get("/", verifyToken, activityController.getActivities);

// READ - Get a single activity by ID
router.get("/:id", verifyToken, activityController.getActivityById);

// CREATE - Add a new activity
router.post("/", verifyToken, authorizeRoles("admin", "user"), activityController.createActivity);

// UPDATE - Update an activity by ID
router.put("/:id", verifyToken, authorizeRoles("admin"), activityController.updateActivity);

// DELETE - Delete an activity by ID
router.delete("/:id", verifyToken, authorizeRoles("admin"), activityController.deleteActivity);

module.exports = router;

