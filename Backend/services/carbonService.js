const axios = require("axios");

const CARBON_API_KEY = process.env.CarbonInterface_API_key;
const CARBON_API_URL = "https://www.carboninterface.com/api/v1/estimates";

/**
 * Calculate CO2 emissions from water usage
 * Using CarbonInterface API with fallback to local calculation
 * 
 * @param {number} liters - Amount of water in liters
 * @param {boolean} isHeated - Whether water was heated (shower, dishwashing, etc.)
 * @returns {object} Carbon footprint data with equivalents
 */
async function calculateWaterCarbon(liters, isHeated = false) {
	try {
		if (!liters || liters <= 0) {
			return getZeroCarbon();
		}

		// Calculate energy required for water treatment and heating
		const energyData = calculateEnergyUsage(liters, isHeated);

		// Try API first if key is available
		if (CARBON_API_KEY && CARBON_API_KEY !== "your_carbon_api_key_here") {
			try {
				const apiResult = await callCarbonAPI(energyData.totalEnergyKwh);
				return {
					carbonKg: parseFloat(apiResult.carbonKg.toFixed(3)),
					energyKwh: parseFloat(energyData.totalEnergyKwh.toFixed(3)),
					breakdown: energyData.breakdown,
					equivalents: calculateEquivalents(apiResult.carbonKg),
					source: "api",
					calculatedAt: new Date(),
				};
			} catch (apiError) {
				console.warn("Carbon API failed, using local calculation:", apiError.message);
				// Fall through to local calculation
			}
		}

		// Fallback to local calculation
		return calculateLocalCarbon(liters, isHeated);
	} catch (error) {
		console.error("Carbon calculation error:", error);
		// Return safe fallback
		return calculateLocalCarbon(liters, isHeated);
	}
}

/**
 * Calculate energy usage for water treatment and heating
 */
function calculateEnergyUsage(liters, isHeated) {
	const cubic = liters / 1000; // Convert to cubic meters

	// Energy for water treatment and distribution (kWh per m³)
	const treatmentEnergy = cubic * 0.5; // 0.5 kWh per m³ typical for municipal water

	let heatingEnergy = 0;
	if (isHeated) {
		// Energy to heat water from 25°C to 45°C (typical shower temp)
		// 1 kWh heats ~24 liters by 20°C
		heatingEnergy = cubic * 42; // ~42 kWh per m³ for heating
	}

	const totalEnergyKwh = treatmentEnergy + heatingEnergy;

	return {
		totalEnergyKwh,
		breakdown: {
			treatment: parseFloat(treatmentEnergy.toFixed(3)),
			heating: parseFloat(heatingEnergy.toFixed(3)),
		},
	};
}

/**
 * Call CarbonInterface API
 */
async function callCarbonAPI(energyKwh) {
	const response = await axios.post(
		CARBON_API_URL,
		{
			type: "electricity",
			electricity_unit: "kwh",
			electricity_value: energyKwh,
			country: "lk", // Sri Lanka country code
		},
		{
			headers: {
				Authorization: `Bearer ${CARBON_API_KEY}`,
				"Content-Type": "application/json",
			},
			timeout: 5000, // 5 second timeout
		}
	);

	return {
		carbonKg: response.data.data.attributes.carbon_kg,
		carbonLb: response.data.data.attributes.carbon_lb,
	};
}

/**
 * Local carbon calculation (fallback when API unavailable)
 * Uses emission factors for Sri Lanka
 */
function calculateLocalCarbon(liters, isHeated) {
	const EMISSION_FACTORS = {
		// kg CO2 per liter
		waterTreatment: 0.0005, // Treatment & distribution
		waterHeating: 0.004, // Electric heating (Sri Lanka grid mix ~0.64 kg CO2/kWh)
		wastewater: 0.0003, // Wastewater treatment
	};

	let carbonKg = 0;

	// Treatment and distribution emissions
	carbonKg += liters * EMISSION_FACTORS.waterTreatment;

	// Heating emissions (if applicable)
	if (isHeated) {
		carbonKg += liters * EMISSION_FACTORS.waterHeating;
	}

	// Wastewater treatment emissions
	carbonKg += liters * EMISSION_FACTORS.wastewater;

	const energyData = calculateEnergyUsage(liters, isHeated);

	return {
		carbonKg: parseFloat(carbonKg.toFixed(3)),
		energyKwh: parseFloat(energyData.totalEnergyKwh.toFixed(3)),
		breakdown: energyData.breakdown,
		equivalents: calculateEquivalents(carbonKg),
		source: "local",
		calculatedAt: new Date(),
	};
}

/**
 * Convert CO2 emissions to relatable equivalents
 * @param {number} carbonKg - Carbon emissions in kilograms
 */
function calculateEquivalents(carbonKg) {
	if (!carbonKg || carbonKg <= 0) {
		return {
			carKm: 0,
			trees: 0,
			smartphones: 0,
			meals: 0,
			description: "No carbon emissions",
		};
	}

	return {
		// Car kilometers driven (avg 0.17 kg CO2/km)
		carKm: parseFloat((carbonKg / 0.17).toFixed(1)),

		// Trees needed to absorb this CO2 in 1 year (1 tree absorbs ~21.77 kg/year)
		trees: parseFloat((carbonKg / 21.77).toFixed(3)),

		// Smartphone charges (1 charge = ~0.008 kg CO2)
		smartphones: Math.round(carbonKg / 0.008),

		// Meals cooked (average meal = ~2.5 kg CO2)
		meals: parseFloat((carbonKg / 2.5).toFixed(1)),

		// Description for user display
		description: generateEquivalentDescription(carbonKg),
	};
}

/**
 * Generate human-readable description of carbon equivalent
 */
function generateEquivalentDescription(carbonKg) {
	const carKm = (carbonKg / 0.17).toFixed(1);
	const smartphones = Math.round(carbonKg / 0.008);

	if (carbonKg < 0.1) {
		return `Equal to charging ${smartphones} smartphones`;
	} else if (carbonKg < 1) {
		return `Equal to driving ${carKm} km in a car`;
	} else if (carbonKg < 10) {
		return `Equal to driving ${carKm} km or ${Math.round(carbonKg / 2.5)} meals cooked`;
	} else {
		return `Equal to driving ${carKm} km in a car`;
	}
}

/**
 * Determine if activity uses heated water
 */
function isHeatedActivity(activityType) {
	if (!activityType) return false;

	const heatedActivities = [
		"shower",
		"bath",
		"dishwashing",
		"washing machine",
		"laundry",
		"hot water",
		"bathing",
	];

	const activityLower = activityType.toLowerCase();
	return heatedActivities.some((heated) => activityLower.includes(heated));
}

/**
 * Get zero carbon object
 */
function getZeroCarbon() {
	return {
		carbonKg: 0,
		energyKwh: 0,
		breakdown: { treatment: 0, heating: 0 },
		equivalents: calculateEquivalents(0),
		source: "none",
		calculatedAt: new Date(),
	};
}

/**
 * Calculate total carbon for multiple usage records
 */
function aggregateCarbonFootprint(usageRecords) {
	let totalCarbonKg = 0;
	let totalEnergyKwh = 0;
	let heatedWaterLiters = 0;
	let totalLiters = 0;

	usageRecords.forEach((record) => {
		if (record.carbonFootprint) {
			totalCarbonKg += record.carbonFootprint.carbonKg || 0;
			totalEnergyKwh += record.carbonFootprint.energyKwh || 0;
		}
		totalLiters += record.liters || 0;
		if (record.carbonFootprint?.isHeatedWater) {
			heatedWaterLiters += record.liters || 0;
		}
	});

	return {
		totalCarbonKg: parseFloat(totalCarbonKg.toFixed(3)),
		totalEnergyKwh: parseFloat(totalEnergyKwh.toFixed(3)),
		totalLiters,
		heatedWaterLiters,
		heatedWaterPercentage: totalLiters > 0 
			? parseFloat(((heatedWaterLiters / totalLiters) * 100).toFixed(1))
			: 0,
		equivalents: calculateEquivalents(totalCarbonKg),
	};
}

module.exports = {
	calculateWaterCarbon,
	calculateLocalCarbon,
	isHeatedActivity,
	calculateEquivalents,
	aggregateCarbonFootprint,
	getZeroCarbon,
};
