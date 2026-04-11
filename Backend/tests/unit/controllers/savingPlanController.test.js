jest.mock("../../../models/SavingPlanModel", () => {
  const SavingPlan = jest.fn();
  
  // Mock find to return an object with populate method
  SavingPlan.find = jest.fn().mockReturnValue({
    populate: jest.fn().mockResolvedValue([])
  });
  
  // Mock findById to return an object with populate method
  SavingPlan.findById = jest.fn().mockReturnValue({
    populate: jest.fn().mockResolvedValue(null)
  });
  
  SavingPlan.findOne = jest.fn();
  SavingPlan.findByIdAndUpdate = jest.fn();
  SavingPlan.findByIdAndDelete = jest.fn();
  SavingPlan.prototype.save = jest.fn();
  return SavingPlan;
});

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
const User = require("../../../models/userModel");
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

describe("savingPlanController unit tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getAllSavingPlans", () => {
    it("should return saving plans for regular user", async () => {
      const mockHousehold = { _id: "household-1", name: "Test Household" };
      const mockSavingPlan = {
        _id: "plan-1",
        householdId: mockHousehold,
        planType: "Basic",
        toObject: jest.fn().mockReturnValue({
          _id: "plan-1",
          householdId: mockHousehold,
          planType: "Basic",
          totalWaterUsagePerDay: 100,
          targetReductionPercentage: 10,
          priorityArea: "Bathroom",
        }),
      };

      Household.findOne.mockResolvedValue(mockHousehold);
      SavingPlan.find.mockReturnValue({
        populate: jest.fn().mockResolvedValue([mockSavingPlan])
      });
      generateSavingTips.mockReturnValue(["Tip 1", "Tip 2"]);
      calculateWaterSaving.mockReturnValue({
        dailySavingsLiters: 10,
        monthlySavingsLiters: 300,
        yearlySavingsLiters: 3650,
      });
      getWeatherForLocation.mockResolvedValue({ temperature: 25 });

      const req = {
        user: { id: "user-1", role: "user" },
      };
      const res = createMockRes();

      await savingPlanController.getAllSavingPlans(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        count: 1,
        savingPlans: expect.any(Array),
      });
    });

    it("should return all saving plans for admin", async () => {
      const mockSavingPlan = {
        _id: "plan-1",
        householdId: { _id: "household-1", name: "Test Household" },
        planType: "Basic",
        toObject: jest.fn().mockReturnValue({
          _id: "plan-1",
          householdId: "household-1",
          planType: "Basic",
        }),
      };

      SavingPlan.find.mockReturnValue({
        populate: jest.fn().mockResolvedValue([mockSavingPlan])
      });
      generateSavingTips.mockReturnValue(["Tip 1"]);
      calculateWaterSaving.mockReturnValue({});
      getWeatherForLocation.mockResolvedValue({});

      const req = {
        user: { id: "admin-1", role: "admin" },
      };
      const res = createMockRes();

      await savingPlanController.getAllSavingPlans(req, res);

      expect(SavingPlan.find).toHaveBeenCalledWith({});
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("should return 404 when user has no household", async () => {
      Household.findOne.mockResolvedValue(null);

      const req = {
        user: { id: "user-1", role: "user" },
      };
      const res = createMockRes();

      await savingPlanController.getAllSavingPlans(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        message: "No household found for this user",
      });
    });
  });

  describe("addSavingPlan", () => {
    it("should create a new saving plan successfully", async () => {
      const mockHousehold = {
        _id: "household-1",
        location: { city: "Colombo" },
      };
      const mockUsageResult = [{ totalLiters: 1500, daysWithUsage: 15 }];
      const mockNewPlan = {
        _id: "plan-1",
        householdId: "household-1",
        planType: "Basic",
        targetReductionPercentage: 10,
        toObject: jest.fn().mockReturnValue({
          _id: "plan-1",
          planType: "Basic",
          targetReductionPercentage: 10,
        }),
        save: jest.fn().mockResolvedValue(),
      };

      Household.findOne.mockResolvedValue(mockHousehold);
      Usage.aggregate.mockResolvedValue(mockUsageResult);
      SavingPlan.findOne.mockResolvedValue(null); // No existing active plan
      SavingPlan.mockImplementation(() => mockNewPlan);
      generateSavingTips.mockReturnValue(["Tip 1"]);
      calculateWaterSaving.mockReturnValue({
        dailySavingsLiters: 10,
      });
      getWeatherForLocation.mockResolvedValue({ temperature: 25 });

      const req = {
        user: { id: "user-1" },
        body: {
          planType: "Basic",
          householdSize: 4,
          priorityArea: "Bathroom",
          waterSource: "Municipal",
        },
      };
      const res = createMockRes();

      await savingPlanController.addSavingPlan(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "Saving plan created successfully",
        data: expect.any(Object),
      });
    });

    it("should reject when household not found", async () => {
      Household.findOne.mockResolvedValue(null);

      const req = {
        user: { id: "user-1" },
        body: {
          planType: "Basic",
          householdSize: 4,
          priorityArea: "Bathroom",
          waterSource: "Municipal",
        },
      };
      const res = createMockRes();

      await savingPlanController.addSavingPlan(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        message: "No household found for this user",
      });
    });

    it("should reject when active plan already exists", async () => {
      const mockHousehold = { _id: "household-1" };
      const mockUsageResult = [{ totalLiters: 1500, daysWithUsage: 15 }];
      const mockExistingPlan = { _id: "existing-plan" };

      Household.findOne.mockResolvedValue(mockHousehold);
      Usage.aggregate.mockResolvedValue(mockUsageResult);
      SavingPlan.findOne.mockResolvedValue(mockExistingPlan);

      const req = {
        user: { id: "user-1" },
        body: {
          planType: "Basic",
          householdSize: 4,
          priorityArea: "Bathroom",
          waterSource: "Municipal",
        },
      };
      const res = createMockRes();

      await savingPlanController.addSavingPlan(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: "An active saving plan already exists",
      });
    });

    it("should create custom plan with custom percentage", async () => {
      const mockHousehold = {
        _id: "household-1",
        location: { city: "Colombo" },
      };
      const mockUsageResult = [{ totalLiters: 1500, daysWithUsage: 15 }];
      const mockNewPlan = {
        _id: "plan-1",
        householdId: "household-1",
        planType: "Custom",
        targetReductionPercentage: 25,
        customGoalPercentage: 25,
        toObject: jest.fn().mockReturnValue({
          _id: "plan-1",
          planType: "Custom",
          targetReductionPercentage: 25,
          customGoalPercentage: 25,
        }),
        save: jest.fn().mockResolvedValue(),
      };

      Household.findOne.mockResolvedValue(mockHousehold);
      Usage.aggregate.mockResolvedValue(mockUsageResult);
      SavingPlan.findOne.mockResolvedValue(null);
      SavingPlan.mockImplementation(() => mockNewPlan);
      generateSavingTips.mockReturnValue(["Tip 1"]);
      calculateWaterSaving.mockReturnValue({});
      getWeatherForLocation.mockResolvedValue({});

      const req = {
        user: { id: "user-1" },
        body: {
          planType: "Custom",
          householdSize: 4,
          priorityArea: "Bathroom",
          waterSource: "Municipal",
          customGoalPercentage: 25,
        },
      };
      const res = createMockRes();

      await savingPlanController.addSavingPlan(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(mockNewPlan.customGoalPercentage).toBe(25);
      expect(mockNewPlan.targetReductionPercentage).toBe(25);
    });
  });

  describe("getSavingPlanById", () => {
    it("should return a saving plan by ID", async () => {
      const mockSavingPlan = {
        _id: "plan-1",
        householdId: { _id: "household-1", location: { city: "Colombo" } },
        planType: "Basic",
        totalWaterUsagePerDay: 100,
        targetReductionPercentage: 10,
        priorityArea: "Bathroom",
        toObject: jest.fn().mockReturnValue({
          _id: "plan-1",
          householdId: "household-1",
          planType: "Basic",
          totalWaterUsagePerDay: 100,
          targetReductionPercentage: 10,
          priorityArea: "Bathroom",
        }),
      };

      SavingPlan.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockSavingPlan)
      });
      generateSavingTips.mockReturnValue(["Tip 1"]);
      calculateWaterSaving.mockReturnValue({
        dailySavingsLiters: 10,
      });
      getWeatherForLocation.mockResolvedValue({ temperature: 25 });

      const req = {
        params: { id: "plan-1" },
      };
      const res = createMockRes();

      await savingPlanController.getSavingPlanById(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        savingPlan: expect.any(Object),
      });
    });

    it("should return 404 for non-existent plan", async () => {
      SavingPlan.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue(null)
      });

      const req = {
        params: { id: "non-existent" },
      };
      const res = createMockRes();

      await savingPlanController.getSavingPlanById(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        message: "No saving plan found",
      });
    });
  });

  describe("updateSavingPlan", () => {
    it("should update a saving plan", async () => {
      const mockUpdatedPlan = {
        _id: "plan-1",
        planType: "Advanced",
        status: "Completed",
      };

      SavingPlan.findByIdAndUpdate.mockResolvedValue(mockUpdatedPlan);

      const req = {
        params: { id: "plan-1" },
        body: {
          planType: "Advanced",
          status: "Completed",
        },
      };
      const res = createMockRes();

      await savingPlanController.updateSavingPlan(req, res);

      expect(SavingPlan.findByIdAndUpdate).toHaveBeenCalledWith(
        "plan-1",
        {
          planType: "Advanced",
          status: "Completed",
        },
        { new: true }
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        savingPlan: mockUpdatedPlan,
      });
    });

    it("should return 404 for non-existent plan", async () => {
      SavingPlan.findByIdAndUpdate.mockResolvedValue(null);

      const req = {
        params: { id: "non-existent" },
        body: { status: "Completed" },
      };
      const res = createMockRes();

      await savingPlanController.updateSavingPlan(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        message: "Saving plan not found",
      });
    });
  });

  describe("deleteSavingPlan", () => {
    it("should delete a saving plan", async () => {
      const mockDeletedPlan = { _id: "plan-1" };

      SavingPlan.findByIdAndDelete.mockResolvedValue(mockDeletedPlan);

      const req = {
        params: { id: "plan-1" },
      };
      const res = createMockRes();

      await savingPlanController.deleteSavingPlan(req, res);

      expect(SavingPlan.findByIdAndDelete).toHaveBeenCalledWith("plan-1");
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: "Saving plan successfully deleted",
      });
    });

    it("should return 404 for non-existent plan", async () => {
      SavingPlan.findByIdAndDelete.mockResolvedValue(null);

      const req = {
        params: { id: "non-existent" },
      };
      const res = createMockRes();

      await savingPlanController.deleteSavingPlan(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        message: "Unable to delete",
      });
    });
  });

  describe("getSavingCalculation", () => {
    it("should return saving calculation for user's household", async () => {
      const mockHousehold = { _id: "household-1" };
      const mockSavingPlan = {
        totalWaterUsagePerDay: 100,
        targetReductionPercentage: 10,
      };
      const mockCalculation = {
        dailySavingsLiters: 10,
        monthlySavingsLiters: 300,
        yearlySavingsLiters: 3650,
      };

      Household.findOne.mockResolvedValue(mockHousehold);
      SavingPlan.findOne.mockResolvedValue(mockSavingPlan);
      calculateWaterSaving.mockReturnValue(mockCalculation);

      const req = {
        user: { id: "user-1" },
      };
      const res = createMockRes();

      await savingPlanController.getSavingCalculation(req, res);

      expect(calculateWaterSaving).toHaveBeenCalledWith(100, 10);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockCalculation);
    });

    it("should return 404 when household not found", async () => {
      Household.findOne.mockResolvedValue(null);

      const req = {
        user: { id: "user-1" },
      };
      const res = createMockRes();

      await savingPlanController.getSavingCalculation(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        message: "Household not found",
      });
    });

    it("should return 404 when saving plan not found", async () => {
      const mockHousehold = { _id: "household-1" };

      Household.findOne.mockResolvedValue(mockHousehold);
      SavingPlan.findOne.mockResolvedValue(null);

      const req = {
        user: { id: "user-1" },
      };
      const res = createMockRes();

      await savingPlanController.getSavingCalculation(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        message: "Saving plan not found",
      });
    });
  });
});