const mongoose = require("mongoose");

const zoneSchema = new mongoose.Schema(
  {
    householdId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Household",
      required: true
    },
    zoneName: {
      type: String,
      required: true,
      trim: true
    },
    notes: {
      type: String
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Zone", zoneSchema);
