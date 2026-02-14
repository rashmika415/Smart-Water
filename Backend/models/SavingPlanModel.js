const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const SavingPlanSchema = new mongoose.Schema({
   householdId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Household',
    required: true
  },
  planType: {
    type: String,
    required: true
  },
  householdSize: {
    type: Number,
    required: true
  },
  priorityArea: {
    type: String,
    required: true
  },
  customGoalPercentage: {
    type: Number,
    default: null
  },
  waterSource: {
    type: String,  //data type
    required: true  //validation
  }
});

module.exports = mongoose.model(
    "SavingPlanModel", //file name
    SavingPlanSchema //function name
);