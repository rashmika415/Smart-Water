const express = require("express");
const request = require("supertest");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");

const TEST_ADMIN_ID = "507f1f77bcf86cd799439011";
const TEST_USER_ID = "507f1f77bcf86cd799439022";

jest.mock("../../../middleware/authMiddleware", () => {
    return (req, _res, next) => {
        const role = req.headers["x-test-role"] || "admin";
        const id = role === "admin" ? TEST_ADMIN_ID : TEST_USER_ID;
        req.user = { id, role };
        next();
    };
});

jest.mock("../../../middleware/roleMiddleware", () => {
    return (...allowedRoles) => (req, res, next) => {
        if (allowedRoles.includes(req.user.role)) {
            next();
        } else {
            res.status(403).json({ success: false, message: "Forbidden" });
        }
    };
});

// Mock email service to prevent actual emails
jest.mock("../../../services/activityEmailService", () => jest.fn().mockResolvedValue({ success: true }));

const activityRoutes = require("../../../routes/activityRoutes");
const Activity = require("../../../models/Activity");

describe("Activity integration tests", () => {
    let mongod;
    let app;

    beforeAll(async () => {
        mongod = await MongoMemoryServer.create();
        await mongoose.connect(mongod.getUri());

        app = express();
        app.use(express.json());
        app.use("/activities", activityRoutes);
    });

    afterAll(async () => {
        await mongoose.connection.close();
        await mongod.stop();
    });

    beforeEach(async () => {
        await Activity.deleteMany({});
    });

    it("POST /activities creates an activity (Admin flow)", async () => {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);

        const response = await request(app)
            .post("/activities")
            .set("x-test-role", "admin")
            .send({
                activityType: "Maintenance",
                scheduledDate: tomorrow.toISOString().split('T')[0],
                scheduledTime: "09:00",
                location: "Pump Station A",
                assignedStaff: "Jane Smith",
                staffEmail: "jane@example.com"
            });

        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
        expect(response.body.data.activityType).toBe("Maintenance");
        expect(response.body.data.isIssue).toBe(false);
    });

    it("POST /activities creates an issue (User flow)", async () => {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);

        const response = await request(app)
            .post("/activities")
            .set("x-test-role", "user")
            .send({
                activityType: "Leakage",
                scheduledDate: tomorrow.toISOString().split('T')[0],
                scheduledTime: "11:00",
                location: "House 42"
            });

        expect(response.status).toBe(201);
        expect(response.body.data.isIssue).toBe(true);
        expect(response.body.data.reportedBy).toBe(TEST_USER_ID);
    });

    it("GET /activities returns all activities", async () => {
        await Activity.create({
            activityType: "Inspection",
            scheduledDate: "2026-12-01",
            scheduledTime: "10:00",
            location: "Reservoir"
        });

        const response = await request(app)
            .get("/activities")
            .set("x-test-role", "admin");

        expect(response.status).toBe(200);
        expect(response.body.data.length).toBe(1);
    });

    it("PUT /activities/:id updates activity (Admin only)", async () => {
        const activity = await Activity.create({
            activityType: "Repair",
            scheduledDate: "2026-12-01",
            scheduledTime: "10:00",
            location: "Valve 5",
            status: "Pending"
        });

        const response = await request(app)
            .put(`/activities/${activity._id}`)
            .set("x-test-role", "admin")
            .send({ status: "In-Progress" });

        expect(response.status).toBe(200);
        expect(response.body.data.status).toBe("In-Progress");

        // Test Forbidden for User
        const forbiddenRes = await request(app)
            .put(`/activities/${activity._id}`)
            .set("x-test-role", "user")
            .send({ status: "Completed" });

        expect(forbiddenRes.status).toBe(403);
    });

    it("DELETE /activities/:id removes activity (Admin only)", async () => {
        const activity = await Activity.create({
            activityType: "Cleanup",
            scheduledDate: "2026-12-01",
            scheduledTime: "10:00",
            location: "Site B"
        });

        const response = await request(app)
            .delete(`/activities/${activity._id}`)
            .set("x-test-role", "admin");

        expect(response.status).toBe(200);
        
        const found = await Activity.findById(activity._id);
        expect(found).toBeNull();
    });
});
