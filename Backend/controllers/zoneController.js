const Zone = require("../models/zoneModel");
const Household = require("../models/householdModel");

//Create Zone in Household//
exports.createZone = async (req, res) => {
  try {
    const household = await Household.findById(req.params.id);
    if (!household)
      return res.status(404).json({ message: "Household not found" });

    const zone = new Zone({
      householdId: req.params.id,
      zoneName: req.body.zoneName,
      notes: req.body.notes
    });

    await zone.save();
    res.status(201).json(zone);

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


//Get Zones of Household//
exports.getZonesByHousehold = async (req, res) => {
  try {
    const zones = await Zone.find({ householdId: req.params.id });
    res.json(zones);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


//Update Zone//
exports.updateZone = async (req, res) => {
  try {
    const zone = await Zone.findByIdAndUpdate(
      req.params.zoneId,
      req.body,
      { new: true }
    );

    if (!zone)
      return res.status(404).json({ message: "Zone not found" });

    res.json(zone);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


//Delete Zone//
exports.deleteZone = async (req, res) => {
  try {
    const zone = await Zone.findByIdAndDelete(req.params.zoneId);

    if (!zone)
      return res.status(404).json({ message: "Zone not found" });

    res.json({ message: "Zone deleted" });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
