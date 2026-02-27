const mongoose = require("mongoose");

const activitySchema = new mongoose.Schema(
  {
    activityType: {
      type: String,
      required: true,
    },
    scheduledDate: {
      type: String,
      required: true,
    },
    scheduledTime: {
      type: String,
      required: true,
    },
    location: {
      type: String,
      required: true,
    },
    assignedStaff: {
      type: String,
      required: true,
    },
    staffEmail: {
      type: String,
      required: true,
    },
    notes: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      enum: ["Pending", "In-Progress", "Completed"],
      default: "Pending",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Activity", activitySchema);
