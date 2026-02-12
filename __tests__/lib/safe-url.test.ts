import { getSafeExternalUrl, isSafeExternalUrl } from "../../lib/safe-url";

describe("safe-url", () => {
  describe("isSafeExternalUrl", () => {
    it("returns true for https URL", () => {
      expect(isSafeExternalUrl("https://example.com/path")).toBe(true);
      expect(isSafeExternalUrl("https://clerk.accounts.dev/user")).toBe(true);
    });

    it("returns true for http URL", () => {
      expect(isSafeExternalUrl("http://localhost:3000")).toBe(true);
      expect(isSafeExternalUrl("http://192.168.1.1")).toBe(true);
    });

    it("returns false for null, undefined, empty", () => {
      expect(isSafeExternalUrl(null)).toBe(false);
      expect(isSafeExternalUrl(undefined)).toBe(false);
      expect(isSafeExternalUrl("")).toBe(false);
      expect(isSafeExternalUrl("   ")).toBe(false);
    });

    it("returns false for javascript: URL", () => {
      expect(isSafeExternalUrl("javascript:alert(1)")).toBe(false);
      expect(isSafeExternalUrl("javascript:void(0)")).toBe(false);
    });

    it("returns false for data: URL", () => {
      expect(
        isSafeExternalUrl("data:text/html,<script>alert(1)</script>"),
      ).toBe(false);
    });

    it("returns false for file: and other schemes", () => {
      expect(isSafeExternalUrl("file:///etc/passwd")).toBe(false);
      expect(isSafeExternalUrl("ftp://example.com")).toBe(false);
    });
  });

  describe("getSafeExternalUrl", () => {
    it("returns trimmed URL when safe", () => {
      expect(getSafeExternalUrl("  https://example.com  ")).toBe(
        "https://example.com",
      );
      expect(getSafeExternalUrl("https://stripe.com/checkout")).toBe(
        "https://stripe.com/checkout",
      );
    });

    it("returns null when not safe", () => {
      expect(getSafeExternalUrl(null)).toBeNull();
      expect(getSafeExternalUrl("javascript:alert(1)")).toBeNull();
      expect(getSafeExternalUrl("")).toBeNull();
    });
  });
});
