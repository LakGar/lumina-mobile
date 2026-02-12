import {
  addDays,
  formatEntryListTime,
  formatTime,
  formatYYYYMMDD,
  isToday,
  startOfWeek,
} from "../../utils/date";

describe("date utils", () => {
  describe("formatYYYYMMDD", () => {
    it("returns YYYY-MM-DD", () => {
      const d = new Date(2025, 1, 3);
      expect(formatYYYYMMDD(d)).toBe("2025-02-03");
    });

    it("pads month and day", () => {
      const d = new Date(2025, 0, 5);
      expect(formatYYYYMMDD(d)).toBe("2025-01-05");
    });
  });

  describe("addDays", () => {
    it("adds n days correctly", () => {
      const d = new Date(2025, 1, 3);
      const next = addDays(d, 2);
      expect(formatYYYYMMDD(next)).toBe("2025-02-05");
    });

    it("subtracts when n is negative", () => {
      const d = new Date(2025, 1, 5);
      const prev = addDays(d, -2);
      expect(formatYYYYMMDD(prev)).toBe("2025-02-03");
    });
  });

  describe("startOfWeek", () => {
    it("returns Monday when mondayStart true", () => {
      const wed = new Date(2025, 1, 5);
      const start = startOfWeek(wed, true);
      expect(start.getDay()).toBe(1);
      expect(formatYYYYMMDD(start)).toBe("2025-02-03");
    });
  });

  describe("isToday", () => {
    it("returns true only for today", () => {
      const today = new Date();
      expect(isToday(today)).toBe(true);
      expect(isToday(addDays(today, 1))).toBe(false);
      expect(isToday(addDays(today, -1))).toBe(false);
    });
  });

  describe("formatTime", () => {
    it("returns 12h AM/PM format", () => {
      const noon = new Date(2025, 0, 1, 12, 30);
      expect(formatTime(noon)).toBe("12:30 PM");
      const morning = new Date(2025, 0, 1, 9, 5);
      expect(formatTime(morning)).toBe("9:05 AM");
    });
  });

  describe("formatEntryListTime", () => {
    it("includes Today for today", () => {
      const today = new Date();
      const result = formatEntryListTime(today);
      expect(result).toMatch(/Today/);
    });
  });
});
