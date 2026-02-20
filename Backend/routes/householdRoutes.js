const express = require("express");
const router = express.Router();
const householdController = require("../controllers/householdController");
const zoneController = require("../controllers/zoneController");

router.post("/", householdController.createHousehold);
router.get("/", householdController.getHouseholds);
router.get("/:id", householdController.getHouseholdById);
router.put("/:id", householdController.updateHousehold);
router.delete("/:id", householdController.deleteHousehold);

router.post("/:id/zones", zoneController.createZone);
router.get("/:id/zones", zoneController.getZonesByHousehold);

module.exports = router;
