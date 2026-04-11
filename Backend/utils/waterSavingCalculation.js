// utils/waterSavingCalculation.js

const calculateWaterSaving = (totalWaterUsagePerDay, targetReductionPercentage) => {
  if (
    totalWaterUsagePerDay === undefined ||
    targetReductionPercentage === undefined
  ) return null;

  const dailySavingsLiters = (totalWaterUsagePerDay * targetReductionPercentage) / 100;
  const monthlySavingsLiters = dailySavingsLiters * 30;
  const yearlySavingsLiters = dailySavingsLiters * 365;

  return {
    dailySavingsLiters,
    monthlySavingsLiters,
    yearlySavingsLiters,
  };
};

module.exports = { calculateWaterSaving };