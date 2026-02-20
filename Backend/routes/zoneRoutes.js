const express = require("express");
const router = express.Router();
const zoneController = require("../controllers/zoneController");
const authMiddleware = require("../middleware/authMiddleware");

// update zone
router.put("/:zoneId", authMiddleware, zoneController.updateZone);

// delete zone
router.delete("/:zoneId", authMiddleware, zoneController.deleteZone);

module.exports = router;
