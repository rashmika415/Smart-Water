const {
  BASELINE_LITERS_PER_PERSON_PER_DAY,
  DAYS_PER_MONTH,
  PRICE_PER_UNIT
} = require("../config/waterConfig"); // your constants

const getClimateFactor = require("./weatherService"); // ⭐ weather API integration

/**
 * Estimate monthly water usage for a household
 * @param {object} params - { numberOfPeople: number, location: string (city) }
 * @returns {object} { monthlyLiters, monthlyUnits, climateFactor, zone, predictedBill }
 */
async function estimateUsage({ numberOfPeople, location }) {

    // Ensure safe numeric input
    const people = Number(numberOfPeople) || 0;

    // Calculate baseline usage
    let monthlyLiters =
        people *
        BASELINE_LITERS_PER_PERSON_PER_DAY *
        DAYS_PER_MONTH;

    // ⭐ Get climate factor and zone from weather API
    const climateData = await getClimateFactor(location);
    const climateFactor = Number(climateData.factor) || 1;
    const zone = climateData.zone || "Intermediate";

    // Adjust monthly liters based on climate
    monthlyLiters *= climateFactor;

    // Convert liters to units (1 unit = 1000 liters)
    const monthlyUnits = monthlyLiters / 1000;

    // ⭐ Calculate predicted bill
    const predictedBill =
        Math.round((monthlyUnits * PRICE_PER_UNIT) * 100) / 100;

    return {
        monthlyLiters: Math.round(monthlyLiters) || 0,
        monthlyUnits: Math.round(monthlyUnits * 100) / 100 || 0,
        climateFactor,
        zone,
        predictedBill: predictedBill || 0
    };
}

module.exports = estimateUsage;