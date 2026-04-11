const MockSavingPlan = jest.fn();
MockSavingPlan.find = jest.fn();
MockSavingPlan.findOne = jest.fn();
MockSavingPlan.findById = jest.fn();
MockSavingPlan.findByIdAndUpdate = jest.fn();
MockSavingPlan.findByIdAndDelete = jest.fn();

jest.mock("../../../models/SavingPlanModel", () => MockSavingPlan);
jest.mock("../../../models/householdModel", () => ({
  findOne: jest.fn(),
}));
jest.mock("../../../models/UsageModel", () => ({
  aggregate: jest.fn(),
}));
jest.mock("../../../models/userModel", () => ({
  findById: jest.fn(),
}));
jest.mock("../../../utils/savingTips", () => ({
  generateSavingTips: jest.fn(),
}));
jest.mock("../../../utils/waterSavingCalculation", () => ({
  calculateWaterSaving: jest.fn(),
}));
jest.mock("../../../services/WaterSavingWeatherService", () => ({
  getWeatherForLocation: jest.fn(),
}));

const SavingPlan = require("../../../models/SavingPlanModel");
const Household = require("../../../models/householdModel");
const Usage = require("../../../models/UsageModel");
const { generateSavingTips } = require("../../../utils/savingTips");
const { calculateWaterSaving } = require("../../../utils/waterSavingCalculation");
const { getWeatherForLocation } = require("../../../services/WaterSavingWeatherService");
const savingPlanController = require("../../../controllers/SavingPlanController");

function createMockRes() {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };
}

describe("SavingPlanController unit", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("addSavingPlan", () => {
    it("returns 404 when household is not found", async () => {
      Household.findOne.mockResolvedValue(null);

      const req = {
        user: { id: "user-1" },
        body: {
          planType: "Basic",
          householdSize: 3,
          priorityArea: "Kitchen",
          waterSource: "Municipal",
        },
      };
      const res = createMockRes();

      await savingPlanController.addSavingPlan(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: "No household found for this user" });
    });

    it("returns 400 when required fields are missing", async () => {
      Household.findOne.mockResolvedValue({ _id: "house-1" });

      const req = {
        user: { id: "user-1" },
        body: {
          planType: "Basic",
          householdSize: 2,
          waterSource: "Municipal",
        },
      };
      const res = createMockRes();

      await savingPlanController.addSavingPlan(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: "All required fields must be provided" })
      );
    });

    it("returns 400 when active plan already exists", async () => {
      Household.findOne.mockResolvedValue({ _id: "house-1" });
      Usage.aggregate.mockResolvedValue([{ totalLiters: 1200, daysWithUsage: 30 }]);
      SavingPlan.findOne.mockResolvedValue({ _id: "plan-existing", status: "Active" });

      const req = {
        user: { id: "user-1" },
        body: {
          planType: "Basic",
          householdSize: 3,
          priorityArea: "General",
          waterSource: "Municipal",
        },
      };
      const res = createMockRes();

      await savingPlanController.addSavingPlan(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: "An active saving plan already exists" })
      );
    });

    it("creates a custom plan and returns 201", async () => {
      const household = {
        _id: "house-1",
        location: { city: "Colombo" },
      };

      Household.findOne.mockResolvedValue(household);
      Usage.aggregate.mockResolvedValue([{ totalLiters: 1500, daysWithUsage: 30 }]);
      SavingPlan.findOne.mockResolvedValue(null);

      calculateWaterSaving.mockReturnValue({ targetDailyUsage: 40, litersToSavePerDay: 10 });
      generateSavingTips.mockReturnValue(["Take shorter showers"]);
      getWeatherForLocation.mockResolvedValue({ city: "Colombo", advice: "Rain expected" });

      const planDoc = {
        _id: "plan-1",
        save: jest.fn().mockResolvedValue(),
        toObject: jest.fn().mockReturnValue({
          _id: "plan-1",
          planType: "Custom",
          totalWaterUsagePerDay: 50,
          targetReductionPercentage: 25,
        }),
      };
      SavingPlan.mockImplementation(() => planDoc);

      const req = {
        user: { id: "user-1" },
        body: {
          planType: "Custom",
          householdSize: 3,
          priorityArea: "Bathroom",
          customGoalPercentage: 25,
          waterSource: "Municipal",
        },
      };
      const res = createMockRes();

      await savingPlanController.addSavingPlan(req, res);

      expect(SavingPlan).toHaveBeenCalledWith(
        expect.objectContaining({
          householdId: "house-1",
          planType: "Custom",
          totalWaterUsagePerDay: 50,
          targetReductionPercentage: 25,
          customGoalPercentage: 25,
          status: "Active",
        })
      );
      expect(planDoc.save).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: "Saving plan created successfully",
          data: expect.objectContaining({
            savingCalculation: expect.any(Object),
            savingTips: expect.any(Array),
            weatherData: expect.any(Object),
          }),
        })
      );
    });
  });

  describe("getAllSavingPlans", () => {
    it("returns 404 for non-admin user without household", async () => {
      Household.findOne.mockResolvedValue(null);

      const req = { user: { id: "user-1", role: "user" } };
      const res = createMockRes();

      await savingPlanController.getAllSavingPlans(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: "No household found for this user" });
    });

    it("returns enhanced plan list for admin", async () => {
      const plan = {
        _id: "plan-2",
        householdId: {
          _id: "house-2",
          name: "My Home",
          userId: { _id: "u2", name: "Sam", email: "sam@test.com" },
          location: { city: "Kandy" },
        },
        toObject: jest.fn().mockReturnValue({
          _id: "plan-2",
          planType: "Basic",
          totalWaterUsagePerDay: 80,
          targetReductionPercentage: 10,
          priorityArea: "General",
        }),
      };

      SavingPlan.find.mockReturnValue({
        populate: jest.fn().mockResolvedValue([plan]),
      });
      calculateWaterSaving.mockReturnValue({ litersToSavePerDay: 8 });
      generateSavingTips.mockReturnValue(["Check leaks"]);
      getWeatherForLocation.mockResolvedValue({ city: "Kandy", advice: "Hot day" });

      const req = { user: { id: "admin-1", role: "admin" } };
      const res = createMockRes();

      await savingPlanController.getAllSavingPlans(req, res);

      expect(SavingPlan.find).toHaveBeenCalledWith({});
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          count: 1,
          savingPlans: [
            expect.objectContaining({
              householdName: "My Home",
              user: expect.objectContaining({ email: "sam@test.com" }),
            }),
          ],
        })
      );
    });

    it("keeps response successful when weather service fails", async () => {
      const plan = {
        _id: "plan-3",
        householdId: {
          _id: "house-3",
          name: "Green Home",
          userId: { _id: "u3", name: "Alex", email: "alex@test.com" },
          location: { city: "Galle" },
        },
        toObject: jest.fn().mockReturnValue({
          _id: "plan-3",
          planType: "Advanced",
          totalWaterUsagePerDay: 120,
          targetReductionPercentage: 20,
          priorityArea: "Garden",
        }),
      };

      SavingPlan.find.mockReturnValue({
        populate: jest.fn().mockResolvedValue([plan]),
      });
      getWeatherForLocation.mockRejectedValue(new Error("Weather API timeout"));
      calculateWaterSaving.mockReturnValue({ litersToSavePerDay: 24 });
      generateSavingTips.mockReturnValue(["Water plants early morning"]);

      const req = { user: { id: "admin-2", role: "admin" } };
      const res = createMockRes();

      await savingPlanController.getAllSavingPlans(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          count: 1,
          savingPlans: [
            expect.objectContaining({
              weatherData: expect.objectContaining({
                error: "Failed to fetch weather data",
              }),
              savingCalculation: expect.objectContaining({ litersToSavePerDay: 24 }),
            }),
          ],
        })
      );
    });
  });

  describe("getSavingPlanById", () => {
    it("returns 404 when plan does not exist", async () => {
      SavingPlan.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue(null),
      });

      const req = { params: { id: "plan-missing" } };
      const res = createMockRes();

      await savingPlanController.getSavingPlanById(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: "No saving plan found" });
    });
  });

  describe("updateSavingPlan", () => {
    it("returns 400 for invalid plan type", async () => {
      const req = {
        params: { id: "plan-1" },
        body: { planType: "Starter" },
      };
      const res = createMockRes();

      await savingPlanController.updateSavingPlan(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: "Invalid plan type" });
    });
  });

  describe("deleteSavingPlan", () => {
    it("returns 404 when target plan does not exist", async () => {
      SavingPlan.findByIdAndDelete.mockResolvedValue(null);

      const req = { params: { id: "plan-missing" } };
      const res = createMockRes();

      await savingPlanController.deleteSavingPlan(req, res);

      expect(SavingPlan.findByIdAndDelete).toHaveBeenCalledWith("plan-missing");
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: "Unable to delete" });
    });

    it("deletes plan and returns success message", async () => {
      SavingPlan.findByIdAndDelete.mockResolvedValue({ _id: "plan-7" });

      const req = { params: { id: "plan-7" } };
      const res = createMockRes();

      await savingPlanController.deleteSavingPlan(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ message: "Saving plan successfully deleted" });
    });
  });

  describe("getSavingCalculation", () => {
    it("returns calculation when household and plan exist", async () => {
      Household.findOne.mockResolvedValue({ _id: "house-9" });
      SavingPlan.findOne.mockResolvedValue({
        totalWaterUsagePerDay: 100,
        targetReductionPercentage: 20,
      });
      calculateWaterSaving.mockReturnValue({ litersToSavePerDay: 20 });

      const req = { user: { id: "user-9" } };
      const res = createMockRes();

      await savingPlanController.getSavingCalculation(req, res);

      expect(calculateWaterSaving).toHaveBeenCalledWith(100, 20);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ litersToSavePerDay: 20 });
    });
  });
});
