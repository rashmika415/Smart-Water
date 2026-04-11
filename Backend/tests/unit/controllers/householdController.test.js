const MockHousehold = jest.fn();
MockHousehold.find = jest.fn();
MockHousehold.findById = jest.fn();
MockHousehold.findByIdAndDelete = jest.fn();
MockHousehold.countDocuments = jest.fn();

jest.mock("../../../models/householdModel", () => MockHousehold);
jest.mock("../../../models/zoneModel", () => ({
  deleteMany: jest.fn(),
  find: jest.fn(),
}));
jest.mock("../../../models/userModel", () => ({
  findById: jest.fn(),
}));
jest.mock("../../../utils/estimateUsage", () => jest.fn());
jest.mock("../../../utils/householdEmail", () => ({
  sendHouseholdEstimate: jest.fn(),
}));

const Household = require("../../../models/householdModel");
const Zone = require("../../../models/zoneModel");
const User = require("../../../models/userModel");
const estimateUsage = require("../../../utils/estimateUsage");
const { sendHouseholdEstimate } = require("../../../utils/householdEmail");
const householdController = require("../../../controllers/householdController");

function createMockRes() {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };
}

describe("householdController unit", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("createHousehold", () => {
    it("returns 400 when household name is missing", async () => {
      const req = {
        user: { id: "u1", role: "user" },
        body: {
          numberOfResidents: 3,
          propertyType: "house",
          location: { city: "Colombo" },
        },
      };
      const res = createMockRes();

      await householdController.createHousehold(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: "Household name required" });
    });

    it("creates household and sends estimate email", async () => {
      estimateUsage.mockResolvedValue({
        monthlyLiters: 9000,
        monthlyUnits: 9,
        zone: "Intermediate",
      });

      const saveMock = jest.fn().mockResolvedValue();
      Household.mockImplementation((data) => ({
        ...data,
        _id: "house-1",
        save: saveMock,
      }));

      User.findById.mockResolvedValue({ _id: "u1", email: "user@test.com" });
      sendHouseholdEstimate.mockResolvedValue({ success: true, messageId: "mid-1" });

      const req = {
        user: { id: "u1", role: "user" },
        body: {
          name: "My Home",
          numberOfResidents: 3,
          propertyType: "house",
          location: { city: "Colombo", state: "Western", country: "Sri Lanka" },
        },
      };
      const res = createMockRes();

      await householdController.createHousehold(req, res);

      expect(saveMock).toHaveBeenCalled();
      expect(sendHouseholdEstimate).toHaveBeenCalledWith(
        "user@test.com",
        expect.objectContaining({ name: "My Home" })
      );
      expect(res.status).toHaveBeenCalledWith(201);
    });
  });

  describe("getMyHouseholds", () => {
    it("returns households for logged-in user", async () => {
      const items = [{ _id: "h1", name: "My Home" }];
      Household.find.mockResolvedValue(items);

      const req = { user: { id: "u1" } };
      const res = createMockRes();
      await householdController.getMyHouseholds(req, res);

      expect(Household.find).toHaveBeenCalledWith({ userId: "u1" });
      expect(res.json).toHaveBeenCalledWith(items);
    });
  });

  describe("deleteHousehold", () => {
    it("returns 403 when non-owner user tries deleting household", async () => {
      Household.findById.mockResolvedValue({
        _id: "h1",
        userId: { toString: () => "owner-user" },
      });

      const req = { user: { id: "other-user", role: "user" }, params: { id: "507f1f77bcf86cd799439011" } };
      const res = createMockRes();
      await householdController.deleteHousehold(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ message: "Access denied" });
      expect(Household.findByIdAndDelete).not.toHaveBeenCalled();
      expect(Zone.deleteMany).not.toHaveBeenCalled();
    });
  });
});

