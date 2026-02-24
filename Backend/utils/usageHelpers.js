const Household = require("../models/householdModel");

/**
 * Get household for authenticated user
 * @param {String} userId - User ID from JWT token
 * @returns {Object} household document or null
 */
exports.getUserHousehold = async (userId) => {
	try {
		const household = await Household.findOne({ userId });
		return household;
	} catch (error) {
		throw new Error(`Error fetching household: ${error.message}`);
	}
};

/**
 * Build query filters for usage search
 * @param {Object} queryParams - Request query parameters
 * @param {String} householdId - Household ID to filter by
 * @returns {Object} MongoDB filter object
 */
exports.buildUsageFilter = (queryParams, householdId) => {
	const filter = {
		householdId,
		deletedAt: null,
	};

	// Filter by activity type
	if (queryParams.activityType) {
		filter.activityType = queryParams.activityType;
	}

	// Filter by date range
	if (queryParams.startDate || queryParams.endDate) {
		filter.occurredAt = {};
		
		if (queryParams.startDate) {
			const startDate = new Date(queryParams.startDate);
			if (!isNaN(startDate.getTime())) {
				filter.occurredAt.$gte = startDate;
			}
		}
		
		if (queryParams.endDate) {
			const endDate = new Date(queryParams.endDate);
			if (!isNaN(endDate.getTime())) {
				// Set to end of day
				endDate.setHours(23, 59, 59, 999);
				filter.occurredAt.$lte = endDate;
			}
		}
	}

	// Filter by source
	if (queryParams.source) {
		const validSources = ["manual", "preset", "imported"];
		if (validSources.includes(queryParams.source)) {
			filter.source = queryParams.source;
		}
	}

	return filter;
};

/**
 * Parse pagination parameters
 * @param {Object} query - Request query parameters
 * @returns {Object} { page, limit, skip }
 */
exports.getPaginationParams = (query) => {
	const page = parseInt(query.page) || 1;
	const limit = Math.min(parseInt(query.limit) || 20, 100); // Max 100 per page
	const skip = (page - 1) * limit;

	return { page, limit, skip };
};

/**
 * Parse sort parameters
 * @param {String} sortParam - Sort parameter from query (e.g., "-occurredAt" or "liters")
 * @returns {Object} MongoDB sort object
 */
exports.getSortParams = (sortParam) => {
	if (!sortParam) {
		return { occurredAt: -1 }; // Default: newest first
	}

	const sortOrder = sortParam.startsWith("-") ? -1 : 1;
	const sortField = sortParam.replace(/^-/, "");

	const allowedSortFields = ["occurredAt", "liters", "activityType", "createdAt"];
	
	if (allowedSortFields.includes(sortField)) {
		return { [sortField]: sortOrder };
	}

	return { occurredAt: -1 }; // Default
};
