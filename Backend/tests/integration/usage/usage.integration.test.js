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

const usageRoutes = require("../../../routes/usageRoute");
const Household = require("../../../models/householdModel");
const Usage = require("../../../models/UsageModel");

describe("Usage integration tests", () => {
  let mongod;
  let app;

  beforeAll(async () => {
    jest.setTimeout(60000);

    mongod = await MongoMemoryServer.create();
    await mongoose.connect(mongod.getUri());

    app = express();
    app.use(express.json());
    app.use("/usage", usageRoutes);
  });

  afterAll(async () => {
    await mongoose.connection.close();
    await mongod.stop();
  });

  beforeEach(async () => {
    await Household.deleteMany({});
    await Usage.deleteMany({});

    await Household.create({
      name: "Test Household",
      location: {
        city: "Colombo",
        state: "Western",
        country: "Sri Lanka",
      },
      numberOfResidents: 3,
      propertyType: "house",
      userId: new mongoose.Types.ObjectId(TEST_USER_ID),
    });
  });

  it("POST /usage creates a usage record", async () => {
    const response = await request(app).post("/usage").send({
      activityType: "shower",
      liters: 50,
      notes: "integration test",
    });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data.activityType).toBe("shower");
  });

  it("POST /usage returns 400 for invalid body", async () => {
    const response = await request(app).post("/usage").send({
      liters: 25,
    });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });

  it("GET /usage returns records for authenticated user", async () => {
    await request(app).post("/usage").send({
      activityType: "dishwashing",
      liters: 30,
    });

    const response = await request(app).get("/usage");

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(Array.isArray(response.body.data)).toBe(true);
    expect(response.body.count).toBeGreaterThan(0);
  });

  it("GET /usage/:id returns a single record", async () => {
    const created = await request(app).post("/usage").send({
      activityType: "laundry",
      liters: 40,
    });

    const usageId = created.body.data._id;
    const response = await request(app).get(`/usage/${usageId}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data._id).toBe(usageId);
  });

  it("GET /usage/:id returns 400 for invalid object id", async () => {
    const response = await request(app).get("/usage/invalid-id");

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });

  it("PUT /usage/:id updates a record", async () => {
    const created = await request(app).post("/usage").send({
      activityType: "shower",
      durationMinutes: 10,
      flowRateLpm: 5,
    });

    const usageId = created.body.data._id;
    const response = await request(app).put(`/usage/${usageId}`).send({
      durationMinutes: 12,
      flowRateLpm: 5,
    });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.liters).toBe(60);
  });

  it("DELETE /usage/:id soft deletes a record", async () => {
    const created = await request(app).post("/usage").send({
      activityType: "bath",
      liters: 70,
    });

    const usageId = created.body.data._id;

    const deleteResponse = await request(app).delete(`/usage/${usageId}`);
    expect(deleteResponse.status).toBe(200);
    expect(deleteResponse.body.success).toBe(true);

    const getResponse = await request(app).get(`/usage/${usageId}`);
    expect(getResponse.status).toBe(404);
  });

  it("GET /usage/carbon-stats returns household carbon statistics", async () => {
    await request(app).post("/usage").send({
      activityType: "shower",
      liters: 50,
    });

    const response = await request(app).get("/usage/carbon-stats");

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty("current");
    expect(response.body.data).toHaveProperty("comparison");
  });

  it("GET /usage/carbon-by-activity returns grouped data", async () => {
    await request(app).post("/usage").send({
      activityType: "shower",
      liters: 60,
    });
    await request(app).post("/usage").send({
      activityType: "dishwashing",
      liters: 20,
    });

    const response = await request(app).get("/usage/carbon-by-activity");

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty("breakdown");
    expect(Array.isArray(response.body.data.breakdown)).toBe(true);
  });

  it("GET /usage/carbon-leaderboard returns ranked households", async () => {
    await request(app).post("/usage").send({
      activityType: "shower",
      liters: 45,
    });

    const response = await request(app).get("/usage/carbon-leaderboard");

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty("leaderboard");
    expect(Array.isArray(response.body.data.leaderboard)).toBe(true);
  });

  it("GET /usage/carbon-trend returns daily trend data", async () => {
    await request(app).post("/usage").send({
      activityType: "shower",
      liters: 35,
    });

    const response = await request(app).get("/usage/carbon-trend?days=7");

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty("trend");
    expect(Array.isArray(response.body.data.trend)).toBe(true);
  });

  it("returns 404 for user without a household", async () => {
    const response = await request(app)
      .post("/usage")
      .set("x-test-user-id", "507f1f77bcf86cd799439099")
      .send({
        activityType: "shower",
        liters: 25,
      });

    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
  });
});
