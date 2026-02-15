const express = require("express");
const router = express.Router();

const usageController = require("../controllers/usageController");

// Create usage record
router.post("/", usageController.createUsage);

// Get all usage records (with optional filters)
router.get("/", usageController.getAllUsages);

// Get single usage record by ID
router.get("/:id", usageController.getUsageById);

// Update usage record by ID
router.put("/:id", usageController.updateUsage);

// Delete usage record by ID (soft delete)
router.delete("/:id", usageController.deleteUsage);

module.exports = router;
