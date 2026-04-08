const {
  calculateWaterCarbon,
  calculateLocalCarbon,
  isHeatedActivity,
  getZeroCarbon,
  aggregateCarbonFootprint,
} = require("../../../services/carbonService");

describe("carbonService", () => {
  describe("calculateWaterCarbon", () => {
    it("returns zero-carbon object when liters is zero", async () => {
      const result = await calculateWaterCarbon(0);

      expect(result.carbonKg).toBe(0);
      expect(result.energyKwh).toBe(0);
      expect(result.source).toBe("none");
    });
  });

  describe("calculateLocalCarbon", () => {
    it("calculates higher carbon for heated activity", () => {
      const cold = calculateLocalCarbon(100, false);
      const heated = calculateLocalCarbon(100, true);

      expect(cold.source).toBe("local");
      expect(heated.carbonKg).toBeGreaterThan(cold.carbonKg);
      expect(heated.breakdown.heating).toBeGreaterThan(0);
    });
  });

  describe("isHeatedActivity", () => {
    it("detects heated keywords", () => {
      expect(isHeatedActivity("Morning Shower")).toBe(true);
      expect(isHeatedActivity("Dishwashing session")).toBe(true);
    });

    it("returns false for non-heated activities", () => {
      expect(isHeatedActivity("watering plants")).toBe(false);
      expect(isHeatedActivity("toilet flush")).toBe(false);
    });
  });

  describe("getZeroCarbon", () => {
    it("returns safe empty structure", () => {
      const result = getZeroCarbon();

      expect(result).toMatchObject({
        carbonKg: 0,
        energyKwh: 0,
        source: "none",
      });
      expect(result.breakdown).toEqual({ treatment: 0, heating: 0 });
    });
  });

  describe("aggregateCarbonFootprint", () => {
    it("aggregates totals and heated-water percentage", () => {
      const records = [
        {
          liters: 50,
          carbonFootprint: { carbonKg: 0.5, energyKwh: 1.2, isHeatedWater: true },
        },
        {
          liters: 100,
          carbonFootprint: { carbonKg: 0.8, energyKwh: 0.9, isHeatedWater: false },
        },
      ];

      const result = aggregateCarbonFootprint(records);

      expect(result.totalCarbonKg).toBe(1.3);
      expect(result.totalEnergyKwh).toBe(2.1);
      expect(result.totalLiters).toBe(150);
      expect(result.heatedWaterLiters).toBe(50);
      expect(result.heatedWaterPercentage).toBe(33.3);
    });
  });
});
