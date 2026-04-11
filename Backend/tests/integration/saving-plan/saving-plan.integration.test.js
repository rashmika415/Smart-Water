const express = require("express");
const request = require("supertest");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");

const USER_ID = "507f1f77bcf86cd799439201";
const OTHER_USER_ID = "507f1f77bcf86cd799439202";
const ADMIN_ID = "507f1f77bcf86cd799439203";

jest.setTimeout(180000);

jest.mock("../../../middleware/authMiddleware", () => {
  return (req, _res, next) => {
    req.user = {
      id: req.headers["x-test-user-id"] || USER_ID,
      role: req.headers["x-test-role"] || "user",
    };
    next();
  };
});

jest.mock("../../../services/WaterSavingWeatherService", () => ({
  getWeatherForLocation: jest.fn(async (city) => ({
    location: city,
    weather: "Clouds",
    description: "few clouds",
    temperature: 28,
    gardenAdvice: "No rain detected",
  })),
}));

const savingPlanRoutes = require("../../../routes/SavingPlanRoute");
const Household = require("../../../models/householdModel");
const Usage = require("../../../models/UsageModel");
const SavingPlan = require("../../../models/SavingPlanModel");

describe("Saving Plan integration tests", () => {
  let mongod;
  let app;

  beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    await mongoose.connect(mongod.getUri());

    app = express();
    app.use(express.json());
    app.use("/SavingPlan", savingPlanRoutes);
  });

  afterAll(async () => {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
    if (mongod) {
      await mongod.stop();
    }
  });

  beforeEach(async () => {
    await Household.deleteMany({});
    await Usage.deleteMany({});
    await SavingPlan.deleteMany({});

    const userHouseholdId = new mongoose.Types.ObjectId();
    const otherHouseholdId = new mongoose.Types.ObjectId();

    await Household.create([
      {
        _id: userHouseholdId,
        name: "User Home",
        location: { city: "Colombo", state: "Western", country: "Sri Lanka" },
        numberOfResidents: 3,
        propertyType: "house",
        userId: new mongoose.Types.ObjectId(USER_ID),
      },
      {
        _id: otherHouseholdId,
        name: "Other Home",
        location: { city: "Kandy", state: "Central", country: "Sri Lanka" },
        numberOfResidents: 4,
        propertyType: "house",
        userId: new mongoose.Types.ObjectId(OTHER_USER_ID),
      },
    ]);

    await Usage.create([
      {
        householdId: userHouseholdId,
        activityType: "shower",
        liters: 120,
        occurredAt: new Date(),
      },
      {
        householdId: userHouseholdId,
        activityType: "dishwashing",
        liters: 60,
        occurredAt: new Date(),
      },
      {
        householdId: otherHouseholdId,
        activityType: "shower",
        liters: 90,
        occurredAt: new Date(),
      },
    ]);
  });

  it("POST /SavingPlan creates a saving plan", async () => {
    const res = await request(app)
      .post("/SavingPlan")
      .set("x-test-user-id", USER_ID)
      .set("x-test-role", "user")
      .send({
        planType: "Basic",
        householdSize: 3,
        priorityArea: "Bathroom",
        waterSource: "Municipal",
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.planType).toBe("Basic");
    expect(res.body.data.targetReductionPercentage).toBe(10);
    expect(res.body.data).toHaveProperty("savingCalculation");
    expect(res.body.data).toHaveProperty("weatherData");
  });

  it("POST /SavingPlan returns 400 when active plan already exists", async () => {
    const household = await Household.findOne({ userId: new mongoose.Types.ObjectId(USER_ID) });

    await SavingPlan.create({
      householdId: household._id,
      planType: "Basic",
      householdSize: 3,
      totalWaterUsagePerDay: 50,
      priorityArea: "General",
      targetReductionPercentage: 10,
      waterSource: "Municipal",
      status: "Active",
    });

    const res = await request(app)
      .post("/SavingPlan")
      .set("x-test-user-id", USER_ID)
      .send({
        planType: "Advanced",
        householdSize: 3,
        priorityArea: "Kitchen",
        waterSource: "Municipal",
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("An active saving plan already exists");
  });

  it("GET /SavingPlan returns only logged-in user's plans", async () => {
    const userHousehold = await Household.findOne({ userId: new mongoose.Types.ObjectId(USER_ID) });
    const otherHousehold = await Household.findOne({ userId: new mongoose.Types.ObjectId(OTHER_USER_ID) });

    await SavingPlan.create([
      {
        householdId: userHousehold._id,
        planType: "Advanced",
        householdSize: 3,
        totalWaterUsagePerDay: 60,
        priorityArea: "Bathroom",
        targetReductionPercentage: 20,
        waterSource: "Municipal",
        status: "Active",
      },
      {
        householdId: otherHousehold._id,
        planType: "Basic",
        householdSize: 4,
        totalWaterUsagePerDay: 90,
        priorityArea: "Garden",
        targetReductionPercentage: 10,
        waterSource: "Municipal",
        status: "Active",
      },
    ]);

    const res = await request(app)
      .get("/SavingPlan")
      .set("x-test-user-id", USER_ID)
      .set("x-test-role", "user");

    expect(res.status).toBe(200);
    expect(res.body.count).toBe(1);
    expect(Array.isArray(res.body.savingPlans)).toBe(true);
    expect(res.body.savingPlans[0].householdName).toBe("User Home");
  });

  it("GET /SavingPlan/admin returns all plans for admin", async () => {
    const userHousehold = await Household.findOne({ userId: new mongoose.Types.ObjectId(USER_ID) });
    const otherHousehold = await Household.findOne({ userId: new mongoose.Types.ObjectId(OTHER_USER_ID) });

    await SavingPlan.create([
      {
        householdId: userHousehold._id,
        planType: "Basic",
        householdSize: 3,
        totalWaterUsagePerDay: 60,
        priorityArea: "General",
        targetReductionPercentage: 10,
        waterSource: "Municipal",
      },
      {
        householdId: otherHousehold._id,
        planType: "Advanced",
        householdSize: 4,
        totalWaterUsagePerDay: 100,
        priorityArea: "Garden",
        targetReductionPercentage: 20,
        waterSource: "Municipal",
      },
    ]);

    const res = await request(app)
      .get("/SavingPlan/admin")
      .set("x-test-user-id", ADMIN_ID)
      .set("x-test-role", "admin");

    expect(res.status).toBe(200);
    expect(res.body.count).toBe(2);
  });

  it("GET /SavingPlan/admin returns 403 for non-admin user", async () => {
    const res = await request(app)
      .get("/SavingPlan/admin")
      .set("x-test-user-id", USER_ID)
      .set("x-test-role", "user");

    expect(res.status).toBe(403);
    expect(res.body.message).toBe("Access denied: insufficient permissions");
  });

  it("GET /SavingPlan/calculation returns computed saving values", async () => {
    const household = await Household.findOne({ userId: new mongoose.Types.ObjectId(USER_ID) });

    await SavingPlan.create({
      householdId: household._id,
      planType: "Custom",
      householdSize: 3,
      totalWaterUsagePerDay: 100,
      priorityArea: "Kitchen",
      customGoalPercentage: 25,
      targetReductionPercentage: 25,
      waterSource: "Municipal",
      status: "Active",
    });

    const res = await request(app)
      .get("/SavingPlan/calculation")
      .set("x-test-user-id", USER_ID)
      .set("x-test-role", "user");

    expect(res.status).toBe(200);
    expect(res.body.totalWaterUsagePerDay).toBe(100);
    expect(res.body.targetReductionPercentage).toBe(25);
    expect(res.body.waterToSaveLiters).toBe(25);
    expect(res.body.targetDailyUsage).toBe(75);
  });

  it("DELETE /SavingPlan/:id deletes an existing plan", async () => {
    const household = await Household.findOne({ userId: new mongoose.Types.ObjectId(USER_ID) });

    const plan = await SavingPlan.create({
      householdId: household._id,
      planType: "Basic",
      householdSize: 3,
      totalWaterUsagePerDay: 70,
      priorityArea: "Laundry",
      targetReductionPercentage: 10,
      waterSource: "Municipal",
      status: "Active",
    });

    const res = await request(app).delete(`/SavingPlan/${plan._id}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Saving plan successfully deleted");

    const deleted = await SavingPlan.findById(plan._id);
    expect(deleted).toBeNull();
  });
});
