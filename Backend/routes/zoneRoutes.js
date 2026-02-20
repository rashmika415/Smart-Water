const express = require("express");
const router = express.Router();
const zoneController = require("../controllers/zoneController");

router.put("/:zoneId", zoneController.updateZone);
router.delete("/:zoneId", zoneController.deleteZone);

module.exports = router;
