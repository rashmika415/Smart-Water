const mongoose = require("mongoose");

/**
 * Validate MongoDB ObjectId
 */
exports.validateObjectId = (paramName = "id") => {
	return (req, res, next) => {
		const id = req.params[paramName];
		
		if (!mongoose.Types.ObjectId.isValid(id)) {
			return res.status(400).json({
				success: false,
				message: `Invalid ${paramName} format`,
			});
		}
		
		next();
	};
};

/**
 * Validate usage input data
 */
exports.validateUsageInput = (req, res, next) => {
	const {
		activityType,
		durationMinutes,
		count,
		flowRateLpm,
		litersPerUnit,
		liters,
		occurredAt,
	} = req.body;

	// Required field
	if (!activityType || typeof activityType !== "string" || activityType.trim() === "") {
		return res.status(400).json({
			success: false,
			message: "activityType is required and must be a non-empty string",
		});
	}

	// Validate numeric fields
	const numericFields = {
		durationMinutes,
		count,
		flowRateLpm,
		litersPerUnit,
		liters,
	};

	for (const [field, value] of Object.entries(numericFields)) {
		if (value !== undefined && value !== null) {
			if (typeof value !== "number" || value < 0 || isNaN(value)) {
				return res.status(400).json({
					success: false,
					message: `${field} must be a non-negative number`,
				});
			}
		}
	}

	// Validate occurredAt date
	if (occurredAt !== undefined) {
		const date = new Date(occurredAt);
		if (isNaN(date.getTime())) {
			return res.status(400).json({
				success: false,
				message: "occurredAt must be a valid date",
			});
		}
		
		// Prevent future dates
		if (date > new Date()) {
			return res.status(400).json({
				success: false,
				message: "occurredAt cannot be in the future",
			});
		}
	}

	// Validate source enum
	if (req.body.source !== undefined) {
		const validSources = ["manual", "preset", "imported"];
		if (!validSources.includes(req.body.source)) {
			return res.status(400).json({
				success: false,
				message: `source must be one of: ${validSources.join(", ")}`,
			});
		}
	}

	next();
};

/**
 * Validate bulk operations input
 */
exports.validateBulkUsageInput = (req, res, next) => {
	const { usages } = req.body;

	if (!Array.isArray(usages)) {
		return res.status(400).json({
			success: false,
			message: "usages must be an array",
		});
	}

	if (usages.length === 0) {
		return res.status(400).json({
			success: false,
			message: "usages array cannot be empty",
		});
	}

	if (usages.length > 100) {
		return res.status(400).json({
			success: false,
			message: "Cannot create more than 100 usage records at once",
		});
	}

	// Validate each usage record
	for (let i = 0; i < usages.length; i++) {
		const usage = usages[i];
		
		if (!usage.activityType || typeof usage.activityType !== "string") {
			return res.status(400).json({
				success: false,
				message: `usages[${i}]: activityType is required and must be a string`,
			});
		}
	}

	next();
};
