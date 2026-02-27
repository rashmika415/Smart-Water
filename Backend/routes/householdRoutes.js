const express = require("express");
const router = express.Router();

const householdController = require("../controllers/householdController");
const zoneController = require("../controllers/zoneController");

const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");


/* ======================================================
   ADMIN — ALL HOUSEHOLDS WITH ZONES (FULL SYSTEM VIEW)
====================================================== */
router.get(
  "/all-with-zones",
  authMiddleware,
  roleMiddleware("admin"),
  householdController.getAllHouseholdsWithZones
);


/* ======================================================
   USER — MY HOUSEHOLDS
====================================================== */
router.get(
  "/my-households",
  authMiddleware,
  householdController.getMyHouseholds
);


/* ======================================================
   USER — MY HOUSEHOLDS WITH ZONES
====================================================== */
router.get(
  "/my-with-zones",
  authMiddleware,
  householdController.getMyHouseholdsWithZones
);


/* ======================================================
   ADMIN — ALL HOUSEHOLDS (LIST ONLY)
====================================================== */
router.get(
  "/",
  authMiddleware,
  roleMiddleware("admin"),
  householdController.getHouseholds
);


/* ======================================================
   CREATE HOUSEHOLD
====================================================== */
router.post(
  "/",
  authMiddleware,
  householdController.createHousehold
);


/* ======================================================
   ZONES INSIDE HOUSEHOLD
====================================================== */

// create zone
router.post(
  "/:id/zones",
  authMiddleware,
  zoneController.createZone
);

// get zones of a household
router.get(
  "/:id/zones",
  authMiddleware,
  zoneController.getZonesByHousehold
);


/* ======================================================
   SINGLE HOUSEHOLD (MUST BE LAST)
====================================================== */
router.get(
  "/:id",
  authMiddleware,
  householdController.getHouseholdById
);

router.put(
  "/:id",
  authMiddleware,
  householdController.updateHousehold
);

router.delete(
  "/:id",
  authMiddleware,
  householdController.deleteHousehold
);


module.exports = router;
