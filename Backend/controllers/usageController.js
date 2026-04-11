
const Usage = require("../models/UsageModel");
const Household = require("../models/householdModel");
const mongoose = require("mongoose");
const {
	aggregateCarbonFootprint,
	calculateWaterCarbon,
	isHeatedActivity,
} = require("../services/carbonService");
const {
	buildUsageFilter,
	getPaginationParams,
	getSortParams,
} = require("../utils/usageHelpers");

/**
 * Create a new usage record
 * @route POST /api/usage
 */
exports.createUsage = async (req, res) => {
	try {
		// 🔐 Get userId from JWT token (set by verifyToken middleware)
		const userId = req.user.id;

		// 🏠 Find the household owned by this user
		const household = await Household.findOne({ userId });
		if (!household) {
			return res.status(404).json({
				success: false,
				message: "No household found for this user. Please create a household first.",
			});
		}

		const {
			activityType,
			occurredAt,
			durationMinutes,
			count,
			flowRateLpm,
			litersPerUnit,
			liters,
			presetId,
			source,
			notes,
		} = req.body;

		if (!activityType) {
			return res.status(400).json({
				success: false,
				message: "Missing required field: activityType",
			});
		}

		const usage = new Usage({
			householdId: household._id,  // ✅ Automatically from token
			activityType,
			occurredAt: occurredAt ? new Date(occurredAt) : undefined,
			durationMinutes,
			count,
			flowRateLpm,
			litersPerUnit,
			liters,
			presetId,
			source,
			notes,
		});

		const savedUsage = await usage.save();
		const responseData = {
			_id: savedUsage._id,
			householdId: savedUsage.householdId,
			activityType: savedUsage.activityType,
			liters: savedUsage.liters,
			carbonFootprint: savedUsage.carbonFootprint
				? {
						carbonKg: savedUsage.carbonFootprint.carbonKg,
						energyKwh: savedUsage.carbonFootprint.energyKwh,
						equivalents: {
							carKm: savedUsage.carbonFootprint.equivalents?.carKm ?? 0,
							description: savedUsage.carbonFootprint.equivalents?.description || "",
						},
				  }
				: null,
			occurredAt: savedUsage.occurredAt,
			createdAt: savedUsage.createdAt,
		};

		return res.status(201).json({
			success: true,
			message: "Usage created successfully",
			data: responseData,
			carbonImpact: savedUsage.carbonFootprint
				? {
						carbonKg: savedUsage.carbonFootprint.carbonKg,
						message: `🌍 ${savedUsage.carbonFootprint.equivalents.description}`,
				  }
				: null,
		});
	} catch (error) {
		console.error("Error creating usage:", error);
		return res.status(500).json({
			success: false,
			message: "Error creating usage",
			error: error.message,
		});
	}
};

/**
 * Get all usage records
 * @route GET /api/usage
 * @query activityType - Optional filter by activity type
 */
exports.getAllUsages = async (req, res) => {
	try {
		// 🔐 Get userId from JWT token
		const userId = req.user.id;

		// 🏠 Find the household owned by this user
		const household = await Household.findOne({ userId });
		if (!household) {
			return res.status(404).json({
				success: false,
				message: "No household found for this user.",
			});
		}

		const filter = buildUsageFilter(req.query, household._id);
		const sort = getSortParams(req.query.sort);
		const { page, limit, skip } = getPaginationParams(req.query);

		const [usages, total] = await Promise.all([
			Usage.find(filter).sort(sort).skip(skip).limit(limit),
			Usage.countDocuments(filter),
		]);

		const responseData = usages.map((usage) => ({
			_id: usage._id,
			householdId: usage.householdId,
			activityType: usage.activityType,
			liters: usage.liters,
			durationMinutes: usage.durationMinutes,
			flowRateLpm: usage.flowRateLpm,
			count: usage.count,
			litersPerUnit: usage.litersPerUnit,
			carbonFootprint: usage.carbonFootprint
				? {
						carbonKg: usage.carbonFootprint.carbonKg,
						energyKwh: usage.carbonFootprint.energyKwh,
						breakdown: {
							treatment: usage.carbonFootprint.breakdown?.treatment ?? 0,
							heating: usage.carbonFootprint.breakdown?.heating ?? 0,
						},
						equivalents: {
							carKm: usage.carbonFootprint.equivalents?.carKm ?? 0,
							trees: usage.carbonFootprint.equivalents?.trees ?? 0,
							smartphones: usage.carbonFootprint.equivalents?.smartphones ?? 0,
							meals: usage.carbonFootprint.equivalents?.meals ?? 0,
						},
				  }
				: null,
			occurredAt: usage.occurredAt,
			createdAt: usage.createdAt,
			updatedAt: usage.updatedAt,
		}));

		return res.status(200).json({
			success: true,
			page,
			limit,
			count: responseData.length,
			total,
			totalPages: Math.ceil(total / limit),
			data: responseData,
		});
	} catch (error) {
		console.error("Error fetching usages:", error);
		return res.status(500).json({
			success: false,
			message: "Error fetching usages",
			error: error.message,
		});
	}
};

/**
 * Get a single usage record by ID
 * @route GET /api/usage/:id
 */
exports.getUsageById = async (req, res) => {
	try {
		const { id } = req.params;
		const userId = req.user.id;

		// 🏠 Find user's household
		const household = await Household.findOne({ userId });
		if (!household) {
			return res.status(404).json({
				success: false,
				message: "No household found for this user.",
			});
		}

		const usage = await Usage.findOne({ 
			_id: id, 
			deletedAt: null,
			householdId: household._id  // ✅ Security: only user's household data
		});

		if (!usage) {
			return res.status(404).json({
				success: false,
				message: "Usage record not found",
			});
		}

		const responseData = {
			_id: usage._id,
			householdId: usage.householdId,
			activityType: usage.activityType,
			liters: usage.liters,
			durationMinutes: usage.durationMinutes,
			flowRateLpm: usage.flowRateLpm,
			count: usage.count,
			litersPerUnit: usage.litersPerUnit,
			carbonFootprint: usage.carbonFootprint
				? {
						carbonKg: usage.carbonFootprint.carbonKg,
						energyKwh: usage.carbonFootprint.energyKwh,
						breakdown: {
							treatment: usage.carbonFootprint.breakdown?.treatment ?? 0,
							heating: usage.carbonFootprint.breakdown?.heating ?? 0,
						},
						equivalents: {
							carKm: usage.carbonFootprint.equivalents?.carKm ?? 0,
							trees: usage.carbonFootprint.equivalents?.trees ?? 0,
							smartphones: usage.carbonFootprint.equivalents?.smartphones ?? 0,
							meals: usage.carbonFootprint.equivalents?.meals ?? 0,
						},
				  }
				: null,
			occurredAt: usage.occurredAt,
			createdAt: usage.createdAt,
			updatedAt: usage.updatedAt,
		};

		return res.status(200).json({
			success: true,
			data: responseData,
		});
	} catch (error) {
		console.error("Error fetching usage:", error);
		return res.status(500).json({
			success: false,
			message: "Error fetching usage",
			error: error.message,
		});
	}
};

/**
 * Update a usage record
 * @route PUT /api/usage/:id
 */
exports.updateUsage = async (req, res) => {
	try {
		const { id } = req.params;
		const userId = req.user.id;

		// 🏠 Find user's household
		const household = await Household.findOne({ userId });
		if (!household) {
			return res.status(404).json({
				success: false,
				message: "No household found for this user.",
			});
		}

		const allowedFields = [
			"activityType",
			"occurredAt",
			"durationMinutes",
			"count",
			"flowRateLpm",
			"litersPerUnit",
			"liters",
			"presetId",
			"source",
			"notes",
		];

		const updateData = {};
		for (const field of allowedFields) {
			if (Object.prototype.hasOwnProperty.call(req.body, field)) {
				updateData[field] = req.body[field];
			}
		}

		if (Object.prototype.hasOwnProperty.call(updateData, "occurredAt") && updateData.occurredAt) {
			updateData.occurredAt = new Date(updateData.occurredAt);
		}

		if (Object.keys(updateData).length === 0) {
			return res.status(400).json({
				success: false,
				message: "No valid fields provided for update",
			});
		}

		const existingUsage = await Usage.findOne({
			_id: id,
			deletedAt: null,
			householdId: household._id,
		});

		if (!existingUsage) {
			return res.status(404).json({
				success: false,
				message: "Usage record not found",
			});
		}

		const shouldRecalculate =
			Object.prototype.hasOwnProperty.call(updateData, "durationMinutes") ||
			Object.prototype.hasOwnProperty.call(updateData, "flowRateLpm") ||
			Object.prototype.hasOwnProperty.call(updateData, "count") ||
			Object.prototype.hasOwnProperty.call(updateData, "litersPerUnit") ||
			Object.prototype.hasOwnProperty.call(updateData, "liters") ||
			Object.prototype.hasOwnProperty.call(updateData, "activityType");

		if (shouldRecalculate) {
			const mergedActivityType = updateData.activityType ?? existingUsage.activityType;
			const mergedDuration = updateData.durationMinutes ?? existingUsage.durationMinutes;
			const mergedFlowRate = updateData.flowRateLpm ?? existingUsage.flowRateLpm;
			const mergedCount = updateData.count ?? existingUsage.count;
			const mergedLitersPerUnit = updateData.litersPerUnit ?? existingUsage.litersPerUnit;

			let computedLiters =
				typeof updateData.liters === "number" && updateData.liters >= 0
					? updateData.liters
					: existingUsage.liters;

			if (Object.prototype.hasOwnProperty.call(updateData, "liters") && updateData.liters == null) {
				computedLiters = existingUsage.liters;
			}

			if (!Object.prototype.hasOwnProperty.call(updateData, "liters")) {
				if (mergedDuration != null && mergedFlowRate != null) {
					computedLiters = mergedDuration * mergedFlowRate;
				} else if (mergedCount != null && mergedLitersPerUnit != null) {
					computedLiters = mergedCount * mergedLitersPerUnit;
				}
			}

			updateData.liters = computedLiters;

			const carbonData = await calculateWaterCarbon(
				computedLiters,
				isHeatedActivity(mergedActivityType)
			);

			updateData.carbonFootprint = {
				carbonKg: carbonData.carbonKg,
				energyKwh: carbonData.energyKwh,
				breakdown: carbonData.breakdown,
				equivalents: carbonData.equivalents,
				isHeatedWater: isHeatedActivity(mergedActivityType),
				source: carbonData.source,
				calculatedAt: carbonData.calculatedAt,
			};
		}

		const updatedUsage = await Usage.findOneAndUpdate(
			{
				_id: id,
				deletedAt: null,
				householdId: household._id,
			},
			{ $set: updateData },
			{ new: true, runValidators: true }
		);

		if (!updatedUsage) {
			return res.status(404).json({
				success: false,
				message: "Usage record not found",
			});
		}
		const responseData = {
			_id: updatedUsage._id,
			householdId: updatedUsage.householdId,
			activityType: updatedUsage.activityType,
			liters: updatedUsage.liters,
			durationMinutes: updatedUsage.durationMinutes,
			flowRateLpm: updatedUsage.flowRateLpm,
			count: updatedUsage.count,
			litersPerUnit: updatedUsage.litersPerUnit,
			carbonFootprint: updatedUsage.carbonFootprint
				? {
						carbonKg: updatedUsage.carbonFootprint.carbonKg,
						energyKwh: updatedUsage.carbonFootprint.energyKwh,
						breakdown: {
							treatment: updatedUsage.carbonFootprint.breakdown?.treatment ?? 0,
							heating: updatedUsage.carbonFootprint.breakdown?.heating ?? 0,
						},
						equivalents: {
							carKm: updatedUsage.carbonFootprint.equivalents?.carKm ?? 0,
							trees: updatedUsage.carbonFootprint.equivalents?.trees ?? 0,
							smartphones: updatedUsage.carbonFootprint.equivalents?.smartphones ?? 0,
							meals: updatedUsage.carbonFootprint.equivalents?.meals ?? 0,
						},
				  }
				: null,
			occurredAt: updatedUsage.occurredAt,
			createdAt: updatedUsage.createdAt,
			updatedAt: updatedUsage.updatedAt,
		};

		return res.status(200).json({
			success: true,
			message: "Usage updated successfully",
			data: responseData,
		});
	} catch (error) {
		console.error("Error updating usage:", error);
		return res.status(500).json({
			success: false,
			message: "Error updating usage",
			error: error.message,
		});
	}
};

/**
 * Delete a usage record (soft delete)
 * @route DELETE /api/usage/:id
 */
exports.deleteUsage = async (req, res) => {
	try {
		const { id } = req.params;
		const userId = req.user.id;

		// 🏠 Find user's household
		const household = await Household.findOne({ userId });
		if (!household) {
			return res.status(404).json({
				success: false,
				message: "No household found for this user.",
			});
		}

		// Find existing usage record (only from user's household)
		const usage = await Usage.findOne({ 
			_id: id, 
			deletedAt: null,
			householdId: household._id  // ✅ Security: only user's household
		});

		if (!usage) {
			return res.status(404).json({
				success: false,
				message: "Usage record not found",
			});
		}

		// Soft delete by setting deletedAt timestamp
		usage.deletedAt = new Date();
		await usage.save();

		return res.status(200).json({
			success: true,
			message: "Usage deleted successfully",
		});
	} catch (error) {
		console.error("Error deleting usage:", error);
		return res.status(500).json({
			success: false,
			message: "Error deleting usage",
			error: error.message,
		});
	}
};

// ========================================
// 🌍 CARBON FOOTPRINT ENDPOINTS
// ========================================

/**
 * Get carbon footprint statistics for a household
 * @route GET /usage/carbon-stats
 * @query householdId - Household ID (required)
 * @query startDate - Start date (optional, defaults to 30 days ago)
 * @query endDate - End date (optional, defaults to now)
 */
exports.getCarbonStats = async (req, res) => {
	try {
		const userId = req.user.id;

		// 🏠 Find user's household
		const household = await Household.findOne({ userId });
		if (!household) {
			return res.status(404).json({
				success: false,
				message: "No household found for this user.",
			});
		}

		const { startDate, endDate } = req.query;

		// Default date range: last 30 days
		const end = endDate ? new Date(endDate) : new Date();
		const start = startDate
			? new Date(startDate)
			: new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);

		// Fetch usage records
		const usages = await Usage.find({
			householdId: household._id,
			occurredAt: { $gte: start, $lte: end },
			deletedAt: null,
		}).sort({ occurredAt: -1 });

		// Aggregate carbon footprint
		const stats = aggregateCarbonFootprint(usages);

		// Get previous period for comparison
		const prevStart = new Date(start.getTime() - (end.getTime() - start.getTime()));
		const prevUsages = await Usage.find({
			householdId: household._id,
			occurredAt: { $gte: prevStart, $lt: start },
			deletedAt: null,
		});
		const prevStats = aggregateCarbonFootprint(prevUsages);

		// Calculate change
		const carbonChange =
			prevStats.totalCarbonKg > 0
				? (((stats.totalCarbonKg - prevStats.totalCarbonKg) / prevStats.totalCarbonKg) * 100).toFixed(1)
				: 0;

		return res.status(200).json({
			success: true,
			data: {
				period: {
					startDate: start,
					endDate: end,
					days: Math.ceil((end - start) / (1000 * 60 * 60 * 24)),
				},
				current: stats,
				previous: {
					totalCarbonKg: prevStats.totalCarbonKg,
					totalEnergyKwh: prevStats.totalEnergyKwh,
				},
				comparison: {
					carbonChange: parseFloat(carbonChange),
					trend: carbonChange < 0 ? "decreasing" : carbonChange > 0 ? "increasing" : "stable",
					message:
						carbonChange < 0
							? `🎉 Great! Your carbon emissions decreased by ${Math.abs(carbonChange)}%`
							: carbonChange > 0
							? `⚠️ Your carbon emissions increased by ${carbonChange}%`
							: "Your carbon emissions are stable",
				},
				recordCount: usages.length,
			},
		});
	} catch (error) {
		console.error("Error fetching carbon stats:", error);
		return res.status(500).json({
			success: false,
			message: "Error fetching carbon statistics",
			error: error.message,
		});
	}
};

/**
 * Get carbon footprint breakdown by activity type
 * @route GET /usage/carbon-by-activity
 * @query householdId - Household ID (required)
 * @query startDate - Start date (optional)
 * @query endDate - End date (optional)
 */
exports.getCarbonByActivity = async (req, res) => {
	try {
		const userId = req.user.id;

		// 🏠 Find user's household
		const household = await Household.findOne({ userId });
		if (!household) {
			return res.status(404).json({
				success: false,
				message: "No household found for this user.",
			});
		}

		const { startDate, endDate } = req.query;

		const end = endDate ? new Date(endDate) : new Date();
		const start = startDate
			? new Date(startDate)
			: new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);

		// Aggregate by activity type
		const breakdown = await Usage.aggregate([
			{
				$match: {
					householdId: household._id,
					occurredAt: { $gte: start, $lte: end },
					deletedAt: null,
				},
			},
			{
				$group: {
					_id: "$activityType",
					totalLiters: { $sum: "$liters" },
					totalCarbonKg: { $sum: "$carbonFootprint.carbonKg" },
					totalEnergyKwh: { $sum: "$carbonFootprint.energyKwh" },
					count: { $sum: 1 },
					avgLitersPerUse: { $avg: "$liters" },
					avgCarbonPerUse: { $avg: "$carbonFootprint.carbonKg" },
				},
			},
			{
				$sort: { totalCarbonKg: -1 },
			},
		]);

		// Calculate totals
		const totalCarbonKg = breakdown.reduce((sum, item) => sum + item.totalCarbonKg, 0);

		// Add percentage to each activity
		const breakdownWithPercentage = breakdown.map((item) => ({
			activityType: item._id,
			totalLiters: Math.round(item.totalLiters),
			totalCarbonKg: parseFloat(item.totalCarbonKg.toFixed(3)),
			totalEnergyKwh: parseFloat(item.totalEnergyKwh.toFixed(2)),
			count: item.count,
			avgLitersPerUse: parseFloat(item.avgLitersPerUse.toFixed(1)),
			avgCarbonPerUse: parseFloat(item.avgCarbonPerUse.toFixed(3)),
			percentageOfTotal: parseFloat(((item.totalCarbonKg / totalCarbonKg) * 100).toFixed(1)),
		}));

		return res.status(200).json({
			success: true,
			data: {
				period: { startDate: start, endDate: end },
				totalCarbonKg: parseFloat(totalCarbonKg.toFixed(3)),
				breakdown: breakdownWithPercentage,
				topEmitter: breakdownWithPercentage[0] || null,
			},
		});
	} catch (error) {
		console.error("Error fetching carbon breakdown:", error);
		return res.status(500).json({
			success: false,
			message: "Error fetching carbon breakdown",
			error: error.message,
		});
	}
};

/**
 * Get carbon footprint leaderboard (compare households)
 * @route GET /usage/carbon-leaderboard
 * @query startDate - Start date (optional)
 * @query endDate - End date (optional)
 * @query limit - Number of results (default: 10)
 */
exports.getCarbonLeaderboard = async (req, res) => {
	try {
		const { startDate, endDate, limit = 10 } = req.query;

		const end = endDate ? new Date(endDate) : new Date();
		const start = startDate
			? new Date(startDate)
			: new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);

		// Aggregate by household
		const leaderboard = await Usage.aggregate([
			{
				$match: {
					occurredAt: { $gte: start, $lte: end },
					deletedAt: null,
				},
			},
			{
				$group: {
					_id: "$householdId",
					totalLiters: { $sum: "$liters" },
					totalCarbonKg: { $sum: "$carbonFootprint.carbonKg" },
					totalEnergyKwh: { $sum: "$carbonFootprint.energyKwh" },
					usageCount: { $sum: 1 },
				},
			},
			{
				$sort: { totalCarbonKg: 1 }, // Lowest carbon first (best)
			},
			{
				$limit: parseInt(limit),
			},
			{
				$lookup: {
					from: "households",
					localField: "_id",
					foreignField: "_id",
					as: "household",
				},
			},
			{
				$unwind: "$household",
			},
			{
				$project: {
					householdId: "$_id",
					householdName: "$household.name",
					totalLiters: 1,
					totalCarbonKg: 1,
					totalEnergyKwh: 1,
					usageCount: 1,
					residents: "$household.numberOfResidents",
					carbonPerResident: {
						$divide: ["$totalCarbonKg", "$household.numberOfResidents"],
					},
				},
			},
		]);

		// Add rank
		const leaderboardWithRank = leaderboard.map((item, index) => ({
			rank: index + 1,
			householdId: item.householdId,
			householdName: item.householdName,
			totalCarbonKg: parseFloat(item.totalCarbonKg.toFixed(3)),
			totalLiters: Math.round(item.totalLiters),
			residents: item.residents,
			carbonPerResident: parseFloat(item.carbonPerResident.toFixed(3)),
			badge:
				index === 0
					? "🥇 Top Eco-Warrior"
					: index === 1
					? "🥈 Green Champion"
					: index === 2
					? "🥉 Sustainability Star"
					: "🌱",
		}));

		return res.status(200).json({
			success: true,
			data: {
				period: { startDate: start, endDate: end },
				leaderboard: leaderboardWithRank,
			},
		});
	} catch (error) {
		console.error("Error fetching carbon leaderboard:", error);
		return res.status(500).json({
			success: false,
			message: "Error fetching carbon leaderboard",
			error: error.message,
		});
	}
};

/**
 * Get daily carbon footprint trend
 * @route GET /usage/carbon-trend
 * @query householdId - Household ID (required)
 * @query days - Number of days to fetch (default: 30)
 */
exports.getCarbonTrend = async (req, res) => {
	try {
		const userId = req.user.id;

		// 🏠 Find user's household
		const household = await Household.findOne({ userId });
		if (!household) {
			return res.status(404).json({
				success: false,
				message: "No household found for this user.",
			});
		}

		const { days = 30 } = req.query;

		const end = new Date();
		const start = new Date(end.getTime() - parseInt(days) * 24 * 60 * 60 * 1000);

		// Aggregate by day
		const trend = await Usage.aggregate([
			{
				$match: {
					householdId: household._id,
					occurredAt: { $gte: start, $lte: end },
					deletedAt: null,
				},
			},
			{
				$group: {
					_id: {
						year: { $year: "$occurredAt" },
						month: { $month: "$occurredAt" },
						day: { $dayOfMonth: "$occurredAt" },
					},
					date: { $first: "$occurredAt" },
					totalLiters: { $sum: "$liters" },
					totalCarbonKg: { $sum: "$carbonFootprint.carbonKg" },
					totalEnergyKwh: { $sum: "$carbonFootprint.energyKwh" },
					usageCount: { $sum: 1 },
				},
			},
			{
				$sort: { date: 1 },
			},
			{
				$project: {
					_id: 0,
					date: {
						$dateToString: { format: "%Y-%m-%d", date: "$date" },
					},
					totalLiters: { $round: ["$totalLiters", 0] },
					totalCarbonKg: { $round: ["$totalCarbonKg", 3] },
					totalEnergyKwh: { $round: ["$totalEnergyKwh", 2] },
					usageCount: 1,
				},
			},
		]);

		return res.status(200).json({
			success: true,
			data: {
				period: { startDate: start, endDate: end, days: parseInt(days) },
				trend,
				averageDailyCarbonKg:
					trend.length > 0
						? parseFloat(
								(trend.reduce((sum, day) => sum + day.totalCarbonKg, 0) / trend.length).toFixed(3)
						  )
						: 0,
			},
		});
	} catch (error) {
		console.error("Error fetching carbon trend:", error);
		return res.status(500).json({
			success: false,
			message: "Error fetching carbon trend",
			error: error.message,
		});
	}
};

/**
 * Get daily water usage for the user's household
 * @route GET /usage/daily-water-usage
 * @query days - Number of days to average (default: 30)
 */
exports.getDailyWaterUsage = async (req, res) => {
	try {
		const userId = req.user.id;

		// 🏠 Find user's household
		const household = await Household.findOne({ userId });
		if (!household) {
			return res.status(404).json({
				success: false,
				message: "No household found for this user.",
			});
		}

		const { days = 30 } = req.query;

		const end = new Date();
		const start = new Date(end.getTime() - parseInt(days) * 24 * 60 * 60 * 1000);

		// Aggregate total liters over the period
		const result = await Usage.aggregate([
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

		let averageDailyUsage = 0;
		let totalLiters = 0;
		let daysWithUsage = 0;

		if (result.length > 0) {
			totalLiters = result[0].totalLiters || 0;
			daysWithUsage = result[0].daysWithUsage || 0;
			averageDailyUsage = daysWithUsage > 0 ? totalLiters / daysWithUsage : 0;
		}

		return res.status(200).json({
			success: true,
			data: {
				householdId: household._id,
				period: { startDate: start, endDate: end, days: parseInt(days) },
				totalLiters: Math.round(totalLiters),
				daysWithUsage,
				averageDailyUsage: Math.round(averageDailyUsage),
			},
		});
	} catch (error) {
		console.error("Error fetching daily water usage:", error);
		return res.status(500).json({
			success: false,
			message: "Error fetching daily water usage",
			error: error.message,
		});
	}
};

function getAdminDateRange(query = {}) {
	const { startDate, endDate, days = 30 } = query;
	const end = endDate ? new Date(endDate) : new Date();
	if (Number.isNaN(end.getTime())) {
		return null;
	}

	let start;
	if (startDate) {
		start = new Date(startDate);
		if (Number.isNaN(start.getTime())) {
			return null;
		}
	} else {
		const parsedDays = Math.max(1, parseInt(days, 10) || 30);
		start = new Date(end.getTime() - parsedDays * 24 * 60 * 60 * 1000);
	}

	if (start > end) {
		return null;
	}

	return { start, end };
}

/**
 * Admin: Get platform-wide water usage overview
 * @route GET /usage/admin/overview
 */
exports.getAdminUsageOverview = async (req, res) => {
	try {
		const range = getAdminDateRange(req.query);
		if (!range) {
			return res.status(400).json({
				success: false,
				message: "Invalid date range. Use valid startDate/endDate or days.",
			});
		}

		const { start, end } = range;

		const [overall] = await Usage.aggregate([
			{
				$match: {
					deletedAt: null,
					occurredAt: { $gte: start, $lte: end },
				},
			},
			{
				$group: {
					_id: null,
					totalLiters: { $sum: "$liters" },
					totalCarbonKg: { $sum: "$carbonFootprint.carbonKg" },
					totalEnergyKwh: { $sum: "$carbonFootprint.energyKwh" },
					usageCount: { $sum: 1 },
					activeHouseholds: { $addToSet: "$householdId" },
				},
			},
			{
				$project: {
					_id: 0,
					totalLiters: 1,
					totalCarbonKg: 1,
					totalEnergyKwh: 1,
					usageCount: 1,
					activeHouseholds: { $size: "$activeHouseholds" },
				},
			},
		]);

		const topActivities = await Usage.aggregate([
			{
				$match: {
					deletedAt: null,
					occurredAt: { $gte: start, $lte: end },
				},
			},
			{
				$group: {
					_id: "$activityType",
					totalLiters: { $sum: "$liters" },
					totalCarbonKg: { $sum: "$carbonFootprint.carbonKg" },
					usageCount: { $sum: 1 },
				},
			},
			{ $sort: { totalLiters: -1 } },
			{ $limit: 6 },
			{
				$project: {
					_id: 0,
					activityType: "$_id",
					totalLiters: { $round: ["$totalLiters", 0] },
					totalCarbonKg: { $round: ["$totalCarbonKg", 3] },
					usageCount: 1,
				},
			},
		]);

		const trend = await Usage.aggregate([
			{
				$match: {
					deletedAt: null,
					occurredAt: { $gte: start, $lte: end },
				},
			},
			{
				$group: {
					_id: {
						year: { $year: "$occurredAt" },
						month: { $month: "$occurredAt" },
						day: { $dayOfMonth: "$occurredAt" },
					},
					date: { $first: "$occurredAt" },
					totalLiters: { $sum: "$liters" },
					totalCarbonKg: { $sum: "$carbonFootprint.carbonKg" },
					usageCount: { $sum: 1 },
				},
			},
			{ $sort: { date: 1 } },
			{
				$project: {
					_id: 0,
					date: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
					totalLiters: { $round: ["$totalLiters", 0] },
					totalCarbonKg: { $round: ["$totalCarbonKg", 3] },
					usageCount: 1,
				},
			},
		]);

		const totals = overall || {
			totalLiters: 0,
			totalCarbonKg: 0,
			totalEnergyKwh: 0,
			usageCount: 0,
			activeHouseholds: 0,
		};

		return res.status(200).json({
			success: true,
			data: {
				period: {
					startDate: start,
					endDate: end,
					days: Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24))),
				},
				totals: {
					totalLiters: Math.round(totals.totalLiters || 0),
					totalCarbonKg: parseFloat((totals.totalCarbonKg || 0).toFixed(3)),
					totalEnergyKwh: parseFloat((totals.totalEnergyKwh || 0).toFixed(2)),
					usageCount: totals.usageCount || 0,
					activeHouseholds: totals.activeHouseholds || 0,
					avgLitersPerRecord:
						totals.usageCount > 0
							? Math.round((totals.totalLiters || 0) / totals.usageCount)
							: 0,
				},
				topActivities,
				trend,
			},
		});
	} catch (error) {
		console.error("Error fetching admin usage overview:", error);
		return res.status(500).json({
			success: false,
			message: "Error fetching admin usage overview",
			error: error.message,
		});
	}
};

/**
 * Admin: Get usage analytics grouped by household (paginated)
 * @route GET /usage/admin/households
 */
exports.getAdminUsageByHouseholds = async (req, res) => {
	try {
		const range = getAdminDateRange(req.query);
		if (!range) {
			return res.status(400).json({
				success: false,
				message: "Invalid date range. Use valid startDate/endDate or days.",
			});
		}

		const { start, end } = range;
		const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
		const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 100);
		const skip = (page - 1) * limit;
		const search = String(req.query.search || "").trim();

		const sortParam = String(req.query.sort || "-totalLiters");
		const sortOrder = sortParam.startsWith("-") ? -1 : 1;
		const sortField = sortParam.replace(/^-/, "");
		const allowedSortFields = [
			"totalLiters",
			"totalCarbonKg",
			"usageCount",
			"latestUsageAt",
			"householdName",
			"avgLitersPerRecord",
		];
		const normalizedSortField = allowedSortFields.includes(sortField)
			? sortField
			: "totalLiters";
		const sortStage = { [normalizedSortField]: sortOrder, householdName: 1 };

		const pipeline = [
			{
				$match: {
					deletedAt: null,
					occurredAt: { $gte: start, $lte: end },
				},
			},
			{
				$group: {
					_id: "$householdId",
					totalLiters: { $sum: "$liters" },
					totalCarbonKg: { $sum: "$carbonFootprint.carbonKg" },
					totalEnergyKwh: { $sum: "$carbonFootprint.energyKwh" },
					usageCount: { $sum: 1 },
					latestUsageAt: { $max: "$occurredAt" },
				},
			},
			{
				$lookup: {
					from: "households",
					localField: "_id",
					foreignField: "_id",
					as: "household",
				},
			},
			{ $unwind: "$household" },
			{
				$project: {
					_id: 0,
					householdId: "$_id",
					householdName: "$household.name",
					city: "$household.location.city",
					residents: "$household.numberOfResidents",
					totalLiters: { $round: ["$totalLiters", 0] },
					totalCarbonKg: { $round: ["$totalCarbonKg", 3] },
					totalEnergyKwh: { $round: ["$totalEnergyKwh", 2] },
					usageCount: 1,
					latestUsageAt: 1,
					avgLitersPerRecord: {
						$round: [{ $divide: ["$totalLiters", "$usageCount"] }, 1],
					},
					litersPerResident: {
						$round: [
							{
								$cond: [
									{ $gt: ["$household.numberOfResidents", 0] },
									{ $divide: ["$totalLiters", "$household.numberOfResidents"] },
									0,
								],
							},
							1,
						],
					},
				},
			},
		];

		if (search) {
			pipeline.push({
				$match: {
					$or: [
						{ householdName: { $regex: search, $options: "i" } },
						{ city: { $regex: search, $options: "i" } },
					],
				},
			});
		}

		pipeline.push(
			{ $sort: sortStage },
			{
				$facet: {
					rows: [{ $skip: skip }, { $limit: limit }],
					meta: [{ $count: "total" }],
				},
			}
		);

		const [result] = await Usage.aggregate(pipeline);
		const rows = result?.rows || [];
		const total = result?.meta?.[0]?.total || 0;

		return res.status(200).json({
			success: true,
			data: {
				period: {
					startDate: start,
					endDate: end,
				},
				page,
				limit,
				total,
				totalPages: Math.ceil(total / limit),
				rows,
			},
		});
	} catch (error) {
		console.error("Error fetching admin household usage analytics:", error);
		return res.status(500).json({
			success: false,
			message: "Error fetching admin household usage analytics",
			error: error.message,
		});
	}
};

/**
 * Admin: Get detailed usage records for one household
 * @route GET /usage/admin/households/:householdId
 */
exports.getAdminHouseholdUsageDetails = async (req, res) => {
	try {
		const { householdId } = req.params;
		if (!mongoose.Types.ObjectId.isValid(householdId)) {
			return res.status(400).json({
				success: false,
				message: "Invalid householdId format",
			});
		}

		const range = getAdminDateRange(req.query);
		if (!range) {
			return res.status(400).json({
				success: false,
				message: "Invalid date range. Use valid startDate/endDate or days.",
			});
		}

		const { start, end } = range;
		const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
		const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);
		const skip = (page - 1) * limit;
		const sort = getSortParams(req.query.sort || "-occurredAt");

		const household = await Household.findById(householdId)
			.select("name numberOfResidents location")
			.lean();

		if (!household) {
			return res.status(404).json({
				success: false,
				message: "Household not found",
			});
		}

		const filter = {
			householdId,
			deletedAt: null,
			occurredAt: { $gte: start, $lte: end },
		};

		if (req.query.activityType) {
			filter.activityType = req.query.activityType;
		}

		const [records, total, summaryAgg] = await Promise.all([
			Usage.find(filter).sort(sort).skip(skip).limit(limit).lean(),
			Usage.countDocuments(filter),
			Usage.aggregate([
				{ $match: filter },
				{
					$group: {
						_id: null,
						totalLiters: { $sum: "$liters" },
						totalCarbonKg: { $sum: "$carbonFootprint.carbonKg" },
						totalEnergyKwh: { $sum: "$carbonFootprint.energyKwh" },
						usageCount: { $sum: 1 },
					},
				},
			]),
		]);

		const summary = summaryAgg[0] || {
			totalLiters: 0,
			totalCarbonKg: 0,
			totalEnergyKwh: 0,
			usageCount: 0,
		};

		return res.status(200).json({
			success: true,
			data: {
				household: {
					householdId,
					name: household.name,
					residents: household.numberOfResidents,
					city: household.location?.city || "",
				},
				period: {
					startDate: start,
					endDate: end,
				},
				summary: {
					totalLiters: Math.round(summary.totalLiters || 0),
					totalCarbonKg: parseFloat((summary.totalCarbonKg || 0).toFixed(3)),
					totalEnergyKwh: parseFloat((summary.totalEnergyKwh || 0).toFixed(2)),
					usageCount: summary.usageCount || 0,
				},
				page,
				limit,
				total,
				totalPages: Math.ceil(total / limit),
				records,
			},
		});
	} catch (error) {
		console.error("Error fetching admin household usage details:", error);
		return res.status(500).json({
			success: false,
			message: "Error fetching admin household usage details",
			error: error.message,
		});
	}
};

/**
 * Admin: Detect anomalous usage patterns that may indicate leaks/spikes
 * @route GET /usage/admin/anomalies
 */
exports.getAdminUsageAnomalies = async (req, res) => {
	try {
		const range = getAdminDateRange(req.query);
		if (!range) {
			return res.status(400).json({
				success: false,
				message: "Invalid date range. Use valid startDate/endDate or days.",
			});
		}

		const { start, end } = range;
		const days = Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)));

		const [globalStats] = await Usage.aggregate([
			{
				$match: {
					deletedAt: null,
					occurredAt: { $gte: start, $lte: end },
				},
			},
			{
				$group: {
					_id: null,
					avgLitersPerRecord: { $avg: "$liters" },
					totalRecords: { $sum: 1 },
				},
			},
		]);

		const avgLitersPerRecord = globalStats?.avgLitersPerRecord || 0;
		const spikeThreshold = avgLitersPerRecord > 0 ? avgLitersPerRecord * 3 : 600;

		const suspiciousHouseholds = await Usage.aggregate([
			{
				$match: {
					deletedAt: null,
					occurredAt: { $gte: start, $lte: end },
				},
			},
			{
				$group: {
					_id: "$householdId",
					totalLiters: { $sum: "$liters" },
					usageCount: { $sum: 1 },
					maxSingleRecordLiters: { $max: "$liters" },
					latestUsageAt: { $max: "$occurredAt" },
				},
			},
			{
				$lookup: {
					from: "households",
					localField: "_id",
					foreignField: "_id",
					as: "household",
				},
			},
			{ $unwind: "$household" },
			{
				$project: {
					_id: 0,
					householdId: "$_id",
					householdName: "$household.name",
					city: "$household.location.city",
					residents: "$household.numberOfResidents",
					totalLiters: { $round: ["$totalLiters", 0] },
					usageCount: 1,
					maxSingleRecordLiters: { $round: ["$maxSingleRecordLiters", 0] },
					avgLitersPerRecord: {
						$round: [{ $divide: ["$totalLiters", "$usageCount"] }, 1],
					},
					litersPerResident: {
						$round: [
							{
								$cond: [
									{ $gt: ["$household.numberOfResidents", 0] },
									{ $divide: ["$totalLiters", "$household.numberOfResidents"] },
									0,
								],
							},
							1,
						],
					},
					latestUsageAt: 1,
				},
			},
			{
				$addFields: {
					isAnomaly: {
						$or: [
							{ $gte: ["$avgLitersPerRecord", avgLitersPerRecord * 1.8] },
							{ $gte: ["$maxSingleRecordLiters", spikeThreshold] },
							{ $gte: ["$litersPerResident", days * 300] },
						],
					},
				},
			},
			{ $match: { isAnomaly: true } },
			{ $sort: { maxSingleRecordLiters: -1, avgLitersPerRecord: -1 } },
			{ $limit: 12 },
		]);

		const spikeRecords = await Usage.aggregate([
			{
				$match: {
					deletedAt: null,
					occurredAt: { $gte: start, $lte: end },
					liters: { $gte: spikeThreshold },
				},
			},
			{ $sort: { liters: -1, occurredAt: -1 } },
			{ $limit: 15 },
			{
				$lookup: {
					from: "households",
					localField: "householdId",
					foreignField: "_id",
					as: "household",
				},
			},
			{ $unwind: { path: "$household", preserveNullAndEmptyArrays: true } },
			{
				$project: {
					_id: 0,
					usageId: "$_id",
					householdId: "$householdId",
					householdName: "$household.name",
					activityType: 1,
					liters: { $round: ["$liters", 0] },
					occurredAt: 1,
					carbonKg: { $round: ["$carbonFootprint.carbonKg", 3] },
				},
			},
		]);

		return res.status(200).json({
			success: true,
			data: {
				period: {
					startDate: start,
					endDate: end,
					days,
				},
				thresholds: {
					avgLitersPerRecord: parseFloat(avgLitersPerRecord.toFixed(2)),
					spikeLitersThreshold: Math.round(spikeThreshold),
				},
				summary: {
					suspiciousHouseholdCount: suspiciousHouseholds.length,
					spikeRecordCount: spikeRecords.length,
				},
				suspiciousHouseholds,
				spikeRecords,
			},
		});
	} catch (error) {
		console.error("Error detecting usage anomalies:", error);
		return res.status(500).json({
			success: false,
			message: "Error detecting usage anomalies",
			error: error.message,
		});
	}
};
