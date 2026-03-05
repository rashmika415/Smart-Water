const mongoose = require("mongoose");

const householdSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },

    // ✅ CHANGED: location is now an object (matches controller)
    location: {                 
      city: { type: String, required: true },
      state: { type: String },
      country: { type: String }
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
    },
    climateZone: {              // Wet / Dry / Intermediate
      type: String,
      default: "Intermediate"
    },
    predictedBill: {            // optional, calculated from estimated units
      type: Number,
      default: 0
    },

    // ✅ NEW: link zones
    zones: [{ type: mongoose.Schema.Types.ObjectId, ref: "Zone" }]
  },
  { timestamps: true }
);

module.exports = mongoose.model("Household", householdSchema);