const {
  buildUsageFilter,
  getPaginationParams,
  getSortParams,
} = require("../../../utils/usageHelpers");

describe("usageHelpers", () => {
  describe("buildUsageFilter", () => {
    it("builds the default filter with household and non-deleted records", () => {
      const filter = buildUsageFilter({}, "household-1");

      expect(filter).toEqual({
        householdId: "household-1",
        deletedAt: null,
      });
    });

    it("adds activity type and valid source filters", () => {
      const filter = buildUsageFilter(
        { activityType: "shower", source: "manual" },
        "household-2"
      );

      expect(filter.activityType).toBe("shower");
      expect(filter.source).toBe("manual");
    });

    it("ignores unsupported source values", () => {
      const filter = buildUsageFilter({ source: "unknown" }, "household-3");

      expect(filter.source).toBeUndefined();
    });

    it("adds valid date range and normalizes end date to end-of-day", () => {
      const filter = buildUsageFilter(
        { startDate: "2026-01-01", endDate: "2026-01-15" },
        "household-4"
      );

      expect(filter.occurredAt.$gte).toEqual(new Date("2026-01-01"));
      expect(filter.occurredAt.$lte.getHours()).toBe(23);
      expect(filter.occurredAt.$lte.getMinutes()).toBe(59);
      expect(filter.occurredAt.$lte.getSeconds()).toBe(59);
      expect(filter.occurredAt.$lte.getMilliseconds()).toBe(999);
    });

    it("does not set invalid dates", () => {
      const filter = buildUsageFilter(
        { startDate: "not-a-date", endDate: "invalid" },
        "household-5"
      );

      expect(filter.occurredAt).toEqual({});
    });
  });

  describe("getPaginationParams", () => {
    it("returns defaults when query is empty", () => {
      expect(getPaginationParams({})).toEqual({ page: 1, limit: 20, skip: 0 });
    });

    it("applies page and limit with max cap of 100", () => {
      expect(getPaginationParams({ page: "3", limit: "200" })).toEqual({
        page: 3,
        limit: 100,
        skip: 200,
      });
    });
  });

  describe("getSortParams", () => {
    it("returns default sort when missing", () => {
      expect(getSortParams()).toEqual({ occurredAt: -1 });
    });

    it("parses descending sort", () => {
      expect(getSortParams("-liters")).toEqual({ liters: -1 });
    });

    it("falls back to default for unsupported sort field", () => {
      expect(getSortParams("-unknownField")).toEqual({ occurredAt: -1 });
    });
  });
});
