/**
 * Cache key builders and TTLs for the app's state/cache layer.
 * Use these when reading, writing, and invalidating cache entries.
 */

export const CACHE_TTL = {
  /** Journals list and single journal */
  JOURNALS_MS: 2 * 60 * 1000,
  /** Journal entries list, my entries, single entry */
  ENTRIES_MS: 60 * 1000,
  /** Moods list */
  MOODS_MS: 60 * 1000,
  /** Reminders list */
  REMINDERS_MS: 60 * 1000,
  /** User preferences and notification (change rarely) */
  PREFERENCES_MS: 5 * 60 * 1000,
  /** User stats and subscription */
  USER_MS: 2 * 60 * 1000,
  /** Weekly tips */
  WEEKLY_TIPS_MS: 2 * 60 * 1000,
} as const;

export function cacheKeyJournals(): string {
  return "journals";
}

export function cacheKeyJournal(id: string): string {
  return `journal:${id}`;
}

export function cacheKeyJournalEntries(
  journalId: string,
  sort: string,
  limit: number,
  offset?: number,
): string {
  const base = `journalEntries:${journalId}:${sort}:${limit}`;
  return offset != null && offset > 0 ? `${base}:${offset}` : base;
}

export function cacheKeyMyEntries(
  limit: number,
  from?: string,
  to?: string,
): string {
  if (from ?? to) return `myEntries:${limit}:${from ?? ""}:${to ?? ""}`;
  return `myEntries:${limit}`;
}

export function cacheKeyEntry(entryId: string): string {
  return `entry:${entryId}`;
}

export function cacheKeyMoods(limit?: number, offset?: number): string {
  const l = limit ?? 30;
  const o = offset ?? 0;
  return o > 0 ? `moods:${l}:${o}` : `moods:${l}`;
}

export function cacheKeyReminders(from?: string, to?: string): string {
  if (from ?? to) return `reminders:${from ?? ""}:${to ?? ""}`;
  return "reminders";
}

export function cacheKeyPreferences(): string {
  return "preferences";
}

export function cacheKeyNotification(): string {
  return "notification";
}

export function cacheKeyUserStats(): string {
  return "userStats";
}

export function cacheKeySubscription(): string {
  return "subscription";
}

export function cacheKeyWeeklyTips(limit: number): string {
  return `weeklyTips:${limit}`;
}

/** Prefixes for bulk invalidation */
export const CACHE_PREFIX = {
  JOURNALS: "journals",
  JOURNAL: "journal:",
  JOURNAL_ENTRIES: "journalEntries:",
  MY_ENTRIES: "myEntries:",
  ENTRY: "entry:",
  MOODS: "moods",
  REMINDERS: "reminders",
  PREFERENCES: "preferences",
  NOTIFICATION: "notification",
  USER_STATS: "userStats",
  SUBSCRIPTION: "subscription",
  WEEKLY_TIPS: "weeklyTips:",
} as const;
