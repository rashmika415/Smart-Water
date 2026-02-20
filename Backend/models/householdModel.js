const mongoose = require("mongoose");

const householdSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    location: {                 // <-- renamed from 'address' to 'location' to match controller
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
    userId: {                   // <-- MUST include userId to store owner
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Household", householdSchema);
