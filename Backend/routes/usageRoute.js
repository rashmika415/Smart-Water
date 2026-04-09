const express = require("express");
const router = express.Router();

const usageController = require("../controllers/usageController");
const verifyToken = require("../middleware/authMiddleware");
const {
	validateObjectId,
	validateUsageInput,
	validateUsageUpdateInput,
} = require("../middleware/validationMiddleware");



// Get carbon footprint statistics for a household
router.get("/carbon-stats", verifyToken, usageController.getCarbonStats);

// Get carbon footprint breakdown by activity type
router.get("/carbon-by-activity", verifyToken, usageController.getCarbonByActivity);

// Get carbon footprint leaderboard (compare households)
router.get("/carbon-leaderboard", verifyToken, usageController.getCarbonLeaderboard);

// Get daily carbon footprint trend
router.get("/carbon-trend", verifyToken, usageController.getCarbonTrend);

// Get daily water usage for the user's household
router.get("/daily-water-usage", verifyToken, usageController.getDailyWaterUsage);

// ========================================
// Standard CRUD Operations
// ========================================

// Create usage record (protected - requires authentication)
router.post("/", verifyToken, validateUsageInput, usageController.createUsage);

// Get all usage records (protected - returns only user's own records)
router.get("/", verifyToken, usageController.getAllUsages);

// Get single usage record by ID (protected)
router.get("/:id", verifyToken, validateObjectId("id"), usageController.getUsageById);

// Update usage record by ID (protected)
router.put("/:id", verifyToken, validateObjectId("id"), validateUsageUpdateInput, usageController.updateUsage);

// Delete usage record by ID - soft delete (protected)
router.delete("/:id", verifyToken, validateObjectId("id"), usageController.deleteUsage);

module.exports = router;