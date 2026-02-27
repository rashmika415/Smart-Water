const Activity = require("../models/Activity");
const mongoose = require("mongoose");
const sendEmail = require("../services/activityEmailService");
const getEmailTemplate = require("../services/activityEmailTemplate");

// Create a new activity

exports.createActivity = async (req, res) => {
  try {
    const { activityType, scheduledDate, scheduledTime, location, assignedStaff, staffEmail, notes, status } = req.body;

    // Validation
    if (!activityType || !scheduledDate || !scheduledTime || !location || !assignedStaff || !staffEmail) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: activityType, scheduledDate, scheduledTime, location, assignedStaff, staffEmail",
      });
    }

    // Create new activity
    const activity = new Activity({
      activityType,
      scheduledDate,
      scheduledTime,
      location,
      assignedStaff,
      staffEmail,
      notes: notes || "",
      status: status || "Pending",
    });

    const savedActivity = await activity.save();

    // Send email notification
    try {
      const emailHtml = getEmailTemplate(
        "New Activity Assigned",
        "You have been assigned a new maintenance activity. Please find the details below:",
        [
          { label: "Activity Type", value: activityType },
          { label: "Location", value: location },
          { label: "Scheduled Date", value: scheduledDate },
          { label: "Scheduled Time", value: scheduledTime },
          { label: "Status", value: status || "Pending" }
        ],
        "success"
      );

      await sendEmail(
        staffEmail,
        "New Water Maintenance Activity Assigned",
        `New Activity: ${activityType} at ${location}`,
        emailHtml
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
    const { activityType, scheduledDate, scheduledTime, location, assignedStaff, staffEmail, notes, status } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid activity ID",
      });
    }

    const updateFields = {};
    if (activityType !== undefined) updateFields.activityType = activityType;
    if (scheduledDate !== undefined) updateFields.scheduledDate = scheduledDate;
    if (scheduledTime !== undefined) updateFields.scheduledTime = scheduledTime;
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

    // Send update email notification
    try {
      const emailHtml = getEmailTemplate(
        "Activity Updated",
        "An activity assigned to you has been updated. Please review the changes below:",
        [
          { label: "Activity Type", value: updatedActivity.activityType },
          { label: "Location", value: updatedActivity.location },
          { label: "Date", value: updatedActivity.scheduledDate },
          { label: "Time", value: updatedActivity.scheduledTime },
          { label: "Status", value: updatedActivity.status },
          { label: "Notes", value: updatedActivity.notes || "None" }
        ],
        "warning"
      );

      await sendEmail(
        updatedActivity.staffEmail,
        "Water Maintenance Activity Updated",
        `Updated: ${updatedActivity.activityType} at ${updatedActivity.location}`,
        emailHtml
      );
    } catch (emailError) {
      console.error("Failed to send update email:", emailError);
    }
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

    // Send deletion email notification
    try {
      const emailHtml = getEmailTemplate(
        "Activity Cancelled",
        "The following activity has been removed from the schedule:",
        [
          { label: "Activity Type", value: deletedActivity.activityType },
          { label: "Location", value: deletedActivity.location },
          { label: "Date", value: deletedActivity.scheduledDate },
          { label: "Time", value: deletedActivity.scheduledTime }
        ],
        "danger"
      );

      await sendEmail(
        deletedActivity.staffEmail,
        "Water Maintenance Activity Cancelled",
        `Cancelled: ${deletedActivity.activityType} at ${deletedActivity.location}`,
        emailHtml
      );
    } catch (emailError) {
      console.error("Failed to send deletion email:", emailError);
    }
  } catch (error) {
    console.error("Error deleting activity:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting activity",
      error: error.message,
    });
  }
};
