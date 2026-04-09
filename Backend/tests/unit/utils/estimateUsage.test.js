jest.mock("../../../utils/weatherService", () => jest.fn());

const estimateUsage = require("../../../utils/estimateUsage");
const getClimateFactor = require("../../../utils/weatherService");

describe("estimateUsage utility", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("calculates monthly usage using returned climate factor", async () => {
    getClimateFactor.mockResolvedValue({ factor: 1.2, zone: "Dry" });

    const result = await estimateUsage({
      numberOfPeople: 3,
      location: "Anuradhapura",
    });

    // baseline = 3 * 120 * 30 = 10800, climate adjusted = 12960
    expect(result.monthlyLiters).toBe(12960);
    expect(result.monthlyUnits).toBe(12.96);
    expect(result.climateFactor).toBe(1.2);
    expect(result.zone).toBe("Dry");
    expect(result.predictedBill).toBe(648); // 12.96 * 50
  });

  it("uses safe defaults when climate utility returns invalid values", async () => {
    getClimateFactor.mockResolvedValue({ factor: null, zone: null });

    const result = await estimateUsage({
      numberOfPeople: 2,
      location: "Colombo",
    });

    expect(result.climateFactor).toBe(1);
    expect(result.zone).toBe("Intermediate");
    expect(result.monthlyLiters).toBe(7200);
    expect(result.monthlyUnits).toBe(7.2);
  });
});

