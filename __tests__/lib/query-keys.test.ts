import {
  cacheKeyEntry,
  cacheKeyJournal,
  cacheKeyJournalEntries,
  cacheKeyJournals,
  cacheKeyMoods,
  cacheKeyMyEntries,
  cacheKeyWeeklyTips,
} from "../../lib/query-keys";

describe("query-keys", () => {
  it("journals key", () => {
    expect(cacheKeyJournals()).toBe("journals");
  });

  it("journal key includes id", () => {
    expect(cacheKeyJournal("4")).toBe("journal:4");
  });

  it("journalEntries key includes journalId, sort, limit", () => {
    expect(cacheKeyJournalEntries("4", "newest", 50)).toBe(
      "journalEntries:4:newest:50",
    );
    expect(cacheKeyJournalEntries("4", "newest", 50, 10)).toBe(
      "journalEntries:4:newest:50:10",
    );
  });

  it("myEntries key", () => {
    expect(cacheKeyMyEntries(100)).toBe("myEntries:100");
    expect(cacheKeyMyEntries(50, "2025-02-01", "2025-02-28")).toBe(
      "myEntries:50:2025-02-01:2025-02-28",
    );
  });

  it("entry key", () => {
    expect(cacheKeyEntry("10")).toBe("entry:10");
  });

  it("moods key", () => {
    expect(cacheKeyMoods(30)).toBe("moods:30");
    expect(cacheKeyMoods(30, 0)).toBe("moods:30");
  });

  it("weeklyTips key", () => {
    expect(cacheKeyWeeklyTips(10)).toBe("weeklyTips:10");
  });
});
