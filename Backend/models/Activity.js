const mongoose = require("mongoose");

const activitySchema = new mongoose.Schema(
  {
    activityType: {
      type: String,
      required: true,
      enum: [
        "Water Tank Cleaning",
        "Pipe Inspection",
        "Leak Repair",
        "Filter Replacement",
      ],
    },
    scheduledDateTime: {
      type: Date,
      required: true,
    },
    location: {
      type: String,
      required: true,
      enum: ["Kitchen", "Bathroom", "Roof Tank", "Garden"],
    },
    assignedStaff: {
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
    timestamps: true, // Adds createdAt and updatedAt fields
  }
);

module.exports = mongoose.model("Activity", activitySchema);
