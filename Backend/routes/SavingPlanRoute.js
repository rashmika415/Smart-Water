const express = require("express");
const router = express.Router();

// ✅ Import auth middleware
const authMiddleware = require("../middleware/authMiddleware");

// Import controller functions individually
const {
  addSavingPlan,
  getAllSavingPlans,
  getSavingPlanById,
  updateSavingPlan,
  deleteSavingPlan,
  getSavingCalculation
} = require("../controllers/SavingPlanController");

// Routes

// Create a new saving plan
router.post("/", authMiddleware, addSavingPlan); 
// Get all saving plans for the logged-in user
router.get("/", authMiddleware, getAllSavingPlans);

// Get water saving calculation for logged-in user
router.get("/calculation", authMiddleware, getSavingCalculation);

// Get a plan by ID
router.get("/:id", getSavingPlanById);

// Update a plan
router.put("/:id", updateSavingPlan);

// Delete a plan
router.delete("/:id", deleteSavingPlan);

module.exports = router;