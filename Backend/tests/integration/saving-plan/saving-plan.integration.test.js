const express = require("express");
const request = require("supertest");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");

const TEST_USER_ID = "507f1f77bcf86cd799439011";

jest.mock("../../../middleware/authMiddleware", () => {
  return (req, _res, next) => {
    req.user = {
      id: req.headers["x-test-user-id"] || TEST_USER_ID,
    };
    next();
  };
});

const savingPlanRoutes = require("../../../routes/SavingPlanRoute");
const Household = require("../../../models/householdModel");
const SavingPlan = require("../../../models/SavingPlanModel");
const Usage = require("../../../models/UsageModel");

describe("Saving Plan integration tests", () => {
  let mongod;
  let app;

  beforeAll(async () => {
    jest.setTimeout(60000);

    mongod = await MongoMemoryServer.create();
    await mongoose.connect(mongod.getUri());

    app = express();
    app.use(express.json());
    app.use("/saving-plan", savingPlanRoutes);
  });

  afterAll(async () => {
    await mongoose.connection.close();
    await mongod.stop();
  });

  beforeEach(async () => {
    await Household.deleteMany({});
    await SavingPlan.deleteMany({});
    await Usage.deleteMany({});

    await Household.create({
      name: "Test Household",
      location: {
        city: "Colombo",
        state: "Western",
        country: "Sri Lanka",
      },
      userId: TEST_USER_ID,
      propertyType: "apartment",
      numberOfResidents: 4,
    });
  });

  describe("POST /saving-plan", () => {
    it("should create a new saving plan", async () => {
      // Create some usage data first
      const household = await Household.findOne({ userId: TEST_USER_ID });
      await Usage.create({
        householdId: household._id,
        activityType: "shower",
        liters: 50,
        occurredAt: new Date(),
      });

      const response = await request(app)
        .post("/saving-plan")
        .set("x-test-user-id", TEST_USER_ID)
        .send({
          planType: "Basic",
          householdSize: 4,
          priorityArea: "Bathroom",
          waterSource: "Municipal",
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.planType).toBe("Basic");
      expect(response.body.data.targetReductionPercentage).toBe(10);
    });

    it("should reject duplicate active plans", async () => {
      // Create some usage data first
      const household = await Household.findOne({ userId: TEST_USER_ID });
      await Usage.create({
        householdId: household._id,
        activityType: "shower",
        liters: 50,
        occurredAt: new Date(),
      });

      // Create first plan
      await request(app)
        .post("/saving-plan")
        .set("x-test-user-id", TEST_USER_ID)
        .send({
          planType: "Basic",
          householdSize: 4,
          priorityArea: "Bathroom",
          waterSource: "Municipal",
        });

      // Try to create second plan
      const response = await request(app)
        .post("/saving-plan")
        .set("x-test-user-id", TEST_USER_ID)
        .send({
          planType: "Advanced",
          householdSize: 4,
          priorityArea: "Kitchen",
          waterSource: "Municipal",
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain("active saving plan already exists");
    });

    it("should create custom plan with custom percentage", async () => {
      // Create some usage data first
      const household = await Household.findOne({ userId: TEST_USER_ID });
      await Usage.create({
        householdId: household._id,
        activityType: "shower",
        liters: 50,
        occurredAt: new Date(),
      });

      const response = await request(app)
        .post("/saving-plan")
        .set("x-test-user-id", TEST_USER_ID)
        .send({
          planType: "Custom",
          householdSize: 4,
          priorityArea: "Bathroom",
          waterSource: "Municipal",
          customGoalPercentage: 25,
        });

      expect(response.status).toBe(201);
      expect(response.body.data.planType).toBe("Custom");
      expect(response.body.data.targetReductionPercentage).toBe(25);
      expect(response.body.data.customGoalPercentage).toBe(25);
    });
  });

  describe("GET /saving-plan", () => {
    it("should return user's saving plans", async () => {
      // Create some usage data first
      const household = await Household.findOne({ userId: TEST_USER_ID });
      await Usage.create({
        householdId: household._id,
        activityType: "shower",
        liters: 50,
        occurredAt: new Date(),
      });

      // Create a plan
      await request(app)
        .post("/saving-plan")
        .set("x-test-user-id", TEST_USER_ID)
        .send({
          planType: "Basic",
          householdSize: 4,
          priorityArea: "Bathroom",
          waterSource: "Municipal",
        });

      const response = await request(app)
        .get("/saving-plan")
        .set("x-test-user-id", TEST_USER_ID);

      expect(response.status).toBe(200);
      expect(response.body.savingPlans).toHaveLength(1);
      expect(response.body.savingPlans[0].planType).toBe("Basic");
    });

    it("should return empty array when no plans exist", async () => {
      const response = await request(app)
        .get("/saving-plan")
        .set("x-test-user-id", TEST_USER_ID);

      expect(response.status).toBe(200);
      expect(response.body.savingPlans).toHaveLength(0);
      expect(response.body.count).toBe(0);
    });
  });

  describe("GET /saving-plan/:id", () => {
    it("should return a specific saving plan", async () => {
      // Create some usage data first
      const household = await Household.findOne({ userId: TEST_USER_ID });
      await Usage.create({
        householdId: household._id,
        activityType: "shower",
        liters: 50,
        occurredAt: new Date(),
      });

      // Create a plan
      const createResponse = await request(app)
        .post("/saving-plan")
        .set("x-test-user-id", TEST_USER_ID)
        .send({
          planType: "Basic",
          householdSize: 4,
          priorityArea: "Bathroom",
          waterSource: "Municipal",
        });

      const planId = createResponse.body.data._id;

      const response = await request(app)
        .get(`/saving-plan/${planId}`)
        .set("x-test-user-id", TEST_USER_ID);

      expect(response.status).toBe(200);
      expect(response.body.savingPlan._id).toBe(planId);
      expect(response.body.savingPlan.planType).toBe("Basic");
    });

    it("should return 404 for non-existent plan", async () => {
      const response = await request(app)
        .get("/saving-plan/507f1f77bcf86cd799439012")
        .set("x-test-user-id", TEST_USER_ID);

      expect(response.status).toBe(404);
      expect(response.body.message).toBe("No saving plan found");
    });
  });

  describe("PUT /saving-plan/:id", () => {
    it("should update a saving plan", async () => {
      // Create some usage data first
      const household = await Household.findOne({ userId: TEST_USER_ID });
      await Usage.create({
        householdId: household._id,
        activityType: "shower",
        liters: 50,
        occurredAt: new Date(),
      });

      // Create a plan
      const createResponse = await request(app)
        .post("/saving-plan")
        .set("x-test-user-id", TEST_USER_ID)
        .send({
          planType: "Basic",
          householdSize: 4,
          priorityArea: "Bathroom",
          waterSource: "Municipal",
        });

      const planId = createResponse.body.data._id;

      const response = await request(app)
        .put(`/saving-plan/${planId}`)
        .set("x-test-user-id", TEST_USER_ID)
        .send({
          status: "Completed",
          priorityArea: "Kitchen",
        });

      expect(response.status).toBe(200);
      expect(response.body.savingPlan.status).toBe("Completed");
      expect(response.body.savingPlan.priorityArea).toBe("Kitchen");
    });
  });

  describe("DELETE /saving-plan/:id", () => {
    it("should delete a saving plan", async () => {
      // Create some usage data first
      const household = await Household.findOne({ userId: TEST_USER_ID });
      await Usage.create({
        householdId: household._id,
        activityType: "shower",
        liters: 50,
        occurredAt: new Date(),
      });

      // Create a plan
      const createResponse = await request(app)
        .post("/saving-plan")
        .set("x-test-user-id", TEST_USER_ID)
        .send({
          planType: "Basic",
          householdSize: 4,
          priorityArea: "Bathroom",
          waterSource: "Municipal",
        });

      const planId = createResponse.body.data._id;

      const deleteResponse = await request(app)
        .delete(`/saving-plan/${planId}`)
        .set("x-test-user-id", TEST_USER_ID);

      expect(deleteResponse.status).toBe(200);
      expect(deleteResponse.body.message).toBe("Saving plan successfully deleted");

      // Verify it's deleted
      const getResponse = await request(app)
        .get(`/saving-plan/${planId}`)
        .set("x-test-user-id", TEST_USER_ID);

      expect(getResponse.status).toBe(404);
    });
  });

  describe("GET /saving-plan/calculation", () => {
    it("should return saving calculation for user's household", async () => {
      // Create some usage data first
      const household = await Household.findOne({ userId: TEST_USER_ID });
      await Usage.create({
        householdId: household._id,
        activityType: "shower",
        liters: 50,
        occurredAt: new Date(),
      });

      // Create a plan
      await request(app)
        .post("/saving-plan")
        .set("x-test-user-id", TEST_USER_ID)
        .send({
          planType: "Basic",
          householdSize: 4,
          priorityArea: "Bathroom",
          waterSource: "Municipal",
        });

      const response = await request(app)
        .get("/saving-plan/calculation")
        .set("x-test-user-id", TEST_USER_ID);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("dailySavingsLiters");
      expect(response.body).toHaveProperty("monthlySavingsLiters");
      expect(response.body).toHaveProperty("yearlySavingsLiters");
    });
  });
});