const express = require("express");
const router = express.Router();

//Insert model
const SavingPlan = require("../models/SavingPlanModel");
//Insert controller
const SavingPlanController = require("../controllers/SavingPlanController");

router.get("/", SavingPlanController.getAllSavingPlans);
router.post("/", SavingPlanController.addSavingPlan);
router.get("/:id", SavingPlanController.getSavingPlanById);
router.put("/:id", SavingPlanController.updateSavingPlan);
router.delete("/:id", SavingPlanController.deleteSavingPlan);
//export
module.exports = router;