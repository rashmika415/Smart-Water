const express = require("express");
const router = express.Router();

const usageController = require("../controllers/usageController");
const verifyToken = require("../middleware/authMiddleware");

// Create usage record (protected - requires authentication)
router.post("/", verifyToken, usageController.createUsage);

// Get all usage records (protected - returns only user's own records)
router.get("/", verifyToken, usageController.getAllUsages);

// Get single usage record by ID (protected)
router.get("/:id", verifyToken, usageController.getUsageById);

// Update usage record by ID (protected)
router.put("/:id", verifyToken, usageController.updateUsage);

// Delete usage record by ID - soft delete (protected)
router.delete("/:id", verifyToken, usageController.deleteUsage);

module.exports = router;