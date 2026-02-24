const Household = require("../models/householdModel");
const Zone = require("../models/zoneModel");
const estimateUsage = require("../utils/estimateUsage");
const { PRICE_PER_UNIT } = require("../config/waterConfig");
const mongoose = require("mongoose");


/* ======================================================
   CREATE HOUSEHOLD (Owner = logged user)
   Auto calculates estimated water usage using weather API
====================================================== */
exports.createHousehold = async (req, res) => {
  try {
    console.log("Logged user:", req.user);

    const { name, numberOfResidents, propertyType, location } = req.body;

    // =====================
    // VALIDATION
    // =====================
    if (!name || name.trim() === "") {
      return res.status(400).json({ message: "Household name required" });
    }
    if (!numberOfResidents || numberOfResidents <= 0) {
      return res.status(400).json({ message: "Residents must be greater than 0" });
    }
    if (!propertyType || propertyType.trim() === "") {
      return res.status(400).json({ message: "Property type required" });
    }
    if (!location || !location.city || location.city.trim() === "") {
      return res.status(400).json({ message: "Location must include city" });
    }

    const userId = req.user.id || req.user._id;

    const city = location.city.trim();

    const usage = await estimateUsage({
      numberOfPeople: numberOfResidents,
      location: city
    });

    // ⭐ CALCULATE BILL
    let predictedBill = (usage.monthlyUnits || 0) * PRICE_PER_UNIT;

    if (usage.zone === "Wet") predictedBill *= 0.9;
    if (usage.zone === "Dry") predictedBill *= 1.15;

    const household = new Household({
      name,
      numberOfResidents,
      propertyType,
      location,
      userId,
      estimatedMonthlyLiters: isNaN(usage.monthlyLiters) ? 0 : Math.round(usage.monthlyLiters),
      estimatedMonthlyUnits: isNaN(usage.monthlyUnits) ? 0 : Math.round(usage.monthlyUnits * 100) / 100,
      climateZone: usage.zone || "Intermediate",
      predictedBill: isNaN(predictedBill) ? 0 : Math.round(predictedBill * 100) / 100
    });

    await household.save();
    res.status(201).json(household);

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


/* ======================================================
   GET HOUSEHOLDS
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
      query.userId = req.user.id || req.user._id;
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
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid household ID" });
    }

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
   Recalculates estimated usage if data changed
====================================================== */
exports.updateHousehold = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid household ID" });
    }

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

    if (name !== undefined && name.trim() === "") {
      return res.status(400).json({ message: "Household name cannot be empty" });
    }
    if (numberOfResidents !== undefined && numberOfResidents <= 0) {
      return res.status(400).json({ message: "Residents must be greater than 0" });
    }
    if (propertyType !== undefined && propertyType.trim() === "") {
      return res.status(400).json({ message: "Property type cannot be empty" });
    }
    if (location !== undefined && (!location.city || location.city.trim() === "")) {
      return res.status(400).json({ message: "Location must include city" });
    }

    household.name = name ?? household.name;
    household.numberOfResidents = numberOfResidents ?? household.numberOfResidents;
    household.propertyType = propertyType ?? household.propertyType;
    household.location = location ?? household.location;

    const city = household.location.city.trim();
    const usage = await estimateUsage({
      numberOfPeople: household.numberOfResidents,
      location: city
    });

    household.estimatedMonthlyLiters = isNaN(usage.monthlyLiters) ? 0 : Math.round(usage.monthlyLiters);
    household.estimatedMonthlyUnits = isNaN(usage.monthlyUnits) ? 0 : Math.round(usage.monthlyUnits * 100) / 100;
    household.climateZone = usage.zone || "Intermediate";

    // ⭐ RECALCULATE BILL
    let predictedBill = (usage.monthlyUnits || 0) * PRICE_PER_UNIT;

    if (usage.zone === "Wet") predictedBill *= 0.9;
    if (usage.zone === "Dry") predictedBill *= 1.15;

    household.predictedBill = isNaN(predictedBill) ? 0 : Math.round(predictedBill * 100) / 100;

    await household.save();

    res.json(household);

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


/* ======================================================
   DELETE HOUSEHOLD + RELATED ZONES
====================================================== */
exports.deleteHousehold = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid household ID" });
    }

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
    const households = await Household.find({
      userId: req.user.id || req.user._id
    });
    res.json(households);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


/* ======================================================
   GET MY HOUSEHOLDS WITH ZONES
====================================================== */
exports.getMyHouseholdsWithZones = async (req, res) => {
  try {
    const households = await Household.find({
      userId: req.user.id || req.user._id
    });

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