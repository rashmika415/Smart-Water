const SavingPlan = require('../models/SavingPlanModel');
const Household =require('../models/householdModel');
const getAllSavingPlans = async (req, res) => {
    let savingPlans;
    try {
         savingPlans = await SavingPlan.find();
    } catch (err) {
        console.log(err);
    }
    if (!savingPlans) {
        return res.status(404).json({ message: "No saving plans found" });
    }
    //display all saving plans in json format
    return res.status(200).json({ savingPlans });
};

//data Insert
const addSavingPlan = async (req, res) => {
    const { householdId, planType, householdSize,priorityArea,customGoalPercentage,waterSource } = req.body;
    let savingPlan;
    try {
        savingPlan = new SavingPlan({
            householdId,
            planType,
            householdSize,
            priorityArea,
            customGoalPercentage,   
            waterSource
        });
        await savingPlan.save();
    } catch (err) {
        console.log(err);
    }
    //not insert saving plan
    if (!savingPlan) {
        return res.status(404).json({ message: "Unable to add" });
    }

    //insert saving plan successfully
    return res.status(200).json({ savingPlan });
};

//get by id
const getSavingPlanById = async (req, res) => {
    const id = req.params.id;
    let savingPlan;
    try {
        savingPlan = await SavingPlan
            .findById(id);
    } catch (err) {
        console.log(err);
    }   
    if (!savingPlan) {
        return res.status(404).json({ message: "No saving plan found" });
    }
    return res.status(200).json({ savingPlan });
};
const updateSavingPlan = async (req, res) => {
    const id = req.params.id;
    const { householdId, planType, householdSize,priorityArea,customGoalPercentage,waterSource } = req.body;    
    let savingPlan;
    try {
        savingPlan = await SavingPlan.findByIdAndUpdate(id, {
            householdId,
            planType,
            householdSize,  
            priorityArea,
            customGoalPercentage,
            waterSource
        });
        savingPlan = await savingPlan.save();
    } catch (err) {
        console.log(err);
    }   
    if (!savingPlan) {
        return res.status(404).json({ message: "Unable to update" });
    }
    return res.status(200).json({ savingPlan });
};
const deleteSavingPlan = async (req, res) => {  
    const id = req.params.id;
    let savingPlan;
    try {
        savingPlan = await SavingPlan.findByIdAndDelete(id);
    
    } catch (err) {
        console.log(err);
    }
    if (!savingPlan) {
        return res.status(404).json({ message: "Unable to delete" });
    }   
    return res.status(200).json({ message: "Saving plan successfully deleted" });
};

exports.createSavingPlan = async (req, res) => {
  try {

    // 1️⃣ Find household of logged user
    const household = await Household.findOne({
      userId: req.user.id || req.user._id
    });

    if (!household) {
      return res.status(404).json({ message: "No household found for this user" });
    }

    // 2️⃣ Create saving plan automatically linked
    const savingPlan = new SavingPlan({
      householdId: household._id,  //  automatic
      planType: req.body.planType,
      householdSize: req.body.householdSize,
      priorityArea: req.body.priorityArea,
      customGoalPercentage: req.body.customGoalPercentage,
      waterSource: req.body.waterSource
    });

    await savingPlan.save();
    res.status(201).json(savingPlan);

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


exports.getAllSavingPlans = getAllSavingPlans;
exports.addSavingPlan = addSavingPlan;
exports.getSavingPlanById = getSavingPlanById;
exports.deleteSavingPlan = deleteSavingPlan;
exports.updateSavingPlan = updateSavingPlan;