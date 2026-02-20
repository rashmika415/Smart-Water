const mongoose = require("mongoose");

const householdSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    location: {                 // <-- matches controller
      type: String
    },
    numberOfResidents: {
      type: Number,
      required: true,
      min: 1
    },
    propertyType: {
      type: String,
      enum: ["apartment", "house"],
      required: true
    },
    userId: {                   // <-- owner of household
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    // ⭐ NEW FIELDS FOR WEATHER-BASED ESTIMATION
    estimatedMonthlyLiters: {   // total water in liters
      type: Number
    },
    estimatedMonthlyUnits: {    // in cubic meters
      type: Number
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Household", householdSchema);
