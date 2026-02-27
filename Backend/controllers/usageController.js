
const Usage = require("../models/UsageModel");
const mongoose = require("mongoose");
const { aggregateCarbonFootprint } = require("../services/carbonService");

/**
 * Create a new usage record
 * @route POST /api/usage
 */
exports.createUsage = async (req, res) => {
	try {
		const {
			userId,
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

		if (!userId || !activityType) {
			return res.status(400).json({
				success: false,
				message: "Missing required fields: userId, activityType",
			});
		}

		const usage = new Usage({
			userId,
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

		return res.status(201).json({
			success: true,
			message: "Usage created successfully",
			data: savedUsage,
			carbonImpact: savedUsage.carbonFootprint
				? {
						carbonKg: savedUsage.carbonFootprint.carbonKg,
						equivalents: savedUsage.carbonFootprint.equivalents,
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
 * @query userId - Optional filter by user ID
 * @query activityType - Optional filter by activity type
 */
exports.getAllUsages = async (req, res) => {
	try {
		const { userId, activityType } = req.query;
		const filter = { deletedAt: null };

		if (userId) filter.userId = userId;
		if (activityType) filter.activityType = activityType;

		const usages = await Usage.find(filter)
			.populate("userId", "name email")
			.sort({ occurredAt: -1 });

		return res.status(200).json({
			success: true,
			count: usages.length,
			data: usages,
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

		const usage = await Usage.findOne({ _id: id, deletedAt: null })
			.populate("userId", "name email");

		if (!usage) {
			return res.status(404).json({
				success: false,
				message: "Usage record not found",
			});
		}

		return res.status(200).json({
			success: true,
			data: usage,
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

		// Find existing usage record
		const usage = await Usage.findOne({ _id: id, deletedAt: null });

		if (!usage) {
			return res.status(404).json({
				success: false,
				message: "Usage record not found",
			});
		}

		// Update fields
		if (activityType) usage.activityType = activityType;
		if (occurredAt) usage.occurredAt = new Date(occurredAt);
		if (durationMinutes !== undefined) usage.durationMinutes = durationMinutes;
		if (count !== undefined) usage.count = count;
		if (flowRateLpm !== undefined) usage.flowRateLpm = flowRateLpm;
		if (litersPerUnit !== undefined) usage.litersPerUnit = litersPerUnit;
		if (liters !== undefined) usage.liters = liters;
		if (presetId !== undefined) usage.presetId = presetId;
		if (source) usage.source = source;
		if (notes !== undefined) usage.notes = notes;

		const updatedUsage = await usage.save();

		return res.status(200).json({
			success: true,
			message: "Usage updated successfully",
			data: updatedUsage,
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

		// Find existing usage record
		const usage = await Usage.findOne({ _id: id, deletedAt: null });

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
		const { householdId, startDate, endDate } = req.query;

		if (!householdId) {
			return res.status(400).json({
				success: false,
				message: "householdId is required",
			});
		}

		// Default date range: last 30 days
		const end = endDate ? new Date(endDate) : new Date();
		const start = startDate
			? new Date(startDate)
			: new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);

		// Fetch usage records
		const usages = await Usage.find({
			householdId: mongoose.Types.ObjectId(householdId),
			occurredAt: { $gte: start, $lte: end },
			deletedAt: null,
		}).sort({ occurredAt: -1 });

		// Aggregate carbon footprint
		const stats = aggregateCarbonFootprint(usages);

		// Get previous period for comparison
		const prevStart = new Date(start.getTime() - (end.getTime() - start.getTime()));
		const prevUsages = await Usage.find({
			householdId: mongoose.Types.ObjectId(householdId),
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
		const { householdId, startDate, endDate } = req.query;

		if (!householdId) {
			return res.status(400).json({
				success: false,
				message: "householdId is required",
			});
		}

		const end = endDate ? new Date(endDate) : new Date();
		const start = startDate
			? new Date(startDate)
			: new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);

		// Aggregate by activity type
		const breakdown = await Usage.aggregate([
			{
				$match: {
					householdId: mongoose.Types.ObjectId(householdId),
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
		const { householdId, days = 30 } = req.query;

		if (!householdId) {
			return res.status(400).json({
				success: false,
				message: "householdId is required",
			});
		}

		const end = new Date();
		const start = new Date(end.getTime() - parseInt(days) * 24 * 60 * 60 * 1000);

		// Aggregate by day
		const trend = await Usage.aggregate([
			{
				$match: {
					householdId: mongoose.Types.ObjectId(householdId),
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
