const Household = require("../models/householdModel");
const Zone = require("../models/zoneModel");


/* ======================================================
   CREATE HOUSEHOLD (Owner = logged user)
====================================================== */
exports.createHousehold = async (req, res) => {
  try {
    const household = new Household({
      ...req.body,
      userId: req.user.id   // VERY IMPORTANT → ownership
    });

    await household.save();
    res.status(201).json(household);

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


/* ======================================================
   GET HOUSEHOLDS
   - Admin → all households
   - User → only their households
   - Pagination + search
====================================================== */
exports.getHouseholds = async (req, res) => {
  try {
    const { page = 1, limit = 5, search = "" } = req.query;

    const query = {
      name: { $regex: search, $options: "i" }
    };

    // If NOT admin → only own households
    if (req.user.role !== "admin") {
      query.userId = req.user.id;
    }

    const households = await Household.find(query)
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await Household.countDocuments(query);

    res.json({
      total,
      page: Number(page),
      households
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


/* ======================================================
   GET SINGLE HOUSEHOLD (secure)
====================================================== */
exports.getHouseholdById = async (req, res) => {
  try {
    const household = await Household.findById(req.params.id);

    if (!household)
      return res.status(404).json({ message: "Household not found" });

    // if user is not admin → must be owner
    if (
      req.user.role !== "admin" &&
      household.userId.toString() !== req.user.id
    ) {
      return res.status(403).json({ message: "Access denied" });
    }

    res.json(household);

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


/* ======================================================
   UPDATE HOUSEHOLD (owner or admin only)
====================================================== */
exports.updateHousehold = async (req, res) => {
  try {
    const household = await Household.findById(req.params.id);

    if (!household)
      return res.status(404).json({ message: "Household not found" });

    if (
      req.user.role !== "admin" &&
      household.userId.toString() !== req.user.id
    ) {
      return res.status(403).json({ message: "Access denied" });
    }

    const updated = await Household.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    res.json(updated);

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


/* ======================================================
   DELETE HOUSEHOLD + RELATED ZONES (secure)
====================================================== */
exports.deleteHousehold = async (req, res) => {
  try {
    const household = await Household.findById(req.params.id);

    if (!household)
      return res.status(404).json({ message: "Household not found" });

    if (
      req.user.role !== "admin" &&
      household.userId.toString() !== req.user.id
    ) {
      return res.status(403).json({ message: "Access denied" });
    }

    await Household.findByIdAndDelete(req.params.id);
    await Zone.deleteMany({ householdId: req.params.id });

    res.json({ message: "Household and zones deleted" });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


/* ======================================================
   GET MY HOUSEHOLDS WITH ZONES (NESTED DATA)
====================================================== */
exports.getMyHouseholdsWithZones = async (req, res) => {
  try {
    const households = await Household.find({
      userId: req.user.id
    });

    const result = [];

    for (let h of households) {
      const zones = await Zone.find({ householdId: h._id });

      result.push({
        household: h,
        zones
      });
    }

    res.json(result);

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
