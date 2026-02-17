const express = require("express");
const router = express.Router();
const activityController = require("../controllers/activityController");

// CREATE - Add a new activity
router.post("/", activityController.createActivity);

// READ - Get all activities
router.get("/", activityController.getActivities);

module.exports = router;
