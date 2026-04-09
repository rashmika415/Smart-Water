// controllers/SavingPlanController.js

const SavingPlan = require('../models/SavingPlanModel');
const Household = require('../models/householdModel');
const Usage = require('../models/UsageModel');
const User = require('../models/userModel');
const { generateSavingTips } = require('../utils/savingTips');
const { calculateWaterSaving } = require('../utils/waterSavingCalculation');
const { getWeatherForLocation } = require('../services/WaterSavingWeatherService');

// GET all saving plans
const getAllSavingPlans = async (req, res) => {
  try {
    const tokenRole = (req.user?.role || req.user?.user?.role || "").toString().trim().toLowerCase();
    const userId =
      req.user?.id ||
      req.user?._id ||
      req.user?.user?.id ||
      req.user?.user?._id;
    let role = tokenRole;

    // Fallback: resolve role from database if token payload role is missing/unexpected.
    if (!role && userId) {
      const currentUser = await User.findById(userId).select("role");
      role = (currentUser?.role || "").toString().trim().toLowerCase();
    }

    const query = {};

    if (role !== "admin") {
      const ownerId = userId;
      const household = await Household.findOne({ userId: ownerId });

      if (!household) {
        return res.status(404).json({ message: "No household found for this user" });
      }

      query.householdId = household._id;
    }

    const savingPlans = await SavingPlan.find(query).populate({
      path: "householdId",
      populate: { path: "userId", select: "name email" }
    });

    if (!savingPlans || savingPlans.length === 0) {
      return res.status(200).json({
        count: 0,
        savingPlans: [],
      });
    }

    const enhancedSavingPlans = [];

    for (const plan of savingPlans) {
      try {
        const planObj = plan.toObject();
        const populatedHousehold = plan.householdId || {};

        // Water calculation
        planObj.savingCalculation = calculateWaterSaving(
          planObj.totalWaterUsagePerDay,
          planObj.targetReductionPercentage
        );

        // Add water saving tips
        planObj.savingTips = generateSavingTips(planObj.priorityArea);

        // Ensure customGoalPercentage null for non-custom plans
        if (planObj.planType !== "Custom") {
          planObj.customGoalPercentage = null;
        }

        // Preserve household and user metadata for admin display
        planObj.householdId = populatedHousehold._id?.toString() || null;
        planObj.householdName = populatedHousehold.name || null;
        planObj.user = populatedHousehold.userId
          ? {
              id: populatedHousehold.userId._id?.toString(),
              name: populatedHousehold.userId.name,
              email: populatedHousehold.userId.email,
            }
          : null;

        // Weather data
        const city = populatedHousehold.location?.city || null;
        planObj.weatherData = await getWeatherForLocation(city);

        enhancedSavingPlans.push(planObj);
      } catch (err) {
        console.log(`Error processing plan ${plan._id}:`, err.message);
        const planObj = plan.toObject();
        const populatedHousehold = plan.householdId || {};
        planObj.householdId = populatedHousehold._id?.toString() || null;
        planObj.householdName = populatedHousehold.name || null;
        planObj.user = populatedHousehold.userId
          ? {
              id: populatedHousehold.userId._id?.toString(),
              name: populatedHousehold.userId.name,
              email: populatedHousehold.userId.email,
            }
          : null;
        planObj.weatherData = {
          error: "Failed to fetch weather data",
          gardenAdvice: "⚠ Weather service temporarily unavailable"
        };
        planObj.savingTips = generateSavingTips(planObj.priorityArea);
        planObj.savingCalculation = calculateWaterSaving(
          planObj.totalWaterUsagePerDay,
          planObj.targetReductionPercentage
        );
        enhancedSavingPlans.push(planObj);
      }
    }

    return res.status(200).json({
      count: enhancedSavingPlans.length,
      savingPlans: enhancedSavingPlans
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: "Error fetching saving plans" });
  }
};

// ADD new saving plan
const addSavingPlan = async (req, res) => {
  try {
    const household = await Household.findOne({ userId: req.user.id || req.user._id });
    if (!household) {
      return res.status(404).json({ message: "No household found for this user" });
    }

    const {
      planType,
      householdSize,
      priorityArea,
      customGoalPercentage,
      waterSource
    } = req.body;

    // Required fields
    if (!planType || !householdSize || !priorityArea || !waterSource) {
      return res.status(400).json({ message: "All required fields must be provided" });
    }

    // Plan type validation
    const allowedPlanTypes = ["Basic", "Advanced", "Custom"];
    if (!allowedPlanTypes.includes(planType)) {
      return res.status(400).json({ message: "Invalid plan type" });
    }

    // Numeric validation
    if (isNaN(householdSize) || householdSize < 1) {
      return res.status(400).json({
        message: "Household size must be a number greater than or equal to 1"
      });
    }

    // Fetch daily water usage from usage data
    const days = 30; // Last 30 days
    const end = new Date();
    const start = new Date(end.getTime() - days * 24 * 60 * 60 * 1000);

    const usageResult = await Usage.aggregate([
      {
        $match: {
          householdId: household._id,
          occurredAt: { $gte: start, $lte: end },
          deletedAt: null,
        },
      },
      {
        $group: {
          _id: null,
          totalLiters: { $sum: "$liters" },
          daysWithUsage: { $addToSet: { $dateToString: { format: "%Y-%m-%d", date: "$occurredAt" } } },
        },
      },
      {
        $project: {
          _id: 0,
          totalLiters: 1,
          daysWithUsage: { $size: "$daysWithUsage" },
        },
      },
    ]);

    let totalWaterUsagePerDay = 0;
    if (usageResult.length > 0) {
      const totalLiters = usageResult[0].totalLiters || 0;
      const daysWithUsage = usageResult[0].daysWithUsage || 0;
      totalWaterUsagePerDay = daysWithUsage > 0 ? Math.round(totalLiters / daysWithUsage) : 0;
    }

    if (totalWaterUsagePerDay <= 0) {
      return res.status(400).json({
        message: "Unable to calculate daily water usage. Please ensure you have usage records."
      });
    }

    let targetReductionPercentage = 0;

    switch (planType) {
      case "Basic":
        targetReductionPercentage = 10;
        break;

      case "Advanced":
        targetReductionPercentage = 20;
        break;

      case "Custom":
        if (
          !customGoalPercentage ||
          isNaN(customGoalPercentage) ||
          customGoalPercentage < 1 ||
          customGoalPercentage > 100
        ) {
          return res.status(400).json({
            message: "Custom goal percentage must be between 1 and 100"
          });
        }

        targetReductionPercentage = customGoalPercentage;
        break;
    }

    // Only one active plan per household
    const existingPlan = await SavingPlan.findOne({
      householdId: household._id,
      status: "Active"
    });

    if (existingPlan) {
      return res.status(400).json({
        message: "An active saving plan already exists"
      });
    }

    const newSavingPlan = new SavingPlan({
      householdId: household._id,
      planType,
      householdSize,
      totalWaterUsagePerDay,
      priorityArea,
      waterSource,
      customGoalPercentage: planType === "Custom" ? customGoalPercentage : null,
      targetReductionPercentage,
      status: "Active",
      createdAt: new Date()
    });

    await newSavingPlan.save();

    const savedPlanObj = newSavingPlan.toObject();
    savedPlanObj.savingCalculation = calculateWaterSaving(
      totalWaterUsagePerDay,
      targetReductionPercentage
    );
    savedPlanObj.savingTips = generateSavingTips(priorityArea);
    savedPlanObj.customGoalPercentage = planType === "Custom" ? customGoalPercentage : null;
    savedPlanObj.householdId = household._id.toString();
    savedPlanObj.weatherData = await getWeatherForLocation(household.location?.city || null);

    return res.status(201).json({
      success: true,
      message: "Saving plan created successfully",
      data: savedPlanObj
    });

  } catch (error) {
    return res.status(500).json({
      message: "Server Error",
      error: error.message
    });
  }
};

// GET saving plan by ID
const getSavingPlanById = async (req, res) => {
  const id = req.params.id;
  let savingPlan;
  try {
    savingPlan = await SavingPlan.findById(id).populate('householdId');
  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: "Error fetching saving plan" });
  }

  if (!savingPlan) return res.status(404).json({ message: "No saving plan found" });

  try {
    const planObj = savingPlan.toObject();
    planObj.savingCalculation = calculateWaterSaving(
      planObj.totalWaterUsagePerDay,
      planObj.targetReductionPercentage
    );
    planObj.savingTips = generateSavingTips(planObj.priorityArea);

    const householdIdValue = savingPlan.householdId?._id?.toString() || null;
    planObj.householdId = householdIdValue;

    const city = savingPlan.householdId?.location?.city || null;
    planObj.weatherData = await getWeatherForLocation(city);

    if (planObj.planType !== "Custom") planObj.customGoalPercentage = null;

    return res.status(200).json({ savingPlan: planObj });

  } catch (err) {
    const planObj = savingPlan.toObject();
    planObj.householdId = savingPlan.householdId?._id?.toString() || null;
    planObj.weatherData = { error: "Failed to fetch weather data", gardenAdvice: "⚠ Weather service temporarily unavailable" };
    planObj.savingCalculation = calculateWaterSaving(
      planObj.totalWaterUsagePerDay,
      planObj.targetReductionPercentage
    );
    planObj.savingTips = generateSavingTips(planObj.priorityArea);
    return res.status(200).json({ savingPlan: planObj });
  }
};

// UPDATE saving plan
const updateSavingPlan = async (req, res) => {
  const id = req.params.id;

  const {
    planType,
    householdSize,
    totalWaterUsagePerDay,
    priorityArea,
    customGoalPercentage,
    waterSource
  } = req.body;

  const allowedPlanTypes = ["Basic", "Advanced", "Custom"];

  if (planType && !allowedPlanTypes.includes(planType)) {
    return res.status(400).json({ message: "Invalid plan type" });
  }

  if (householdSize && (isNaN(householdSize) || householdSize < 1)) {
    return res.status(400).json({
      message: "Household size must be greater than or equal to 1"
    });
  }

  if (totalWaterUsagePerDay && (isNaN(totalWaterUsagePerDay) || totalWaterUsagePerDay < 0)) {
    return res.status(400).json({
      message: "Total water usage must be a positive number"
    });
  }

  if (
    planType === "Custom" &&
    (
      !customGoalPercentage ||
      isNaN(customGoalPercentage) ||
      customGoalPercentage < 1 ||
      customGoalPercentage > 100
    )
  ) {
    return res.status(400).json({
      message: "Custom goal percentage must be between 1 and 100"
    });
  }

  try {
    const updatedPlan = await SavingPlan.findByIdAndUpdate(
      id,
      {
        planType,
        householdSize,
        totalWaterUsagePerDay,
        priorityArea,
        customGoalPercentage,
        waterSource
      },
      { new: true }
    );

    if (!updatedPlan) {
      return res.status(404).json({ message: "Saving plan not found" });
    }

    return res.status(200).json({ savingPlan: updatedPlan });

  } catch (err) {
    return res.status(500).json({ message: "Unable to update" });
  }
};
// DELETE saving plan
const deleteSavingPlan = async (req, res) => {
  const id = req.params.id;
  let savingPlan;
  try {
    savingPlan = await SavingPlan.findByIdAndDelete(id);
  } catch (err) {
    return res.status(500).json({ message: "Unable to delete" });
  }

  if (!savingPlan) return res.status(404).json({ message: "Unable to delete" });
  return res.status(200).json({ message: "Saving plan successfully deleted" });
};

// GET water saving calculation for logged-in user
const getSavingCalculation = async (req, res) => {
  try {
    const household = await Household.findOne({ userId: req.user.id || req.user._id });
    if (!household) return res.status(404).json({ message: "Household not found" });

    const savingPlan = await SavingPlan.findOne({ householdId: household._id });
    if (!savingPlan) return res.status(404).json({ message: "Saving plan not found" });

    const calculation = calculateWaterSaving(savingPlan.totalWaterUsagePerDay, savingPlan.targetReductionPercentage);
    return res.status(200).json(calculation);

  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// Export all functions
module.exports = {
  getAllSavingPlans,
  addSavingPlan,
  getSavingPlanById,
  updateSavingPlan,
  deleteSavingPlan,
  getSavingCalculation
};