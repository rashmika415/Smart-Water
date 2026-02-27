const express = require("express");
const router = express.Router();
const activityController = require("../controllers/activityController");

// CREATE - Add a new activity
router.post("/", activityController.createActivity);

// READ - Get all activities
router.get("/", activityController.getActivities);

// READ - Get a single activity by ID
router.get("/:id", activityController.getActivityById);

// UPDATE - Update an activity by ID
router.put("/:id", activityController.updateActivity);

// DELETE - Delete an activity by ID
router.delete("/:id", activityController.deleteActivity);

module.exports = router;
