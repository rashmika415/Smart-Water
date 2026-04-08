// utils/waterSavingCalculation.js

const calculateWaterSaving = (totalWaterUsagePerDay, targetReductionPercentage) => {
  if (
    totalWaterUsagePerDay === undefined ||
    targetReductionPercentage === undefined
  ) return null;

  const waterToSave = (totalWaterUsagePerDay * targetReductionPercentage) / 100;
  const targetDailyUsage = totalWaterUsagePerDay - waterToSave;

  return {
    totalWaterUsagePerDay,
    targetReductionPercentage,
    waterToSaveLiters: waterToSave,
    targetDailyUsage,
  };
};

module.exports = { calculateWaterSaving };