const express = require("express");
const request = require("supertest");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const bcrypt = require("bcryptjs");

const ADMIN_ID = "507f1f77bcf86cd799439001";
const USER_ID = "507f1f77bcf86cd799439002";

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

const userRoutes = require("../../../routes/userRoutes");
const User = require("../../../models/userModel");

describe("User management integration tests", () => {
  let mongod;
  let app;

  beforeAll(async () => {
    jest.setTimeout(60000);
    mongod = await MongoMemoryServer.create();
    await mongoose.connect(mongod.getUri());

    app = express();
    app.use(express.json());
    app.use("/api/users", userRoutes);
  });

  afterAll(async () => {
    await mongoose.connection.close();
    await mongod.stop();
  });

  beforeEach(async () => {
    await User.deleteMany({});
    const hash = await bcrypt.hash("password123", 10);
    await User.create([
      {
        _id: new mongoose.Types.ObjectId(ADMIN_ID),
        name: "admin-user",
        email: "admin@test.com",
        password: hash,
        role: "admin",
      },
      {
        _id: new mongoose.Types.ObjectId(USER_ID),
        name: "normal-user",
        email: "user@test.com",
        password: hash,
        role: "user",
      },
    ]);
  });

  it("GET /api/users/profile returns logged-in user profile", async () => {
    const res = await request(app)
      .get("/api/users/profile")
      .set("x-test-user-id", USER_ID)
      .set("x-test-role", "user");

    expect(res.status).toBe(200);
    expect(res.body.email).toBe("user@test.com");
    expect(res.body.password).toBeUndefined();
  });

  it("GET /api/users returns all users for admin", async () => {
    const res = await request(app)
      .get("/api/users")
      .set("x-test-user-id", ADMIN_ID)
      .set("x-test-role", "admin");

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(2);
  });

  it("PUT /api/users/:id updates user profile", async () => {
    const res = await request(app)
      .put(`/api/users/${USER_ID}`)
      .set("x-test-user-id", USER_ID)
      .set("x-test-role", "user")
      .send({
        name: "updated-user",
        email: "updated@test.com",
        password: "newpass123",
      });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("User updated successfully");
    expect(res.body.user.name).toBe("updated-user");
    expect(res.body.user.email).toBe("updated@test.com");
  });

  it("DELETE /api/users/:id deletes user for admin", async () => {
    const res = await request(app)
      .delete(`/api/users/${USER_ID}`)
      .set("x-test-user-id", ADMIN_ID)
      .set("x-test-role", "admin");

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("User deleted successfully");

    const userAfterDelete = await User.findById(USER_ID);
    expect(userAfterDelete).toBeNull();
  });

  it("returns 403 when normal user tries admin-only endpoint", async () => {
    const res = await request(app)
      .get("/api/users")
      .set("x-test-user-id", USER_ID)
      .set("x-test-role", "user");

    expect(res.status).toBe(403);
  });
});

