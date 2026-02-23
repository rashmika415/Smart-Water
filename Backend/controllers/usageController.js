
const Usage = require("../models/UsageModel");
const Household = require("../models/householdModel");

/**
 * Create a new usage record
 * @route POST /api/usage
 */
exports.createUsage = async (req, res) => {
	try {
		// Get userId from authenticated user (from JWT token)
		const userId = req.user.id;
		
		// Find the household that belongs to this user
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
			householdId: household._id, // from user's household
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
		// Get the household for the authenticated user
		const userId = req.user.id;
		const household = await Household.findOne({ userId });
		
		if (!household) {
			return res.status(404).json({
				success: false,
				message: "No household found for this user.",
			});
		}
		
		const { activityType } = req.query;
		
		const filter = { 
			deletedAt: null,
			householdId: household._id // Only return current user's household records
		};

		if (activityType) filter.activityType = activityType;

		const usages = await Usage.find(filter)
			.populate("householdId", "name location numberOfResidents")
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
		const userId = req.user.id;
		
		// Get the household for the authenticated user
		const household = await Household.findOne({ userId });
		
		if (!household) {
			return res.status(404).json({
				success: false,
				message: "No household found for this user.",
			});
		}

		// Only allow user to get their household's usage records
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
		
		// Get the household for the authenticated user
		const household = await Household.findOne({ userId });
		
		if (!household) {
			return res.status(404).json({
				success: false,
				message: "No household found for this user.",
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

		// Find existing usage record - only allow user to update their household's records
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
		const userId = req.user.id;
		
		// Get the household for the authenticated user
		const household = await Household.findOne({ userId });
		
		if (!household) {
			return res.status(404).json({
				success: false,
				message: "No household found for this user.",
			});
		}

		// Find existing usage record - only allow user to delete their household's records
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
