const Zone = require("../models/zoneModel");
const Household = require("../models/householdModel");

// ===============================
// CREATE zone inside household
// ===============================
exports.createZone = async (req, res) => {
  try {
    const household = await Household.findById(req.params.id);

    if (!household)
      return res.status(404).json({ message: "Household not found" });

    // ✅ OWNER CHECK (same as household logic)
    if (
      household.userId.toString() !== req.user.id &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({ message: "Access denied" });
    }

    const zone = new Zone({
      householdId: req.params.id,
      zoneName: req.body.zoneName,
      notes: req.body.notes
    });

    await zone.save();

    // ✅ NEW: link zone to household without changing other logic
    household.zones.push(zone._id);
    await household.save();

    res.status(201).json(zone);

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ===============================
// GET zones of household
// ===============================
exports.getZonesByHousehold = async (req, res) => {
  try {
    const household = await Household.findById(req.params.id);

    if (!household)
      return res.status(404).json({ message: "Household not found" });

    // ✅ OWNER CHECK
    if (
      household.userId.toString() !== req.user.id &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({ message: "Access denied" });
    }

    const zones = await Zone.find({ householdId: req.params.id });
    res.json(zones);

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ===============================
// UPDATE zone
// ===============================
exports.updateZone = async (req, res) => {
  try {
    const zone = await Zone.findById(req.params.zoneId);
    if (!zone)
      return res.status(404).json({ message: "Zone not found" });

    const household = await Household.findById(zone.householdId);

    // ✅ OWNER CHECK
    if (
      household.userId.toString() !== req.user.id &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({ message: "Access denied" });
    }

    const updatedZone = await Zone.findByIdAndUpdate(
      req.params.zoneId,
      req.body,
      { new: true }
    );

    res.json(updatedZone);

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ===============================
// DELETE zone
// ===============================
exports.deleteZone = async (req, res) => {
  try {
    const zone = await Zone.findById(req.params.zoneId);
    if (!zone)
      return res.status(404).json({ message: "Zone not found" });

    const household = await Household.findById(zone.householdId);

    // ✅ OWNER CHECK
    if (
      household.userId.toString() !== req.user.id &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({ message: "Access denied" });
    }

    await Zone.findByIdAndDelete(req.params.zoneId);
    res.json({ message: "Zone deleted" });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};