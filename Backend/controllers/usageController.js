const Usage = require("../models/UsageModel");
const Household = require("../models/householdModel");
const {
	getUserHousehold,
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
		const userId = req.user.id;
		const household = await getUserHousehold(userId);
		
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

		const usage = new Usage({
			householdId: household._id,
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
 * Get all usage records with pagination, filtering, and sorting
 * @route GET /api/usage
 * @query page - Page number (default: 1)
 * @query limit - Records per page (default: 20, max: 100)
 * @query activityType - Filter by activity type
 * @query startDate - Filter from this date (ISO format)
 * @query endDate - Filter to this date (ISO format)
 * @query source - Filter by source (manual, preset, imported)
 * @query sort - Sort field (prefix with - for descending, e.g., -occurredAt)
 */
exports.getAllUsages = async (req, res) => {
	try {
		const userId = req.user.id;
		const household = await getUserHousehold(userId);
		
		if (!household) {
			return res.status(404).json({
				success: false,
				message: "No household found for this user.",
			});
		}
		
		// Build filter
		const filter = buildUsageFilter(req.query, household._id);
		
		// Get pagination params
		const { page, limit, skip } = getPaginationParams(req.query);
		
		// Get sort params
		const sort = getSortParams(req.query.sort);

		// Execute query with pagination
		const [usages, totalCount] = await Promise.all([
			Usage.find(filter)
				.populate("householdId", "name location numberOfResidents")
				.sort(sort)
				.skip(skip)
				.limit(limit)
				.lean(),
			Usage.countDocuments(filter),
		]);

		const totalPages = Math.ceil(totalCount / limit);

		return res.status(200).json({
			success: true,
			data: usages,
			pagination: {
				currentPage: page,
				totalPages,
				totalRecords: totalCount,
				recordsPerPage: limit,
				hasNextPage: page < totalPages,
				hasPreviousPage: page > 1,
			},
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
		
		const household = await getUserHousehold(userId);
		
		if (!household) {
			return res.status(404).json({
				success: false,
				message: "No household found for this user.",
			});
		}

		const usage = await Usage.findOne({ 
			_id: id, 
			householdId: household._id,
			deletedAt: null 
		}).populate("householdId", "name location numberOfResidents");

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
		const userId = req.user.id;
		
		const household = await getUserHousehold(userId);
		
		if (!household) {
			return res.status(404).json({
				success: false,
				message: "No household found for this user.",
			});
		}

		// Find existing usage record
		const usage = await Usage.findOne({ 
			_id: id, 
			householdId: household._id,
			deletedAt: null 
		});

		if (!usage) {
			return res.status(404).json({
				success: false,
				message: "Usage record not found",
			});
		}

		// Get update fields
		const allowedUpdates = [
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

		// Apply updates
		allowedUpdates.forEach((field) => {
			if (req.body[field] !== undefined) {
				if (field === "occurredAt") {
					usage[field] = new Date(req.body[field]);
				} else {
					usage[field] = req.body[field];
				}
			}
		});

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
		const userId = req.user.id;
		
		const household = await getUserHousehold(userId);
		
		if (!household) {
			return res.status(404).json({
				success: false,
				message: "No household found for this user.",
			});
		}

		const usage = await Usage.findOne({ 
			_id: id, 
			householdId: household._id,
			deletedAt: null 
		});

		if (!usage) {
			return res.status(404).json({
				success: false,
				message: "Usage record not found",
			});
		}

		// Soft delete
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

/**
 * Bulk create usage records
 * @route POST /api/usage/bulk
 */
exports.bulkCreateUsage = async (req, res) => {
	try {
		const userId = req.user.id;
		const household = await getUserHousehold(userId);
		
		if (!household) {
			return res.status(404).json({
				success: false,
				message: "No household found for this user.",
			});
		}

		const { usages } = req.body;

		// Prepare usage records
		const usageRecords = usages.map((usage) => ({
			householdId: household._id,
			activityType: usage.activityType,
			occurredAt: usage.occurredAt ? new Date(usage.occurredAt) : undefined,
			durationMinutes: usage.durationMinutes,
			count: usage.count,
			flowRateLpm: usage.flowRateLpm,
			litersPerUnit: usage.litersPerUnit,
			liters: usage.liters,
			presetId: usage.presetId,
			source: usage.source || "manual",
			notes: usage.notes || "",
		}));

		// Insert all records
		const createdUsages = await Usage.insertMany(usageRecords, { ordered: false });

		return res.status(201).json({
			success: true,
			message: `${createdUsages.length} usage records created successfully`,
			data: createdUsages,
		});
	} catch (error) {
		console.error("Error bulk creating usages:", error);
		return res.status(500).json({
			success: false,
			message: "Error bulk creating usages",
			error: error.message,
		});
	}
};

/**
 * Bulk delete usage records (soft delete)
 * @route POST /api/usage/bulk-delete
 */
exports.bulkDeleteUsage = async (req, res) => {
	try {
		const userId = req.user.id;
		const household = await getUserHousehold(userId);
		
		if (!household) {
			return res.status(404).json({
				success: false,
				message: "No household found for this user.",
			});
		}

		const { ids } = req.body;

		if (!Array.isArray(ids) || ids.length === 0) {
			return res.status(400).json({
				success: false,
				message: "ids must be a non-empty array",
			});
		}

		if (ids.length > 100) {
			return res.status(400).json({
				success: false,
				message: "Cannot delete more than 100 records at once",
			});
		}

		// Validate all IDs
		const mongoose = require("mongoose");
		const invalidIds = ids.filter((id) => !mongoose.Types.ObjectId.isValid(id));
		
		if (invalidIds.length > 0) {
			return res.status(400).json({
				success: false,
				message: "Invalid ID format in the list",
			});
		}

		// Soft delete all matching records
		const result = await Usage.updateMany(
			{ 
				_id: { $in: ids },
				householdId: household._id,
				deletedAt: null 
			},
			{ 
				$set: { deletedAt: new Date() } 
			}
		);

		return res.status(200).json({
			success: true,
			message: `${result.modifiedCount} usage records deleted successfully`,
			deletedCount: result.modifiedCount,
		});
	} catch (error) {
		console.error("Error bulk deleting usages:", error);
		return res.status(500).json({
			success: false,
			message: "Error bulk deleting usages",
			error: error.message,
		});
	}
};

/**
 * Get usage statistics (daily, weekly, monthly totals)
 * @route GET /api/usage/stats
 * @query period - daily, weekly, monthly (default: monthly)
 * @query startDate - Start date for the period
 * @query endDate - End date for the period
 */
exports.getUsageStats = async (req, res) => {
	try {
		const userId = req.user.id;
		const household = await getUserHousehold(userId);
		
		if (!household) {
			return res.status(404).json({
				success: false,
				message: "No household found for this user.",
			});
		}

		const { period = "monthly", startDate, endDate } = req.query;

		// Build date filter
		const dateFilter = { householdId: household._id, deletedAt: null };
		
		if (startDate || endDate) {
			dateFilter.occurredAt = {};
			if (startDate) dateFilter.occurredAt.$gte = new Date(startDate);
			if (endDate) {
				const end = new Date(endDate);
				end.setHours(23, 59, 59, 999);
				dateFilter.occurredAt.$lte = end;
			}
		}

		// Determine grouping format based on period
		let dateFormat;
		switch (period) {
			case "daily":
				dateFormat = { $dateToString: { format: "%Y-%m-%d", date: "$occurredAt" } };
				break;
			case "weekly":
				dateFormat = { 
					$dateToString: { 
						format: "%Y-W%V", 
						date: "$occurredAt" 
					} 
				};
				break;
			case "monthly":
			default:
				dateFormat = { $dateToString: { format: "%Y-%m", date: "$occurredAt" } };
				break;
		}

		// Aggregate statistics
		const stats = await Usage.aggregate([
			{ $match: dateFilter },
			{
				$group: {
					_id: dateFormat,
					totalLiters: { $sum: "$liters" },
					recordCount: { $sum: 1 },
					activities: { $addToSet: "$activityType" },
				},
			},
			{ $sort: { _id: 1 } },
		]);

		// Get activity type breakdown
		const activityBreakdown = await Usage.aggregate([
			{ $match: dateFilter },
			{
				$group: {
					_id: "$activityType",
					totalLiters: { $sum: "$liters" },
					count: { $sum: 1 },
					avgLitersPerUse: { $avg: "$liters" },
				},
			},
			{ $sort: { totalLiters: -1 } },
		]);

		// Calculate overall totals
		const overall = await Usage.aggregate([
			{ $match: dateFilter },
			{
				$group: {
					_id: null,
					totalLiters: { $sum: "$liters" },
					totalRecords: { $sum: 1 },
					avgLitersPerRecord: { $avg: "$liters" },
				},
			},
		]);

		return res.status(200).json({
			success: true,
			data: {
				period,
				periodStats: stats,
				activityBreakdown,
				overall: overall[0] || { totalLiters: 0, totalRecords: 0, avgLitersPerRecord: 0 },
			},
		});
	} catch (error) {
		console.error("Error fetching usage stats:", error);
		return res.status(500).json({
			success: false,
			message: "Error fetching usage statistics",
			error: error.message,
		});
	}
};

/**
 * Restore a soft-deleted usage record
 * @route PATCH /api/usage/:id/restore
 */
exports.restoreUsage = async (req, res) => {
	try {
		const { id } = req.params;
		const userId = req.user.id;
		
		const household = await getUserHousehold(userId);
		
		if (!household) {
			return res.status(404).json({
				success: false,
				message: "No household found for this user.",
			});
		}

		// Find soft-deleted usage record
		const usage = await Usage.findOne({ 
			_id: id, 
			householdId: household._id,
			deletedAt: { $ne: null } 
		});

		if (!usage) {
			return res.status(404).json({
				success: false,
				message: "Deleted usage record not found",
			});
		}

		// Restore by clearing deletedAt
		usage.deletedAt = null;
		await usage.save();

		return res.status(200).json({
			success: true,
			message: "Usage record restored successfully",
			data: usage,
		});
	} catch (error) {
		console.error("Error restoring usage:", error);
		return res.status(500).json({
			success: false,
			message: "Error restoring usage",
			error: error.message,
		});
	}
};

/**
 * Export usage data to CSV format
 * @route GET /api/usage/export
 * @query format - csv or json (default: csv)
 * @query startDate - Start date filter
 * @query endDate - End date filter
 */
exports.exportUsageData = async (req, res) => {
	try {
		const userId = req.user.id;
		const household = await getUserHousehold(userId);
		
		if (!household) {
			return res.status(404).json({
				success: false,
				message: "No household found for this user.",
			});
		}

		const { format = "csv", startDate, endDate } = req.query;

		// Build filter
		const filter = buildUsageFilter({ startDate, endDate }, household._id);

		// Get all matching records
		const usages = await Usage.find(filter)
			.sort({ occurredAt: -1 })
			.lean();

		if (format === "json") {
			return res.status(200).json({
				success: true,
				data: usages,
				count: usages.length,
			});
		}

		// Generate CSV
		if (usages.length === 0) {
			return res.status(200).send("No data to export");
		}

		const csvHeaders = [
			"Activity Type",
			"Date/Time",
			"Liters",
			"Duration (min)",
			"Count",
			"Flow Rate (L/min)",
			"Liters Per Unit",
			"Source",
			"Notes"
		].join(",");

		const csvRows = usages.map((usage) => {
			return [
				usage.activityType,
				new Date(usage.occurredAt).toISOString(),
				usage.liters || 0,
				usage.durationMinutes || "",
				usage.count || "",
				usage.flowRateLpm || "",
				usage.litersPerUnit || "",
				usage.source,
				`"${(usage.notes || "").replace(/"/g, '""')}"`,
			].join(",");
		});

		const csv = [csvHeaders, ...csvRows].join("\n");

		res.setHeader("Content-Type", "text/csv");
		res.setHeader("Content-Disposition", `attachment; filename=usage-export-${Date.now()}.csv`);
		return res.status(200).send(csv);
	} catch (error) {
		console.error("Error exporting usage data:", error);
		return res.status(500).json({
			success: false,
			message: "Error exporting usage data",
			error: error.message,
		});
	}
};
