const express = require("express");
const request = require("supertest");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const bcrypt = require("bcryptjs");

const USER_ID = "507f1f77bcf86cd799439101";
const ADMIN_ID = "507f1f77bcf86cd799439102";
const OTHER_USER_ID = "507f1f77bcf86cd799439103";

jest.mock("../../../middleware/authMiddleware", () => {
  return (req, _res, next) => {
    req.user = {
      id: req.headers["x-test-user-id"] || USER_ID,
      role: req.headers["x-test-role"] || "user",
    };
    next();
  };
});

jest.mock("../../../middleware/roleMiddleware", () => {
  return (...allowedRoles) =>
    (req, res, next) => {
      if (!allowedRoles.includes(req.user.role)) {
        return res.status(403).json({ message: "Access denied: insufficient permissions" });
      }
      next();
    };
});

jest.mock("../../../utils/estimateUsage", () =>
  jest.fn(async () => ({
    monthlyLiters: 9000,
    monthlyUnits: 9,
    factor: 1.05,
    zone: "Intermediate",
    predictedBill: 450,
  }))
);

jest.mock("../../../utils/householdEmail", () => ({
  sendHouseholdEstimate: jest.fn(async () => ({ success: true, messageId: "test-message-id" })),
}));

jest.mock("../../../services/billRecommendationService", () => ({
  getBillRecommendationsForHousehold: jest.fn(async () => ({ recommendations: ["Test tip"] })),
}));

const householdRoutes = require("../../../routes/householdRoutes");
const zoneRoutes = require("../../../routes/zoneRoutes");
const Household = require("../../../models/householdModel");
const Zone = require("../../../models/zoneModel");
const User = require("../../../models/userModel");
const { sendHouseholdEstimate } = require("../../../utils/householdEmail");

describe("Household + Zone management integration tests", () => {
  let mongod;
  let app;

  beforeAll(async () => {
    jest.setTimeout(60000);
    mongod = await MongoMemoryServer.create();
    await mongoose.connect(mongod.getUri());

    app = express();
    app.use(express.json());
    app.use("/api/households", householdRoutes);
    app.use("/api/zones", zoneRoutes);
  });

  afterAll(async () => {
    await mongoose.connection.close();
    await mongod.stop();
  });

  beforeEach(async () => {
    jest.clearAllMocks();
    await User.deleteMany({});
    await Household.deleteMany({});
    await Zone.deleteMany({});

    const hash = await bcrypt.hash("password123", 10);
    await User.create([
      {
        _id: new mongoose.Types.ObjectId(USER_ID),
        name: "house-user",
        email: "houseuser@test.com",
        password: hash,
        role: "user",
      },
      {
        _id: new mongoose.Types.ObjectId(ADMIN_ID),
        name: "house-admin",
        email: "houseadmin@test.com",
        password: hash,
        role: "admin",
      },
      {
        _id: new mongoose.Types.ObjectId(OTHER_USER_ID),
        name: "other-user",
        email: "other@test.com",
        password: hash,
        role: "user",
      },
    ]);
  });

  it("POST /api/households creates household and triggers email", async () => {
    const res = await request(app)
      .post("/api/households")
      .set("x-test-user-id", USER_ID)
      .set("x-test-role", "user")
      .send({
        name: "Home One",
        numberOfResidents: 3,
        propertyType: "house",
        location: { city: "Colombo", state: "Western", country: "Sri Lanka" },
      });

    expect(res.status).toBe(201);
    expect(res.body.name).toBe("Home One");
    expect(res.body.climateZone).toBe("Intermediate");
    expect(sendHouseholdEstimate).toHaveBeenCalledTimes(1);
  });

  it("GET /api/households/my-households returns only logged-in user's households", async () => {
    await Household.create([
      {
        name: "Mine",
        numberOfResidents: 2,
        propertyType: "house",
        location: { city: "Kandy", state: "Central", country: "Sri Lanka" },
        userId: new mongoose.Types.ObjectId(USER_ID),
      },
      {
        name: "Not Mine",
        numberOfResidents: 4,
        propertyType: "apartment",
        location: { city: "Galle", state: "Southern", country: "Sri Lanka" },
        userId: new mongoose.Types.ObjectId(OTHER_USER_ID),
      },
    ]);

    const res = await request(app)
      .get("/api/households/my-households")
      .set("x-test-user-id", USER_ID)
      .set("x-test-role", "user");

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(1);
    expect(res.body[0].name).toBe("Mine");
  });

  it("POST /api/households/:id/zones creates a zone for owned household", async () => {
    const household = await Household.create({
      name: "Zone Home",
      numberOfResidents: 2,
      propertyType: "house",
      location: { city: "Colombo", state: "Western", country: "Sri Lanka" },
      userId: new mongoose.Types.ObjectId(USER_ID),
    });

    const res = await request(app)
      .post(`/api/households/${household._id}/zones`)
      .set("x-test-user-id", USER_ID)
      .set("x-test-role", "user")
      .send({ zoneName: "Kitchen", notes: "Main kitchen zone" });

    expect(res.status).toBe(201);
    expect(res.body.zoneName).toBe("Kitchen");

    const savedHousehold = await Household.findById(household._id);
    expect(savedHousehold.zones.length).toBe(1);
  });

  it("GET /api/households/:id/zones returns zones for owned household", async () => {
    const household = await Household.create({
      name: "Zone List Home",
      numberOfResidents: 2,
      propertyType: "house",
      location: { city: "Colombo", state: "Western", country: "Sri Lanka" },
      userId: new mongoose.Types.ObjectId(USER_ID),
    });
    await Zone.create({ householdId: household._id, zoneName: "Bathroom", notes: "Upstairs" });

    const res = await request(app)
      .get(`/api/households/${household._id}/zones`)
      .set("x-test-user-id", USER_ID)
      .set("x-test-role", "user");

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0].zoneName).toBe("Bathroom");
  });

  it("PUT /api/zones/:zoneId updates a zone", async () => {
    const household = await Household.create({
      name: "Update Zone Home",
      numberOfResidents: 3,
      propertyType: "house",
      location: { city: "Colombo", state: "Western", country: "Sri Lanka" },
      userId: new mongoose.Types.ObjectId(USER_ID),
    });
    const zone = await Zone.create({ householdId: household._id, zoneName: "Garden", notes: "Backyard" });

    const res = await request(app)
      .put(`/api/zones/${zone._id}`)
      .set("x-test-user-id", USER_ID)
      .set("x-test-role", "user")
      .send({ zoneName: "Front Garden", notes: "Updated notes" });

    expect(res.status).toBe(200);
    expect(res.body.zoneName).toBe("Front Garden");
  });

  it("DELETE /api/zones/:zoneId deletes a zone", async () => {
    const household = await Household.create({
      name: "Delete Zone Home",
      numberOfResidents: 3,
      propertyType: "house",
      location: { city: "Colombo", state: "Western", country: "Sri Lanka" },
      userId: new mongoose.Types.ObjectId(USER_ID),
    });
    const zone = await Zone.create({ householdId: household._id, zoneName: "Laundry", notes: "Test delete" });

    const res = await request(app)
      .delete(`/api/zones/${zone._id}`)
      .set("x-test-user-id", USER_ID)
      .set("x-test-role", "user");

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Zone deleted");
    const deleted = await Zone.findById(zone._id);
    expect(deleted).toBeNull();
  });

  it("GET /api/households/all-with-zones returns full system view for admin", async () => {
    const household = await Household.create({
      name: "Admin View Home",
      numberOfResidents: 2,
      propertyType: "house",
      location: { city: "Colombo", state: "Western", country: "Sri Lanka" },
      userId: new mongoose.Types.ObjectId(USER_ID),
    });
    await Zone.create({ householdId: household._id, zoneName: "Kitchen", notes: "Admin test" });

    const res = await request(app)
      .get("/api/households/all-with-zones")
      .set("x-test-user-id", ADMIN_ID)
      .set("x-test-role", "admin");

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
    expect(res.body[0]).toHaveProperty("household");
    expect(res.body[0]).toHaveProperty("zones");
  });

  it("returns 403 when non-owner tries to create zone in someone else's household", async () => {
    const household = await Household.create({
      name: "Private Home",
      numberOfResidents: 2,
      propertyType: "house",
      location: { city: "Colombo", state: "Western", country: "Sri Lanka" },
      userId: new mongoose.Types.ObjectId(USER_ID),
    });

    const res = await request(app)
      .post(`/api/households/${household._id}/zones`)
      .set("x-test-user-id", OTHER_USER_ID)
      .set("x-test-role", "user")
      .send({ zoneName: "Kitchen" });

    expect(res.status).toBe(403);
  });
});

