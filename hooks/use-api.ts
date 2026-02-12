import type { JournalEntry } from "@/lib/api";
import * as api from "@/lib/api";
import {
  cacheKeys,
  cacheTtl,
  clearAll,
  getOrFetch,
  invalidateKey,
  invalidatePrefix,
} from "@/lib/cache";
import { useAuth } from "@clerk/clerk-expo";
import { useCallback, useMemo } from "react";

/**
 * Hook that returns API methods with auth token from Clerk and a central cache.
 * Reads go through cache (TTL per resource); mutations invalidate relevant keys.
 * Use inside SignedIn or after ensuring user is authenticated.
 */
export function useApi() {
  const { getToken } = useAuth();

  const getTokenFn = useCallback<api.GetTokenFn>(() => getToken(), [getToken]);

  const fetchJournals = useCallback(
    () =>
      getOrFetch(
        cacheKeys.journals(),
        cacheTtl.JOURNALS_MS,
        () => api.fetchJournals(getTokenFn),
      ),
    [getTokenFn],
  );
  const createJournal = useCallback(
    async (title: string) => {
      const j = await api.createJournal(getTokenFn, title);
      invalidateKey(cacheKeys.journals());
      return j;
    },
    [getTokenFn],
  );
  const fetchJournal = useCallback(
    (id: string) =>
      getOrFetch(
        cacheKeys.journal(id),
        cacheTtl.JOURNALS_MS,
        () => api.fetchJournal(getTokenFn, id),
      ),
    [getTokenFn],
  );
  const updateJournal = useCallback(
    async (id: string, payload: { title?: string; public?: boolean }) => {
      const j = await api.updateJournal(getTokenFn, id, payload);
      invalidateKey(cacheKeys.journals());
      invalidateKey(cacheKeys.journal(id));
      return j;
    },
    [getTokenFn],
  );
  const deleteJournal = useCallback(
    async (id: string) => {
      await api.deleteJournal(getTokenFn, id);
      invalidateKey(cacheKeys.journals());
      invalidateKey(cacheKeys.journal(id));
      invalidatePrefix("journalEntries:" + id);
    },
    [getTokenFn],
  );
  const fetchJournalEntries = useCallback(
    (
      journalId: string,
      opts?: { sort?: api.EntrySortOption; limit?: number; offset?: number },
    ) => {
      const sort = opts?.sort ?? "newest";
      const limit = opts?.limit ?? 50;
      const offset = opts?.offset ?? 0;
      const key = cacheKeys.journalEntries(journalId, sort, limit, offset);
      return getOrFetch(key, cacheTtl.ENTRIES_MS, () =>
        api.fetchJournalEntries(getTokenFn, journalId, opts),
      );
    },
    [getTokenFn],
  );
  const createEntry = useCallback(
    async (
      journalId: string,
      payload: {
        content: string;
        source?: "TEXT" | "VOICE" | "MIXED";
        mood?: string;
        tags?: string[];
      },
    ) => {
      const e = await api.createEntry(getTokenFn, journalId, payload);
      invalidatePrefix("journalEntries:");
      invalidatePrefix("myEntries:");
      invalidateKey(cacheKeys.journals());
      return e;
    },
    [getTokenFn],
  );
  const fetchEntry = useCallback(
    (entryId: string) =>
      getOrFetch(
        cacheKeys.entry(entryId),
        cacheTtl.ENTRIES_MS,
        () => api.fetchEntry(getTokenFn, entryId),
      ),
    [getTokenFn],
  );
  const invalidateEntry = useCallback((entryId: string) => {
    invalidateKey(cacheKeys.entry(entryId));
    invalidatePrefix("journalEntries:");
    invalidatePrefix("myEntries:");
  }, []);
  const updateEntry = useCallback(
    async (
      entryId: string,
      payload: {
        content?: string;
        mood?: string;
        tags?: string[];
      },
    ) => {
      const e = await api.updateEntry(getTokenFn, entryId, payload);
      invalidateEntry(entryId);
      return e;
    },
    [getTokenFn, invalidateEntry],
  );
  const deleteEntry = useCallback(
    async (entryId: string) => {
      await api.deleteEntry(getTokenFn, entryId);
      invalidateEntry(entryId);
    },
    [getTokenFn, invalidateEntry],
  );
  const setEntryMood = useCallback(
    async (entryId: string, label: string) => {
      await api.setEntryMood(getTokenFn, entryId, label);
      invalidateEntry(entryId);
    },
    [getTokenFn, invalidateEntry],
  );
  const addEntryTag = useCallback(
    async (entryId: string, tag: string) => {
      await api.addEntryTag(getTokenFn, entryId, tag);
      invalidateEntry(entryId);
    },
    [getTokenFn, invalidateEntry],
  );
  const removeEntryTag = useCallback(
    async (entryId: string, tag: string) => {
      await api.removeEntryTag(getTokenFn, entryId, tag);
      invalidateEntry(entryId);
    },
    [getTokenFn, invalidateEntry],
  );
  const regenerateEntryAi = useCallback(
    async (entryId: string) => {
      const result = await api.regenerateEntryAi(getTokenFn, entryId);
      invalidateEntry(entryId);
      return result;
    },
    [getTokenFn, invalidateEntry],
  );
  const goDeeper = useCallback(
    (entryId: string, currentContent?: string | null) =>
      api.goDeeper(getTokenFn, entryId, currentContent),
    [getTokenFn],
  );
  const sendJournalChat = useCallback(
    (journalId: string, message: string, sessionId?: number | null) =>
      api.sendJournalChat(getTokenFn, journalId, message, sessionId),
    [getTokenFn],
  );
  const fetchWeeklyTips = useCallback(
    (limit?: number) => {
      const lim = limit ?? 10;
      return getOrFetch(
        cacheKeys.weeklyTips(lim),
        cacheTtl.WEEKLY_TIPS_MS,
        () => api.fetchWeeklyTips(getTokenFn, lim),
      );
    },
    [getTokenFn],
  );
  const generateWeeklyTip = useCallback(
    async () => {
      const tip = await api.generateWeeklyTip(getTokenFn);
      invalidatePrefix("weeklyTips:");
      return tip;
    },
    [getTokenFn],
  );
  const markWeeklyTipRead = useCallback(
    async (tipId: number) => {
      await api.markWeeklyTipRead(getTokenFn, tipId);
      invalidatePrefix("weeklyTips:");
    },
    [getTokenFn],
  );
  const fetchMoods = useCallback(
    (opts?: { limit?: number; offset?: number }) =>
      getOrFetch(
        cacheKeys.moods(opts?.limit, opts?.offset),
        cacheTtl.MOODS_MS,
        () => api.fetchMoods(getTokenFn, opts),
      ),
    [getTokenFn],
  );
  const createMood = useCallback(
    async (payload: { title: string; note?: string | null }) => {
      const m = await api.createMood(getTokenFn, payload);
      invalidatePrefix("moods");
      return m;
    },
    [getTokenFn],
  );
  const fetchMood = useCallback(
    (id: string) => api.fetchMood(getTokenFn, id),
    [getTokenFn],
  );
  const updateMood = useCallback(
    async (id: string, payload: { title?: string; note?: string | null }) => {
      const m = await api.updateMood(getTokenFn, id, payload);
      invalidatePrefix("moods");
      return m;
    },
    [getTokenFn],
  );
  const deleteMood = useCallback(
    async (id: string) => {
      await api.deleteMood(getTokenFn, id);
      invalidatePrefix("moods");
    },
    [getTokenFn],
  );
  const fetchMyEntries = useCallback(
    (
      limit?: number,
      opts?: { from?: string; to?: string },
    ): Promise<JournalEntry[]> => {
      const lim = limit ?? 50;
      const key = cacheKeys.myEntries(lim, opts?.from, opts?.to);
      return getOrFetch(key, cacheTtl.ENTRIES_MS, () =>
        api.fetchMyEntries(getTokenFn, lim, opts),
      );
    },
    [getTokenFn],
  );
  const fetchReminders = useCallback(
    (opts?: { from?: string; to?: string }) =>
      getOrFetch(
        cacheKeys.reminders(opts?.from, opts?.to),
        cacheTtl.REMINDERS_MS,
        () => api.fetchReminders(getTokenFn, opts),
      ),
    [getTokenFn],
  );
  const createReminder = useCallback(
    async (payload: Parameters<typeof api.createReminder>[1]) => {
      const r = await api.createReminder(getTokenFn, payload);
      invalidatePrefix("reminders");
      return r;
    },
    [getTokenFn],
  );
  const updateReminder = useCallback(
    async (
      reminderId: string,
      payload: Parameters<typeof api.updateReminder>[2],
    ) => {
      const r = await api.updateReminder(getTokenFn, reminderId, payload);
      invalidatePrefix("reminders");
      return r;
    },
    [getTokenFn],
  );
  const deleteReminder = useCallback(
    async (reminderId: string) => {
      await api.deleteReminder(getTokenFn, reminderId);
      invalidatePrefix("reminders");
    },
    [getTokenFn],
  );
  const fetchPreferences = useCallback(
    () =>
      getOrFetch(
        cacheKeys.preferences(),
        cacheTtl.PREFERENCES_MS,
        () => api.fetchPreferences(getTokenFn),
      ),
    [getTokenFn],
  );
  const updatePreferences = useCallback(
    async (payload: api.UserPreferences) => {
      const p = await api.updatePreferences(getTokenFn, payload);
      invalidateKey(cacheKeys.preferences());
      return p;
    },
    [getTokenFn],
  );
  const fetchNotification = useCallback(
    () =>
      getOrFetch(
        cacheKeys.notification(),
        cacheTtl.PREFERENCES_MS,
        () => api.fetchNotification(getTokenFn),
      ),
    [getTokenFn],
  );
  const updateNotification = useCallback(
    async (payload: Partial<api.NotificationSettings>) => {
      const n = await api.updateNotification(getTokenFn, payload);
      invalidateKey(cacheKeys.notification());
      return n;
    },
    [getTokenFn],
  );
  const fetchUserStats = useCallback(
    () =>
      getOrFetch(
        cacheKeys.userStats(),
        cacheTtl.USER_MS,
        () => api.fetchUserStats(getTokenFn),
      ),
    [getTokenFn],
  );
  const fetchSubscription = useCallback(
    () =>
      getOrFetch(
        cacheKeys.subscription(),
        cacheTtl.USER_MS,
        () => api.fetchSubscription(getTokenFn),
      ),
    [getTokenFn],
  );
  const syncBilling = useCallback(
    async () => {
      const s = await api.syncBilling(getTokenFn);
      invalidateKey(cacheKeys.subscription());
      return s;
    },
    [getTokenFn],
  );
  const deleteMyJournalData = useCallback(
    async () => {
      await api.deleteMyJournalData(getTokenFn);
      clearAll();
    },
    [getTokenFn],
  );
  const deleteMyAiData = useCallback(
    () => api.deleteMyAiData(getTokenFn),
    [getTokenFn],
  );
  const deleteAllMyData = useCallback(
    async () => {
      await api.deleteAllMyData(getTokenFn);
      clearAll();
    },
    [getTokenFn],
  );
  const completeOnboarding = useCallback(
    (payload: Parameters<typeof api.completeOnboarding>[1]) =>
      api.completeOnboarding(getTokenFn, payload),
    [getTokenFn],
  );
  const createCheckoutSession = useCallback(
    () => api.createCheckoutSession(getTokenFn),
    [getTokenFn],
  );
  const createPortalSession = useCallback(
    () => api.createPortalSession(getTokenFn),
    [getTokenFn],
  );

  const invalidate = useMemo(
    () => ({
      journals: () => invalidateKey(cacheKeys.journals()),
      journal: (id: string) => invalidateKey(cacheKeys.journal(id)),
      journalEntries: (journalId: string) =>
        invalidatePrefix("journalEntries:" + journalId),
      myEntries: () => invalidatePrefix("myEntries:"),
      entry: (entryId: string) => invalidateEntry(entryId),
      moods: () => invalidatePrefix("moods"),
      reminders: () => invalidatePrefix("reminders"),
      preferences: () => invalidateKey(cacheKeys.preferences()),
      notification: () => invalidateKey(cacheKeys.notification()),
      userStats: () => invalidateKey(cacheKeys.userStats()),
      subscription: () => invalidateKey(cacheKeys.subscription()),
      weeklyTips: () => invalidatePrefix("weeklyTips:"),
      all: clearAll,
    }),
    [invalidateEntry],
  );

  return useMemo(
    () => ({
      getToken: getTokenFn,
      fetchJournals,
      createJournal,
      fetchJournal,
      updateJournal,
      deleteJournal,
      fetchJournalEntries,
      createEntry,
      fetchEntry,
      updateEntry,
      deleteEntry,
      setEntryMood,
      addEntryTag,
      removeEntryTag,
      regenerateEntryAi,
      goDeeper,
      sendJournalChat,
      fetchWeeklyTips,
      generateWeeklyTip,
      markWeeklyTipRead,
      fetchMoods,
      createMood,
      fetchMood,
      updateMood,
      deleteMood,
      fetchMyEntries,
      fetchReminders,
      createReminder,
      updateReminder,
      deleteReminder,
      fetchPreferences,
      updatePreferences,
      fetchNotification,
      updateNotification,
      fetchUserStats,
      fetchSubscription,
      syncBilling,
      deleteMyJournalData,
      deleteMyAiData,
      deleteAllMyData,
      completeOnboarding,
      createCheckoutSession,
      createPortalSession,
      invalidate,
    }),
    [
      getTokenFn,
      fetchJournals,
      createJournal,
      fetchJournal,
      updateJournal,
      deleteJournal,
      fetchJournalEntries,
      createEntry,
      fetchEntry,
      updateEntry,
      deleteEntry,
      setEntryMood,
      addEntryTag,
      removeEntryTag,
      regenerateEntryAi,
      goDeeper,
      sendJournalChat,
      fetchWeeklyTips,
      generateWeeklyTip,
      markWeeklyTipRead,
      fetchMoods,
      createMood,
      fetchMood,
      updateMood,
      deleteMood,
      fetchMyEntries,
      fetchReminders,
      createReminder,
      updateReminder,
      deleteReminder,
      fetchPreferences,
      updatePreferences,
      fetchNotification,
      updateNotification,
      fetchUserStats,
      fetchSubscription,
      syncBilling,
      deleteMyJournalData,
      deleteMyAiData,
      deleteAllMyData,
      completeOnboarding,
      createCheckoutSession,
      createPortalSession,
      invalidate,
    ],
  );
}
