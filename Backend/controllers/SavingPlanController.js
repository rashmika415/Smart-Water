const SavingPlan = require('../models/SavingPlanModel');

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


exports.getAllSavingPlans = getAllSavingPlans;
exports.addSavingPlan = addSavingPlan;
exports.getSavingPlanById = getSavingPlanById;