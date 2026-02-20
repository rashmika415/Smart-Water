const Household = require("../models/householdModel");
const Zone = require("../models/zoneModel");


/* ======================================================
   CREATE HOUSEHOLD (Owner = logged user)
   Now supports location and ensures userId is saved
====================================================== */
exports.createHousehold = async (req, res) => {
  try {
    // Debug: show logged user info
    console.log("Logged user:", req.user);

    const { name, numberOfResidents, propertyType, location } = req.body;

    // Ensure correct userId from token (id or _id)
    const userId = req.user.id || req.user._id;

    const household = new Household({
      name,
      numberOfResidents,
      propertyType,
      location,
      userId   // <-- fixed
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
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const search = req.query.search || "";

    const query = {
      name: { $regex: search, $options: "i" }
    };

    if (req.user.role !== "admin") {
      query.userId = req.user.id || req.user._id; // fallback
    }

    const households = await Household.find(query)
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await Household.countDocuments(query);

    res.json({
      total,
      page,
      pages: Math.ceil(total / limit),
      households
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


  /* ======================================================
     GET ALL HOUSEHOLDS WITH ZONES (ADMIN)
  ====================================================== */
  exports.getAllHouseholdsWithZones = async (req, res) => {
    try {
      const households = await Household.find({});

      const householdIds = households.map(h => h._id);

      const zones = await Zone.find({
        householdId: { $in: householdIds }
      });

      const result = households.map(h => ({
        household: h,
        zones: zones.filter(
          z => z.householdId.toString() === h._id.toString()
        )
      }));

      res.json(result);

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

    if (
      req.user.role !== "admin" &&
      household.userId.toString() !== (req.user.id || req.user._id)
    ) {
      return res.status(403).json({ message: "Access denied" });
    }

    res.json(household);

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


/* ======================================================
   UPDATE HOUSEHOLD (owner or admin)
====================================================== */
exports.updateHousehold = async (req, res) => {
  try {
    const household = await Household.findById(req.params.id);

    if (!household)
      return res.status(404).json({ message: "Household not found" });

    if (
      req.user.role !== "admin" &&
      household.userId.toString() !== (req.user.id || req.user._id)
    ) {
      return res.status(403).json({ message: "Access denied" });
    }

    const { name, numberOfResidents, propertyType, location } = req.body;

    const updated = await Household.findByIdAndUpdate(
      req.params.id,
      { name, numberOfResidents, propertyType, location },
      { new: true, runValidators: true }
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
      household.userId.toString() !== (req.user.id || req.user._id)
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
   GET MY HOUSEHOLDS
====================================================== */
exports.getMyHouseholds = async (req, res) => {
  try {
    const households = await Household.find({ userId: req.user.id || req.user._id });
    res.json(households);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


/* ======================================================
   GET MY HOUSEHOLDS WITH ZONES (FAST VERSION)
====================================================== */
exports.getMyHouseholdsWithZones = async (req, res) => {
  try {
    const households = await Household.find({ userId: req.user.id || req.user._id });

    const householdIds = households.map(h => h._id);

    const zones = await Zone.find({
      householdId: { $in: householdIds }
    });

    const result = households.map(h => ({
      household: h,
      zones: zones.filter(
        z => z.householdId.toString() === h._id.toString()
      )
    }));

    res.json(result);

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
