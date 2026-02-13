const express = require("express");
const router = express.Router();

//Insert model
const SavingPlan = require("../models/SavingPlanModel");
//Insert controller
const SavingPlanController = require("../controllers/SavingPlanController");

router.get("/getAllSavingPlans", SavingPlanController.getAllSavingPlans);

//export
module.exports = router;