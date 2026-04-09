const MockZone = jest.fn();
MockZone.find = jest.fn();
MockZone.findById = jest.fn();
MockZone.findByIdAndUpdate = jest.fn();
MockZone.findByIdAndDelete = jest.fn();

jest.mock("../../../models/zoneModel", () => MockZone);
jest.mock("../../../models/householdModel", () => ({
  findById: jest.fn(),
}));

const Zone = require("../../../models/zoneModel");
const Household = require("../../../models/householdModel");
const zoneController = require("../../../controllers/zoneController");

function createMockRes() {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };
}

describe("zoneController unit", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("createZone", () => {
    it("returns 404 when household does not exist", async () => {
      Household.findById.mockResolvedValue(null);

      const req = { params: { id: "h1" }, user: { id: "u1", role: "user" }, body: { zoneName: "Kitchen" } };
      const res = createMockRes();
      await zoneController.createZone(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: "Household not found" });
    });

    it("creates zone for owner and links to household", async () => {
      const household = {
        _id: "h1",
        userId: { toString: () => "u1" },
        zones: [],
        save: jest.fn().mockResolvedValue(),
      };
      Household.findById.mockResolvedValue(household);

      const saveZone = jest.fn().mockResolvedValue();
      Zone.mockImplementation((data) => ({
        ...data,
        _id: "z1",
        save: saveZone,
      }));

      const req = {
        params: { id: "h1" },
        user: { id: "u1", role: "user" },
        body: { zoneName: "Kitchen", notes: "Main area" },
      };
      const res = createMockRes();
      await zoneController.createZone(req, res);

      expect(saveZone).toHaveBeenCalled();
      expect(household.zones).toEqual(["z1"]);
      expect(household.save).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
    });
  });

  describe("getZonesByHousehold", () => {
    it("returns 403 when non-owner (non-admin) requests zones", async () => {
      Household.findById.mockResolvedValue({
        _id: "h1",
        userId: { toString: () => "owner-id" },
      });

      const req = { params: { id: "h1" }, user: { id: "other-id", role: "user" } };
      const res = createMockRes();
      await zoneController.getZonesByHousehold(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ message: "Access denied" });
    });
  });

  describe("deleteZone", () => {
    it("deletes zone when owner is authorized", async () => {
      Zone.findById.mockResolvedValue({
        _id: "z1",
        householdId: "h1",
      });
      Household.findById.mockResolvedValue({
        _id: "h1",
        userId: { toString: () => "u1" },
      });
      Zone.findByIdAndDelete.mockResolvedValue({ _id: "z1" });

      const req = { params: { zoneId: "z1" }, user: { id: "u1", role: "user" } };
      const res = createMockRes();
      await zoneController.deleteZone(req, res);

      expect(Zone.findByIdAndDelete).toHaveBeenCalledWith("z1");
      expect(res.json).toHaveBeenCalledWith({ message: "Zone deleted" });
    });
  });
});

