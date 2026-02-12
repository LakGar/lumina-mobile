/**
 * In-memory cache with TTL and prefix invalidation for API data.
 * Used by useApi (via cached fetchers) to avoid redundant requests and keep state consistent.
 */

import {
  CACHE_TTL,
  cacheKeyEntry,
  cacheKeyJournal,
  cacheKeyJournalEntries,
  cacheKeyJournals,
  cacheKeyMoods,
  cacheKeyMyEntries,
  cacheKeyNotification,
  cacheKeyPreferences,
  cacheKeyReminders,
  cacheKeySubscription,
  cacheKeyUserStats,
  cacheKeyWeeklyTips,
  CACHE_PREFIX,
} from "./query-keys";

export type CacheEntry<T> = {
  data: T;
  ts: number;
};

const store = new Map<string, CacheEntry<unknown>>();
const inFlight = new Map<string, Promise<unknown>>();

function get<T>(key: string, ttlMs: number): T | null {
  const entry = store.get(key) as CacheEntry<T> | undefined;
  if (!entry) return null;
  if (Date.now() - entry.ts > ttlMs) {
    store.delete(key);
    return null;
  }
  return entry.data;
}

function set<T>(key: string, data: T): void {
  store.set(key, { data, ts: Date.now() });
}

/**
 * Remove a single key.
 */
export function invalidateKey(key: string): void {
  store.delete(key);
}

/**
 * Remove all keys that start with the given prefix.
 * E.g. invalidatePrefix("journalEntries:4") clears all cached entry lists for journal 4.
 */
export function invalidatePrefix(prefix: string): void {
  for (const key of store.keys()) {
    if (key === prefix || key.startsWith(prefix + ":")) store.delete(key);
  }
}

/**
 * Invalidate multiple key prefixes (e.g. after a mutation that affects journals and my entries).
 */
export function invalidatePrefixes(prefixes: string[]): void {
  for (const key of store.keys()) {
    if (prefixes.some((p) => key === p || key.startsWith(p + ":")))
      store.delete(key);
  }
}

/**
 * Get from cache or run fetcher, then cache result. Deduplicates in-flight requests for the same key.
 */
export async function getOrFetch<T>(
  key: string,
  ttlMs: number,
  fetcher: () => Promise<T>,
): Promise<T> {
  const cached = get<T>(key, ttlMs);
  if (cached !== null) return cached;

  const flying = inFlight.get(key) as Promise<T> | undefined;
  if (flying) return flying;

  const promise = fetcher().then((data) => {
    set(key, data);
    inFlight.delete(key);
    return data;
  });
  inFlight.set(key, promise);
  return promise;
}

// --- Convenience: key + TTL for each resource (for use by api layer) ---

export const cacheKeys = {
  journals: cacheKeyJournals,
  journal: cacheKeyJournal,
  journalEntries: cacheKeyJournalEntries,
  myEntries: cacheKeyMyEntries,
  entry: cacheKeyEntry,
  moods: cacheKeyMoods,
  reminders: cacheKeyReminders,
  preferences: cacheKeyPreferences,
  notification: cacheKeyNotification,
  userStats: cacheKeyUserStats,
  subscription: cacheKeySubscription,
  weeklyTips: cacheKeyWeeklyTips,
};

export const cacheTtl = CACHE_TTL;
export const cachePrefix = CACHE_PREFIX;

/**
 * Clear all cached data (e.g. on sign out). Call from auth flow if desired.
 */
export function clearAll(): void {
  store.clear();
  inFlight.clear();
}
