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
exports.getAllSavingPlans = getAllSavingPlans;