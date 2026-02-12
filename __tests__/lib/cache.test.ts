import {
  clearAll,
  getOrFetch,
  invalidateKey,
  invalidatePrefix,
} from "../../lib/cache";

describe("cache", () => {
  beforeEach(() => {
    clearAll();
  });

  it("getOrFetch returns fetcher result and caches it", async () => {
    const key = "test:1";
    const value = { foo: "bar" };
    const fetcher = jest.fn().mockResolvedValue(value);

    const result = await getOrFetch(key, 60_000, fetcher);

    expect(result).toEqual(value);
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it("second getOrFetch with same key returns cached within TTL", async () => {
    const key = "test:2";
    const value = { count: 1 };
    const fetcher = jest.fn().mockResolvedValue(value);

    const first = await getOrFetch(key, 60_000, fetcher);
    const second = await getOrFetch(key, 60_000, fetcher);

    expect(first).toEqual(value);
    expect(second).toEqual(value);
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it("invalidateKey causes next getOrFetch to refetch", async () => {
    const key = "test:3";
    const fetcher = jest.fn().mockResolvedValue({ v: 1 });

    await getOrFetch(key, 60_000, fetcher);
    invalidateKey(key);
    await getOrFetch(key, 60_000, fetcher);

    expect(fetcher).toHaveBeenCalledTimes(2);
  });

  it("invalidatePrefix removes keys matching prefix", async () => {
    const fetcher = jest.fn().mockResolvedValue({});

    await getOrFetch("journalEntries:4:newest:50", 60_000, fetcher);
    await getOrFetch("journalEntries:4:oldest:50", 60_000, fetcher);
    await getOrFetch("journalEntries:5:newest:50", 60_000, fetcher);
    expect(fetcher).toHaveBeenCalledTimes(3);

    invalidatePrefix("journalEntries:4");
    fetcher.mockClear();

    await getOrFetch("journalEntries:4:newest:50", 60_000, fetcher);
    await getOrFetch("journalEntries:5:newest:50", 60_000, fetcher);

    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(fetcher).toHaveBeenCalledWith();
  });

  it("clearAll clears store", async () => {
    const fetcher = jest.fn().mockResolvedValue({});
    await getOrFetch("key:a", 60_000, fetcher);
    clearAll();
    fetcher.mockClear();
    await getOrFetch("key:a", 60_000, fetcher);
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
});
