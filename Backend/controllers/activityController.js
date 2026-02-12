const Activity = require("../models/Activity");

/**
 * Create a new activity
 * @route POST /api/activities
 */
exports.createActivity = async (req, res) => {
  try {
    const { activityType, scheduledDateTime, location, assignedStaff, notes, status } = req.body;

    // Validation
    if (!activityType || !scheduledDateTime || !location || !assignedStaff) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: activityType, scheduledDateTime, location, assignedStaff",
      });
    }

    // Create new activity
    const activity = new Activity({
      activityType,
      scheduledDateTime: new Date(scheduledDateTime),
      location,
      assignedStaff,
      notes: notes || "",
      status: status || "Pending",
    });

    const savedActivity = await activity.save();

    res.status(201).json({
      success: true,
      message: "Activity created successfully",
      data: savedActivity,
    });
  } catch (error) {
    console.error("Error creating activity:", error);
    res.status(500).json({
      success: false,
      message: "Error creating activity",
      error: error.message,
    });
  }
};

// Get all activities
exports.getActivities = async (req, res) => {
  try {
    const activities = await Activity.find().sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      data: activities,
    });
  } catch (error) {
    console.error("Error fetching activities:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching activities",
      error: error.message,
    });
  }
};
