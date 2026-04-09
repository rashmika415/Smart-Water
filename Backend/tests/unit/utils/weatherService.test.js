jest.mock("axios", () => ({
  get: jest.fn(),
}));

const axios = require("axios");
process.env.WEATHER_API_KEY = "test-key";
const getClimateFactor = require("../../../utils/weatherService");

describe("weatherService utility", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns wet zone for Colombo-like coordinates", async () => {
    axios.get.mockResolvedValue({
      data: {
        coord: { lat: 6.9, lon: 79.85 },
        main: { temp: 31 },
        rain: { "1h": 0 },
      },
    });

    const result = await getClimateFactor("Colombo");

    expect(result.zone).toBe("Wet");
    expect(result.factor).toBeGreaterThanOrEqual(0.75);
    expect(result.factor).toBeLessThanOrEqual(1.3);
  });

  it("falls back safely when API fails", async () => {
    axios.get.mockRejectedValue(new Error("network down"));

    const result = await getClimateFactor("Jaffna");

    expect(result).toEqual({ factor: 1, zone: "Intermediate" });
  });
});

