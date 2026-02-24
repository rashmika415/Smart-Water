const express = require("express");
const router = express.Router();

const usageController = require("../controllers/usageController");
const verifyToken = require("../middleware/authMiddleware");
const {
	validateObjectId,
	validateUsageInput,
	validateBulkUsageInput,
} = require("../middleware/validationMiddleware");

// Statistics and export routes (must be before /:id routes)
router.get("/stats", verifyToken, usageController.getUsageStats);
router.get("/export", verifyToken, usageController.exportUsageData);

// Bulk operations
router.post("/bulk", verifyToken, validateBulkUsageInput, usageController.bulkCreateUsage);
router.post("/bulk-delete", verifyToken, usageController.bulkDeleteUsage);

// Create usage record (protected - requires authentication and validation)
router.post("/", verifyToken, validateUsageInput, usageController.createUsage);

// Get all usage records with pagination and filtering (protected)
router.get("/", verifyToken, usageController.getAllUsages);

// Restore a soft-deleted usage record
router.patch("/:id/restore", verifyToken, validateObjectId("id"), usageController.restoreUsage);

// Get single usage record by ID (protected)
router.get("/:id", verifyToken, validateObjectId("id"), usageController.getUsageById);

// Update usage record by ID (protected)
router.put("/:id", verifyToken, validateObjectId("id"), validateUsageInput, usageController.updateUsage);

// Delete usage record by ID - soft delete (protected)
router.delete("/:id", verifyToken, validateObjectId("id"), usageController.deleteUsage);

module.exports = router;
