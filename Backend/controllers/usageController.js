
const Usage = require("../models/UsageModel");

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
