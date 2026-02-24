const Activity = require("../models/Activity");
const mongoose = require("mongoose");
const sendEmail = require("../services/emailService");

// Create a new activity

exports.createActivity = async (req, res) => {
  try {
    const { activityType, scheduledDateTime, location, assignedStaff, staffEmail, notes, status } = req.body;

    // Validation
    if (!activityType || !scheduledDateTime || !location || !assignedStaff || !staffEmail) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: activityType, scheduledDateTime, location, assignedStaff, staffEmail",
      });
    }

    // Create new activity
    const activity = new Activity({
      activityType,
      scheduledDateTime: new Date(scheduledDateTime),
      location,
      assignedStaff,
      staffEmail,
      notes: notes || "",
      status: status || "Pending",
    });

    const savedActivity = await activity.save();

    // Send email notification
    try {
      await sendEmail(
        staffEmail,
        "New Water Maintenance Activity Assigned",
        `You have been assigned a new activity:
        
Activity Type: ${activityType}
Location: ${location}
Scheduled Time: ${new Date(scheduledDateTime).toLocaleString()}
Status: ${status || "Pending"}`
      );
    } catch (emailError) {
      console.error("Failed to send assignment email:", emailError);
    }

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

// Update an existing activity by ID
exports.updateActivity = async (req, res) => {
  try {
    const { id } = req.params;
    const { activityType, scheduledDateTime, location, assignedStaff, staffEmail, notes, status } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid activity ID",
      });
    }

    const updateFields = {};
    if (activityType !== undefined) updateFields.activityType = activityType;
    if (scheduledDateTime !== undefined) updateFields.scheduledDateTime = new Date(scheduledDateTime);
    if (location !== undefined) updateFields.location = location;
    if (assignedStaff !== undefined) updateFields.assignedStaff = assignedStaff;
    if (staffEmail !== undefined) updateFields.staffEmail = staffEmail;
    if (notes !== undefined) updateFields.notes = notes;
    if (status !== undefined) updateFields.status = status;

    const updatedActivity = await Activity.findByIdAndUpdate(
      id,
      { $set: updateFields },
      { new: true, runValidators: true }
    );

    if (!updatedActivity) {
      return res.status(404).json({
        success: false,
        message: "Activity not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Activity updated successfully",
      data: updatedActivity,
    });
  } catch (error) {
    console.error("Error updating activity:", error);
    res.status(500).json({
      success: false,
      message: "Error updating activity",
      error: error.message,
    });
  }
};

// Delete an activity by ID
exports.deleteActivity = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid activity ID",
      });
    }

    const deletedActivity = await Activity.findByIdAndDelete(id);

    if (!deletedActivity) {
      return res.status(404).json({
        success: false,
        message: "Activity not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Activity deleted successfully",
      data: deletedActivity,
    });
  } catch (error) {
    console.error("Error deleting activity:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting activity",
      error: error.message,
    });
  }
};
