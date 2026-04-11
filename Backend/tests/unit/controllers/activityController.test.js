const Activity = require("../../../models/Activity");
const mongoose = require("mongoose");
const sendEmail = require("../../../services/activityEmailService");
const getEmailTemplate = require("../../../services/activityEmailTemplate");
const activityController = require("../../../controllers/activityController");

jest.mock("../../../models/Activity", () => {
    const mockActivity = jest.fn();
    mockActivity.find = jest.fn();
    mockActivity.findById = jest.fn();
    mockActivity.findByIdAndUpdate = jest.fn();
    mockActivity.findByIdAndDelete = jest.fn();
    return mockActivity;
});

jest.mock("../../../services/activityEmailService", () => jest.fn());
jest.mock("../../../services/activityEmailTemplate", () => jest.fn());

function createMockRes() {
    return {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
    };
}

describe("activityController unit tests", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe("createActivity", () => {
        it("should return 400 if required fields are missing for admin", async () => {
            const req = {
                user: { role: "admin", id: "admin-id" },
                body: { activityType: "Repair" } // Missing other fields
            };
            const res = createMockRes();

            await activityController.createActivity(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                success: false,
                message: expect.stringContaining("Missing required fields")
            }));
        });

        it("should return 400 if scheduled date is in the past", async () => {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            
            const req = {
                user: { role: "admin", id: "admin-id" },
                body: {
                    activityType: "Repair",
                    scheduledDate: yesterday.toISOString().split('T')[0],
                    scheduledTime: "10:00",
                    location: "Sector 7",
                    assignedStaff: "John Doe",
                    staffEmail: "john@example.com"
                }
            };
            const res = createMockRes();

            await activityController.createActivity(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                success: false,
                message: "Cannot schedule an activity on a past date."
            }));
        });

        it("should create activity and send email for admin with staff assigned", async () => {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);

            const activityData = {
                activityType: "Repair",
                scheduledDate: tomorrow.toISOString().split('T')[0],
                scheduledTime: "10:00",
                location: "Sector 7",
                assignedStaff: "John Doe",
                staffEmail: "john@example.com",
                notes: "Ugent repair"
            };

            const req = {
                user: { role: "admin", id: "admin-id" },
                body: activityData
            };
            const res = createMockRes();

            const savedActivity = { ...activityData, _id: "activity-id" };
            Activity.prototype.save = jest.fn().mockResolvedValue(savedActivity);
            getEmailTemplate.mockReturnValue("<html>Email</html>");

            await activityController.createActivity(req, res);

            expect(Activity).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(201);
            expect(sendEmail).toHaveBeenCalledWith(
                "john@example.com",
                expect.any(String),
                expect.any(String),
                "<html>Email</html>"
            );
        });

        it("should create activity without email if staff not assigned (user reporting)", async () => {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);

            const activityData = {
                activityType: "Leakage",
                scheduledDate: tomorrow.toISOString().split('T')[0],
                scheduledTime: "14:00",
                location: "Main Street"
            };

            const req = {
                user: { role: "user", id: "user-id" },
                body: activityData
            };
            const res = createMockRes();

            const savedActivity = { ...activityData, _id: "activity-id", reportedBy: "user-id", isIssue: true };
            Activity.prototype.save = jest.fn().mockResolvedValue(savedActivity);

            await activityController.createActivity(req, res);

            expect(res.status).toHaveBeenCalledWith(201);
            expect(sendEmail).not.toHaveBeenCalled();
        });
    });

    describe("getActivities", () => {
        it("should fetch all activities", async () => {
            const activities = [{ _id: "1", activityType: "Repair" }];
            Activity.find.mockReturnValue({
                sort: jest.fn().mockResolvedValue(activities)
            });

            const req = {};
            const res = createMockRes();

            await activityController.getActivities(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                success: true,
                data: activities
            }));
        });
    });

    describe("getActivityById", () => {
        it("should return 400 for invalid ID", async () => {
            const req = { params: { id: "invalid-id" } };
            const res = createMockRes();

            await activityController.getActivityById(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
        });

        it("should return 404 if activity not found", async () => {
            const validId = "60d5f2f5f1d5f5f5f5f5f5f5";
            Activity.findById.mockResolvedValue(null);

            const req = { params: { id: validId } };
            const res = createMockRes();

            await activityController.getActivityById(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
        });

        it("should return activity for valid ID", async () => {
            const validId = "60d5f2f5f1d5f5f5f5f5f5f5";
            const activity = { _id: validId, activityType: "Repair" };
            Activity.findById.mockResolvedValue(activity);

            const req = { params: { id: validId } };
            const res = createMockRes();

            await activityController.getActivityById(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ data: activity }));
        });
    });

    describe("updateActivity", () => {
        it("should return 400 for invalid ID", async () => {
            const req = { params: { id: "invalid-id" }, body: {} };
            const res = createMockRes();

            await activityController.updateActivity(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
        });

        it("should update and send email if staff assigned", async () => {
            const validId = "60d5f2f5f1d5f5f5f5f5f5f5";
            const updateData = { status: "Completed" };
            const updatedActivity = { _id: validId, activityType: "Repair", staffEmail: "staff@example.com", ...updateData };
            
            Activity.findByIdAndUpdate.mockResolvedValue(updatedActivity);
            getEmailTemplate.mockReturnValue("<html>Update</html>");

            const req = { params: { id: validId }, body: updateData };
            const res = createMockRes();

            await activityController.updateActivity(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(sendEmail).toHaveBeenCalledWith(
                "staff@example.com",
                expect.any(String),
                expect.any(String),
                "<html>Update</html>"
            );
        });
    });

    describe("deleteActivity", () => {
        it("should delete activity and send cancellation email", async () => {
            const validId = "60d5f2f5f1d5f5f5f5f5f5f5";
            const deletedActivity = { _id: validId, activityType: "Repair", staffEmail: "staff@example.com" };
            
            Activity.findByIdAndDelete.mockResolvedValue(deletedActivity);
            getEmailTemplate.mockReturnValue("<html>Cancelled</html>");

            const req = { params: { id: validId } };
            const res = createMockRes();

            await activityController.deleteActivity(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(sendEmail).toHaveBeenCalledWith(
                "staff@example.com",
                expect.any(String),
                expect.any(String),
                "<html>Cancelled</html>"
            );
        });
    });
});
