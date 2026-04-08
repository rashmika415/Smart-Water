jest.mock("../../../models/UsageModel", () => {
  const Usage = jest.fn();
  Usage.find = jest.fn();
  Usage.findOne = jest.fn();
  Usage.findOneAndUpdate = jest.fn();
  Usage.countDocuments = jest.fn();
  Usage.aggregate = jest.fn();
  return Usage;
});

jest.mock("../../../models/householdModel", () => ({
  findOne: jest.fn(),
}));

jest.mock("../../../services/carbonService", () => ({
  aggregateCarbonFootprint: jest.fn(),
  calculateWaterCarbon: jest.fn(),
  isHeatedActivity: jest.fn(),
}));

const Usage = require("../../../models/UsageModel");
const Household = require("../../../models/householdModel");
const carbonService = require("../../../services/carbonService");
const usageController = require("../../../controllers/usageController");

function createMockRes() {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };
}

describe("usageController unit", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("createUsage", () => {
    it("returns 404 when user household does not exist", async () => {
      Household.findOne.mockResolvedValue(null);

      const req = {
        user: { id: "user-1" },
        body: { activityType: "shower", liters: 50 },
      };
      const res = createMockRes();

      await usageController.createUsage(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: false })
      );
    });

    it("returns 400 when activityType is missing", async () => {
      Household.findOne.mockResolvedValue({ _id: "household-1" });

      const req = {
        user: { id: "user-1" },
        body: { liters: 20 },
      };
      const res = createMockRes();

      await usageController.createUsage(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: "Missing required field: activityType" })
      );
      expect(Usage).not.toHaveBeenCalled();
    });

    it("creates usage and returns 201 for valid input", async () => {
      Household.findOne.mockResolvedValue({ _id: "household-99" });

      const savedUsage = {
        _id: "usage-1",
        householdId: "household-99",
        activityType: "shower",
        liters: 50,
        carbonFootprint: {
          carbonKg: 0.25,
          energyKwh: 0.4,
          equivalents: { carKm: 1.5, description: "Equal to charging 31 smartphones" },
        },
        occurredAt: new Date("2026-03-01T00:00:00.000Z"),
        createdAt: new Date("2026-03-01T01:00:00.000Z"),
      };

      Usage.mockImplementation(() => ({
        save: jest.fn().mockResolvedValue(savedUsage),
      }));

      const req = {
        user: { id: "user-1" },
        body: {
          activityType: "shower",
          liters: 50,
          notes: "night use",
        },
      };
      const res = createMockRes();

      await usageController.createUsage(req, res);

      expect(Usage).toHaveBeenCalledWith(
        expect.objectContaining({
          householdId: "household-99",
          activityType: "shower",
          liters: 50,
        })
      );
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: "Usage created successfully",
        })
      );
    });
  });

  describe("getAllUsages", () => {
    it("returns 404 when user household does not exist", async () => {
      Household.findOne.mockResolvedValue(null);

      const req = { user: { id: "user-1" }, query: {} };
      const res = createMockRes();

      await usageController.getAllUsages(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: "No household found for this user." })
      );
    });

    it("returns paginated usage list for valid household", async () => {
      Household.findOne.mockResolvedValue({ _id: "household-1" });

      const usages = [
        {
          _id: "usage-1",
          householdId: "household-1",
          activityType: "shower",
          liters: 40,
          durationMinutes: 8,
          flowRateLpm: 5,
          count: null,
          litersPerUnit: null,
          carbonFootprint: {
            carbonKg: 0.2,
            energyKwh: 0.4,
            breakdown: { treatment: 0.01, heating: 0.39 },
            equivalents: { carKm: 1.2, trees: 0.01, smartphones: 25, meals: 0.1 },
          },
          occurredAt: new Date("2026-03-01T00:00:00.000Z"),
          createdAt: new Date("2026-03-01T01:00:00.000Z"),
          updatedAt: new Date("2026-03-01T01:10:00.000Z"),
        },
      ];

      const chain = {
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue(usages),
      };

      Usage.find.mockReturnValue(chain);
      Usage.countDocuments.mockResolvedValue(1);

      const req = {
        user: { id: "user-1" },
        query: { page: "1", limit: "10", sort: "-occurredAt" },
      };
      const res = createMockRes();

      await usageController.getAllUsages(req, res);

      expect(Usage.find).toHaveBeenCalled();
      expect(Usage.countDocuments).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          page: 1,
          limit: 10,
          total: 1,
          count: 1,
        })
      );
    });
  });

  describe("getUsageById", () => {
    it("returns 404 when usage record is not found", async () => {
      Household.findOne.mockResolvedValue({ _id: "household-1" });
      Usage.findOne.mockResolvedValue(null);

      const req = { user: { id: "user-1" }, params: { id: "usage-x" } };
      const res = createMockRes();

      await usageController.getUsageById(req, res);

      expect(Usage.findOne).toHaveBeenCalledWith(
        expect.objectContaining({ _id: "usage-x", householdId: "household-1" })
      );
      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe("updateUsage", () => {
    it("returns 400 when no valid update fields are provided", async () => {
      Household.findOne.mockResolvedValue({ _id: "household-1" });

      const req = {
        user: { id: "user-1" },
        params: { id: "usage-1" },
        body: { invalidField: "x" },
      };
      const res = createMockRes();

      await usageController.updateUsage(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: "No valid fields provided for update" })
      );
    });

    it("recalculates liters and carbon when calculation fields are updated", async () => {
      Household.findOne.mockResolvedValue({ _id: "household-1" });
      Usage.findOne.mockResolvedValue({
        _id: "usage-1",
        householdId: "household-1",
        activityType: "shower",
        durationMinutes: 10,
        flowRateLpm: 5,
        count: null,
        litersPerUnit: null,
        liters: 50,
        deletedAt: null,
      });

      carbonService.isHeatedActivity.mockReturnValue(true);
      carbonService.calculateWaterCarbon.mockResolvedValue({
        carbonKg: 0.5,
        energyKwh: 1.2,
        breakdown: { treatment: 0.02, heating: 1.18 },
        equivalents: { carKm: 2.9, trees: 0.02, smartphones: 63, meals: 0.2 },
        source: "local",
        calculatedAt: new Date("2026-03-02T00:00:00.000Z"),
      });

      Usage.findOneAndUpdate.mockResolvedValue({
        _id: "usage-1",
        householdId: "household-1",
        activityType: "shower",
        liters: 60,
        durationMinutes: 12,
        flowRateLpm: 5,
        count: null,
        litersPerUnit: null,
        carbonFootprint: {
          carbonKg: 0.5,
          energyKwh: 1.2,
          breakdown: { treatment: 0.02, heating: 1.18 },
          equivalents: { carKm: 2.9, trees: 0.02, smartphones: 63, meals: 0.2 },
        },
        occurredAt: new Date("2026-03-01T00:00:00.000Z"),
        createdAt: new Date("2026-03-01T01:00:00.000Z"),
        updatedAt: new Date("2026-03-02T01:00:00.000Z"),
      });

      const req = {
        user: { id: "user-1" },
        params: { id: "usage-1" },
        body: { durationMinutes: 12, flowRateLpm: 5 },
      };
      const res = createMockRes();

      await usageController.updateUsage(req, res);

      expect(carbonService.calculateWaterCarbon).toHaveBeenCalledWith(60, true);
      expect(Usage.findOneAndUpdate).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          $set: expect.objectContaining({
            liters: 60,
            carbonFootprint: expect.objectContaining({ carbonKg: 0.5 }),
          }),
        }),
        expect.any(Object)
      );
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe("deleteUsage", () => {
    it("soft deletes usage and returns success", async () => {
      Household.findOne.mockResolvedValue({ _id: "household-1" });
      const save = jest.fn().mockResolvedValue(true);
      const usageDoc = {
        _id: "usage-1",
        householdId: "household-1",
        deletedAt: null,
        save,
      };
      Usage.findOne.mockResolvedValue(usageDoc);

      const req = { user: { id: "user-1" }, params: { id: "usage-1" } };
      const res = createMockRes();

      await usageController.deleteUsage(req, res);

      expect(usageDoc.deletedAt).toBeInstanceOf(Date);
      expect(save).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: "Usage deleted successfully" })
      );
    });
  });

  describe("getCarbonStats", () => {
    it("returns aggregated carbon stats and comparison", async () => {
      Household.findOne.mockResolvedValue({ _id: "household-1" });

      const currentUsages = [{ liters: 100, carbonFootprint: { carbonKg: 1, energyKwh: 2 } }];
      const previousUsages = [{ liters: 80, carbonFootprint: { carbonKg: 2, energyKwh: 3 } }];

      Usage.find
        .mockImplementationOnce(() => ({ sort: jest.fn().mockResolvedValue(currentUsages) }))
        .mockResolvedValueOnce(previousUsages);

      carbonService.aggregateCarbonFootprint
        .mockReturnValueOnce({ totalCarbonKg: 1, totalEnergyKwh: 2 })
        .mockReturnValueOnce({ totalCarbonKg: 2, totalEnergyKwh: 3 });

      const req = { user: { id: "user-1" }, query: {} };
      const res = createMockRes();

      await usageController.getCarbonStats(req, res);

      expect(carbonService.aggregateCarbonFootprint).toHaveBeenCalledTimes(2);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            current: expect.objectContaining({ totalCarbonKg: 1 }),
            previous: expect.objectContaining({ totalCarbonKg: 2 }),
          }),
        })
      );
    });
  });

  describe("getCarbonTrend", () => {
    it("returns trend and average daily carbon", async () => {
      Household.findOne.mockResolvedValue({ _id: "household-1" });
      Usage.aggregate.mockResolvedValue([
        { date: "2026-03-01", totalLiters: 100, totalCarbonKg: 1.2, totalEnergyKwh: 2.4, usageCount: 2 },
        { date: "2026-03-02", totalLiters: 80, totalCarbonKg: 0.8, totalEnergyKwh: 1.7, usageCount: 1 },
      ]);

      const req = { user: { id: "user-1" }, query: { days: "7" } };
      const res = createMockRes();

      await usageController.getCarbonTrend(req, res);

      expect(Usage.aggregate).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            trend: expect.any(Array),
            averageDailyCarbonKg: 1,
          }),
        })
      );
    });
  });

  describe("getCarbonByActivity", () => {
    it("returns 404 when household is missing", async () => {
      Household.findOne.mockResolvedValue(null);

      const req = { user: { id: "user-1" }, query: {} };
      const res = createMockRes();

      await usageController.getCarbonByActivity(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: "No household found for this user." })
      );
    });

    it("returns activity breakdown with percentages", async () => {
      Household.findOne.mockResolvedValue({ _id: "household-1" });
      Usage.aggregate.mockResolvedValue([
        {
          _id: "shower",
          totalLiters: 120,
          totalCarbonKg: 1.2,
          totalEnergyKwh: 2.45,
          count: 3,
          avgLitersPerUse: 40,
          avgCarbonPerUse: 0.4,
        },
        {
          _id: "dishwashing",
          totalLiters: 80,
          totalCarbonKg: 0.8,
          totalEnergyKwh: 1.6,
          count: 2,
          avgLitersPerUse: 40,
          avgCarbonPerUse: 0.4,
        },
      ]);

      const req = { user: { id: "user-1" }, query: {} };
      const res = createMockRes();

      await usageController.getCarbonByActivity(req, res);

      expect(Usage.aggregate).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            totalCarbonKg: 2,
            topEmitter: expect.objectContaining({ activityType: "shower" }),
            breakdown: expect.arrayContaining([
              expect.objectContaining({
                activityType: "shower",
                percentageOfTotal: 60,
              }),
            ]),
          }),
        })
      );
    });
  });

  describe("getCarbonLeaderboard", () => {
    it("returns ranked households by carbon footprint", async () => {
      Usage.aggregate.mockResolvedValue([
        {
          householdId: "h-1",
          householdName: "Green Home",
          totalLiters: 200,
          totalCarbonKg: 1.1,
          residents: 4,
          carbonPerResident: 0.275,
        },
        {
          householdId: "h-2",
          householdName: "Blue Home",
          totalLiters: 250,
          totalCarbonKg: 1.3,
          residents: 5,
          carbonPerResident: 0.26,
        },
      ]);

      const req = { user: { id: "user-1" }, query: { limit: "5" } };
      const res = createMockRes();

      await usageController.getCarbonLeaderboard(req, res);

      expect(Usage.aggregate).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            leaderboard: expect.arrayContaining([
              expect.objectContaining({
                rank: 1,
                householdName: "Green Home",
                badge: "🥇 Top Eco-Warrior",
              }),
              expect.objectContaining({
                rank: 2,
                householdName: "Blue Home",
                badge: "🥈 Green Champion",
              }),
            ]),
          }),
        })
      );
    });
  });
});
