const express = require("express");
const router = express.Router();

// ✅ Import auth middleware
const authMiddleware = require("../middleware/authMiddleware");

// Import controller
const SavingPlanController = require("../controllers/SavingPlanController");

// Only one POST route for creating saving plan
router.post("/", authMiddleware, SavingPlanController.addSavingPlan);

// Other CRUD
router.get("/", SavingPlanController.getAllSavingPlans);
router.get("/weather/advice", authMiddleware, SavingPlanController.getWeatherAdvice);
router.get("/:id", SavingPlanController.getSavingPlanById);
router.put("/:id", SavingPlanController.updateSavingPlan);
router.delete("/:id", SavingPlanController.deleteSavingPlan);

module.exports = router;