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
      required: false,
    },
    staffEmail: {
      type: String,
      required: false,
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
    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
    isIssue: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Activity", activitySchema);
