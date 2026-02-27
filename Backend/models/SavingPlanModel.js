const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const SavingPlanSchema = new mongoose.Schema({
  householdId: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "Household",
  required: true
  },

  planType: {
    type: String,
    enum: ["Basic", "Advanced", "Custom"],
    required: true
  },
  householdSize: {
    type: Number,
    required: true
  },
  totalWaterUsagePerDay: {
    type: Number,
    required: true
  },
  priorityArea: {
    type: String,
    enum: ["Kitchen", "Bathroom", "Garden", "Laundry", "General"],
    required: true
  },
  // Only used when planType = Custom
  customGoalPercentage: {
    type: Number,
    min: 1,
    max: 100,
    default: null
  },
   // Final percentage used by system
  targetReductionPercentage: {
    type: Number,
    required: true
  },
  waterSource: {
    type: String,  //data type
    enum: ["Municipal", "Well", "Rainwater", "Mixed"],
    required: true  //validation
  }
});

module.exports = mongoose.model(
    "SavingPlanModel", //file name
    SavingPlanSchema //function name
);