import {
  isValidEntryId,
  isValidJournalId,
  sanitizeId,
} from "../../lib/validate-ids";

describe("validate-ids", () => {
  describe("isValidEntryId", () => {
    it("accepts numeric string", () => {
      expect(isValidEntryId("1")).toBe(true);
      expect(isValidEntryId("123")).toBe(true);
    });

    it("accepts alphanumeric and hyphen/underscore", () => {
      expect(isValidEntryId("abc")).toBe(true);
      expect(isValidEntryId("entry-1")).toBe(true);
      expect(isValidEntryId("id_42")).toBe(true);
      expect(isValidEntryId("a1B2_c-3")).toBe(true);
    });

    it("rejects null, undefined, empty", () => {
      expect(isValidEntryId(null)).toBe(false);
      expect(isValidEntryId(undefined)).toBe(false);
      expect(isValidEntryId("")).toBe(false);
      expect(isValidEntryId("   ")).toBe(false);
    });

    it("rejects over max length (24)", () => {
      expect(isValidEntryId("a".repeat(24))).toBe(true);
      expect(isValidEntryId("a".repeat(25))).toBe(false);
    });

    it("rejects unsafe characters", () => {
      expect(isValidEntryId("id/1")).toBe(false);
      expect(isValidEntryId("id 1")).toBe(false);
      expect(isValidEntryId("id<script>")).toBe(false);
      expect(isValidEntryId("../1")).toBe(false);
    });
  });

  describe("isValidJournalId", () => {
    it("behaves same as isValidEntryId", () => {
      expect(isValidJournalId("4")).toBe(true);
      expect(isValidJournalId("journal-1")).toBe(true);
      expect(isValidJournalId(null)).toBe(false);
    });
  });

  describe("sanitizeId", () => {
    it("returns trimmed id when valid", () => {
      expect(sanitizeId("  42  ")).toBe("42");
      expect(sanitizeId("abc")).toBe("abc");
    });

    it("returns null when invalid", () => {
      expect(sanitizeId(null)).toBeNull();
      expect(sanitizeId("")).toBeNull();
      expect(sanitizeId("x".repeat(25))).toBeNull();
    });
  });
});
