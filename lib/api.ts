/**
 * API client for Lumina backend.
 * All methods require a getToken function (e.g. from Clerk useAuth().getToken).
 * Responses are normalized to use string IDs and app-friendly shapes (body, title, etc.).
 */

import { Platform } from "react-native";

export type GetTokenFn = () => Promise<string | null>;

/** Base URL for API. Use EXPO_PUBLIC_API_URL or platform default. */
export function getApiBaseUrl(): string {
  if (typeof process !== "undefined" && process.env?.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL.replace(/\/$/, "");
  }
  if (Platform.OS === "android") return "http://10.0.2.2:3000";
  return "http://localhost:3000";
}

/** App-facing journal (id as string, entryCount). */
export type Journal = {
  id: string;
  title: string;
  description?: string | null;
  public?: boolean;
  createdAt: string;
  updatedAt: string;
  entryCount: number;
};

/** App-facing entry (id as string, body = content, title optional). */
export type JournalEntry = {
  id: string;
  journalId: string;
  createdAt: string;
  updatedAt?: string;
  title?: string;
  body: string;
  tags?: string[];
  mood?: string;
  images?: string[];
};

/** User preferences from API */
export type UserPreferences = {
  theme?: "light" | "dark" | "system";
  goal?: string | null;
  topics?: string | string[] | null;
  reason?: string | null;
};

/** Notification settings from API */
export type NotificationSettings = {
  dailyReminderEnabled?: boolean;
  dailyReminderTime?: string;
  timezone?: string;
  frequency?: string;
};

/** Calendar reminder (scheduled for a date; optional repeat). */
export type CalendarReminder = {
  id: string;
  dateISO: string;
  time: string;
  repeat?: "none" | "daily" | "weekdays" | "weekly";
  title: string;
  journalId?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public body?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function request<T>(
  getToken: GetTokenFn,
  path: string,
  options: {
    method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
    body?: object;
  } = {},
): Promise<T> {
  const base = getApiBaseUrl();
  const url = path.startsWith("http") ? path : `${base}${path}`;
  const token = await getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
  const res = await fetch(url, {
    method: options.method ?? "GET",
    headers,
    ...(options.body !== undefined
      ? { body: JSON.stringify(options.body) }
      : {}),
  });
  const text = await res.text();
  let data: unknown;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = null;
  }
  if (!res.ok) {
    const errMsg =
      data &&
      typeof data === "object" &&
      "error" in data &&
      typeof (data as { error: unknown }).error === "string"
        ? (data as { error: string }).error
        : res.statusText || "Request failed";
    throw new ApiError(errMsg, res.status, data);
  }
  return data as T;
}

/** Normalize API journal to app Journal (string id, entryCount). */
function toJournal(raw: {
  id: number;
  title: string;
  public?: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: { entries: number };
}): Journal {
  return {
    id: String(raw.id),
    title: raw.title,
    public: raw.public,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
    entryCount: raw._count?.entries ?? 0,
  };
}

/** Normalize API entry to app JournalEntry (string ids, body = content). Handles summary/mood as object or string. */
function toEntry(raw: Record<string, unknown>): JournalEntry {
  const id = raw.id != null ? String(raw.id) : "";
  const journalId = raw.journalId != null ? String(raw.journalId) : "";
  const createdAt = typeof raw.createdAt === "string" ? raw.createdAt : "";
  const updatedAt =
    typeof raw.updatedAt === "string" ? raw.updatedAt : createdAt;
  const content = raw.content ?? raw.body;
  const body = typeof content === "string" ? content : "";
  const summary = raw.summary;
  const title =
    typeof summary === "string"
      ? summary
      : summary &&
          typeof summary === "object" &&
          "text" in summary &&
          typeof (summary as { text?: string }).text === "string"
        ? (summary as { text: string }).text
        : undefined;
  const moodRaw = raw.mood;
  const mood =
    typeof moodRaw === "string"
      ? moodRaw
      : moodRaw &&
          typeof moodRaw === "object" &&
          "label" in moodRaw &&
          typeof (moodRaw as { label?: string }).label === "string"
        ? (moodRaw as { label: string }).label
        : undefined;
  const tags = Array.isArray(raw.tags)
    ? raw.tags
        .map((t) =>
          typeof t === "string" ? t : ((t as { tag?: string }).tag ?? ""),
        )
        .filter(Boolean)
    : [];
  return {
    id,
    journalId,
    createdAt,
    updatedAt,
    title: title || undefined,
    body,
    mood: mood || undefined,
    tags: tags.length ? tags : undefined,
  };
}

// --- Journals ---

export async function fetchJournals(getToken: GetTokenFn): Promise<Journal[]> {
  const res = await request<{ data: unknown[] }>(getToken, "/api/journals");
  return (res.data ?? []).map((j) =>
    toJournal(j as Parameters<typeof toJournal>[0]),
  );
}

export async function createJournal(
  getToken: GetTokenFn,
  title: string,
): Promise<Journal> {
  const res = await request<{ data: unknown }>(getToken, "/api/journals", {
    method: "POST",
    body: { title },
  });
  const raw = res.data as {
    id: number;
    title: string;
    createdAt?: string;
    updatedAt?: string;
  };
  return toJournal({
    id: raw.id,
    title: raw.title,
    createdAt: raw.createdAt ?? new Date().toISOString(),
    updatedAt: raw.updatedAt ?? new Date().toISOString(),
  });
}

export async function fetchJournal(
  getToken: GetTokenFn,
  id: string,
): Promise<Journal | null> {
  try {
    const res = await request<{ data: unknown }>(
      getToken,
      `/api/journals/${id}`,
    );
    return toJournal(res.data as Parameters<typeof toJournal>[0]);
  } catch (e) {
    if (e instanceof ApiError && (e.status === 404 || e.status === 400))
      return null;
    throw e;
  }
}

export async function updateJournal(
  getToken: GetTokenFn,
  id: string,
  payload: { title?: string; public?: boolean },
): Promise<Journal> {
  const res = await request<{ data: unknown }>(
    getToken,
    `/api/journals/${id}`,
    {
      method: "PATCH",
      body: payload,
    },
  );
  return toJournal(res.data as Parameters<typeof toJournal>[0]);
}

export async function deleteJournal(
  getToken: GetTokenFn,
  id: string,
): Promise<void> {
  await request(getToken, `/api/journals/${id}`, { method: "DELETE" });
}

// --- Journal entries ---

export type EntrySortOption = "newest" | "oldest" | "lastEdited";

export async function fetchJournalEntries(
  getToken: GetTokenFn,
  journalId: string,
  opts?: { sort?: EntrySortOption; limit?: number; offset?: number },
): Promise<{ entries: JournalEntry[]; total: number }> {
  const params = new URLSearchParams();
  if (opts?.sort) params.set("sort", opts.sort);
  if (opts?.limit != null) params.set("limit", String(opts.limit));
  if (opts?.offset != null) params.set("offset", String(opts.offset));
  const qs = params.toString();
  const path = `/api/journals/${journalId}/entries${qs ? `?${qs}` : ""}`;
  const res = await request<{ data: unknown[]; total?: number }>(
    getToken,
    path,
  );
  const entries = (res.data ?? []).map((e) =>
    toEntry(e as Parameters<typeof toEntry>[0]),
  );
  return {
    entries,
    total: (res as { total?: number }).total ?? entries.length,
  };
}

export async function createEntry(
  getToken: GetTokenFn,
  journalId: string,
  payload: {
    content: string;
    source?: "TEXT" | "VOICE" | "MIXED";
    mood?: string;
    tags?: string[];
  },
): Promise<JournalEntry> {
  const res = await request<{ data: unknown }>(
    getToken,
    `/api/journals/${journalId}/entries`,
    { method: "POST", body: payload },
  );
  return toEntry(res.data as Parameters<typeof toEntry>[0]);
}

// --- Entries by ID ---

export async function fetchEntry(
  getToken: GetTokenFn,
  entryId: string,
): Promise<JournalEntry | null> {
  try {
    const res = await request<{ data: unknown }>(
      getToken,
      `/api/entries/${entryId}`,
    );
    return toEntry(res.data as Parameters<typeof toEntry>[0]);
  } catch (e) {
    if (e instanceof ApiError && (e.status === 404 || e.status === 400))
      return null;
    throw e;
  }
}

export async function updateEntry(
  getToken: GetTokenFn,
  entryId: string,
  payload: {
    content?: string;
    source?: string;
    mood?: string;
    tags?: string[];
  },
): Promise<JournalEntry> {
  const res = await request<{ data: unknown }>(
    getToken,
    `/api/entries/${entryId}`,
    { method: "PATCH", body: payload },
  );
  return toEntry(res.data as Parameters<typeof toEntry>[0]);
}

export async function deleteEntry(
  getToken: GetTokenFn,
  entryId: string,
): Promise<void> {
  await request(getToken, `/api/entries/${entryId}`, { method: "DELETE" });
}

export async function setEntryMood(
  getToken: GetTokenFn,
  entryId: string,
  label: string,
): Promise<void> {
  await request(getToken, `/api/entries/${entryId}/mood`, {
    method: "PUT",
    body: { label },
  });
}

export async function addEntryTag(
  getToken: GetTokenFn,
  entryId: string,
  tag: string,
): Promise<void> {
  await request(getToken, `/api/entries/${entryId}/tags`, {
    method: "POST",
    body: { tag },
  });
}

export async function removeEntryTag(
  getToken: GetTokenFn,
  entryId: string,
  tag: string,
): Promise<void> {
  const encoded = encodeURIComponent(tag);
  await request(getToken, `/api/entries/${entryId}/tags/${encoded}`, {
    method: "DELETE",
  });
}

// --- Entry AI (regenerate-ai, go-deeper) ---

export type EntrySummaryAi = {
  id: number;
  text: string;
  model: string | null;
  qualityScore?: number | null;
  createdAt: string;
};

export type EntryMoodAi = {
  id: number;
  label: string;
  score: number | null;
  createdAt: string;
};

export type EntryTagAi = {
  id: number;
  tag: string;
  source: "AI" | "USER";
};

/** Result of regenerate-ai: entry fields plus AI summary, mood, tags, quality score for UI. */
export type RegenerateAiResult = {
  entry: JournalEntry;
  summaryText: string | null;
  qualityScore: number | null;
  moodLabel: string | null;
  tagsAi: { tag: string; source: string }[];
};

export async function regenerateEntryAi(
  getToken: GetTokenFn,
  entryId: string,
): Promise<RegenerateAiResult> {
  const res = await request<{
    data?: {
      id?: number | string;
      journalId?: number | string;
      content?: string;
      body?: string;
      source?: string;
      createdAt?: string;
      updatedAt?: string;
      summary?: {
        id?: number;
        text?: string;
        qualityScore?: number;
        createdAt?: string;
      } | null;
      mood?: {
        id?: number;
        label?: string;
        score?: number;
        createdAt?: string;
      } | null;
      tags?: { id?: number; tag?: string; source?: string }[];
    };
  }>(getToken, `/api/entries/${entryId}/regenerate-ai`, { method: "POST" });
  const d = res.data ?? res;
  const raw = (typeof d === "object" && d !== null ? d : {}) as Record<
    string,
    unknown
  >;
  const content = (raw.content ?? raw.body ?? "") as string;
  const summary = raw.summary as
    | { text?: string; qualityScore?: number }
    | null
    | undefined;
  const mood = raw.mood as { label?: string } | null | undefined;
  const tagsRaw = (raw.tags ?? []) as { tag?: string; source?: string }[];
  const entry: JournalEntry = {
    id: String(raw.id ?? entryId),
    journalId: String(raw.journalId ?? ""),
    body: content,
    createdAt: (raw.createdAt as string) ?? "",
    updatedAt: (raw.updatedAt as string) ?? "",
    title: (raw.title as string) ?? undefined,
    mood: mood?.label ?? (raw.mood as string) ?? undefined,
    tags: tagsRaw.map((t) => t.tag ?? "").filter(Boolean),
  };
  return {
    entry,
    summaryText: summary?.text ?? null,
    qualityScore: summary?.qualityScore ?? null,
    moodLabel: mood?.label ?? null,
    tagsAi: tagsRaw.map((t) => ({
      tag: String(t.tag ?? ""),
      source: String(t.source ?? "AI"),
    })),
  };
}

export async function goDeeper(
  getToken: GetTokenFn,
  entryId: string,
  currentContent?: string | null,
): Promise<{ questions: string[] }> {
  const res = await request<{ data?: { questions?: string[] } }>(
    getToken,
    `/api/entries/${entryId}/go-deeper`,
    {
      method: "POST",
      body: currentContent != null ? { currentContent } : {},
    },
  );
  const data = (res as { data?: { questions?: string[] } }).data;
  const questions = data?.questions ?? [];
  return { questions: Array.isArray(questions) ? questions : [] };
}

// --- Journal-context chat ---

export async function sendJournalChat(
  getToken: GetTokenFn,
  journalId: string,
  message: string,
  sessionId?: number | null,
): Promise<{ reply: string; sessionId: number }> {
  const res = await request<{ data?: { reply?: string; sessionId?: number } }>(
    getToken,
    `/api/journals/${journalId}/chat`,
    {
      method: "POST",
      body: sessionId != null ? { message, sessionId } : { message },
    },
  );
  const data = (res as { data?: { reply?: string; sessionId?: number } }).data;
  return {
    reply: data?.reply ?? "",
    sessionId: data?.sessionId ?? 0,
  };
}

// --- Weekly tips ---

export type WeeklyTipType =
  | "missed_journal"
  | "quality_down"
  | "streak"
  | "consistency"
  | "general";

export type WeeklyTip = {
  id: number;
  title: string;
  shortDescription: string;
  detailedText: string;
  tipType: WeeklyTipType | null;
  readAt: string | null;
  createdAt: string;
};

export async function fetchWeeklyTips(
  getToken: GetTokenFn,
  limit = 10,
): Promise<WeeklyTip[]> {
  const res = await request<{ data?: unknown[] }>(
    getToken,
    `/api/users/me/weekly-tips?limit=${Math.min(50, Math.max(1, limit))}`,
  );
  const list = (res as { data?: unknown[] }).data ?? [];
  return list.map((item) => {
    const row = (item ?? {}) as Record<string, unknown>;
    return {
      id: Number(row.id ?? 0),
      title: String(row.title ?? ""),
      shortDescription: String(row.shortDescription ?? ""),
      detailedText: String(row.detailedText ?? ""),
      tipType: (row.tipType as WeeklyTipType) ?? null,
      readAt: row.readAt != null ? String(row.readAt) : null,
      createdAt: String(row.createdAt ?? ""),
    };
  });
}

export async function generateWeeklyTip(
  getToken: GetTokenFn,
): Promise<WeeklyTip> {
  const res = await request<{ data?: unknown }>(
    getToken,
    "/api/users/me/weekly-tips/generate",
    { method: "POST" },
  );
  const row = ((res as { data?: unknown }).data ?? res) as Record<
    string,
    unknown
  >;
  return {
    id: Number(row.id ?? 0),
    title: String(row.title ?? ""),
    shortDescription: String(row.shortDescription ?? ""),
    detailedText: String(row.detailedText ?? ""),
    tipType: (row.tipType as WeeklyTipType) ?? null,
    readAt: row.readAt != null ? String(row.readAt) : null,
    createdAt: String(row.createdAt ?? ""),
  };
}

export async function markWeeklyTipRead(
  getToken: GetTokenFn,
  tipId: number,
): Promise<void> {
  await request(getToken, `/api/users/me/weekly-tips/${tipId}/read`, {
    method: "PATCH",
  });
}

// --- Moods (standalone, not tied to a journal entry) ---

export type MoodLog = {
  id: string;
  title: string;
  note: string | null;
  createdAt: string;
  updatedAt: string;
};

export async function fetchMoods(
  getToken: GetTokenFn,
  opts?: { limit?: number; offset?: number },
): Promise<MoodLog[]> {
  const params = new URLSearchParams();
  if (opts?.limit != null) params.set("limit", String(opts.limit));
  if (opts?.offset != null) params.set("offset", String(opts.offset));
  const qs = params.toString();
  const res = await request<{ moods?: unknown[]; data?: unknown[] }>(
    getToken,
    `/api/moods${qs ? `?${qs}` : ""}`,
  );
  const list = res.moods ?? res.data ?? [];
  return list.map((m) => {
    const row = m as Record<string, unknown>;
    return {
      id: String(row.id ?? ""),
      title: String(row.title ?? ""),
      note: row.note != null ? String(row.note) : null,
      createdAt: String(row.createdAt ?? ""),
      updatedAt: String(row.updatedAt ?? ""),
    };
  });
}

export async function createMood(
  getToken: GetTokenFn,
  payload: { title: string; note?: string | null },
): Promise<MoodLog> {
  const res = await request<{
    data?: unknown;
    id?: string;
    title?: string;
    note?: string | null;
    createdAt?: string;
    updatedAt?: string;
  }>(getToken, "/api/moods", {
    method: "POST",
    body: { title: payload.title, note: payload.note ?? null },
  });
  const d = (res.data ?? res) as Record<string, unknown>;
  return {
    id: String(d.id ?? ""),
    title: String(d.title ?? payload.title),
    note: d.note != null ? String(d.note) : null,
    createdAt: String(d.createdAt ?? new Date().toISOString()),
    updatedAt: String(d.updatedAt ?? new Date().toISOString()),
  };
}

export async function fetchMood(
  getToken: GetTokenFn,
  id: string,
): Promise<MoodLog | null> {
  try {
    const res = await request<{ data?: unknown }>(getToken, `/api/moods/${id}`);
    const d = (res.data ?? res) as Record<string, unknown>;
    return {
      id: String(d.id ?? id),
      title: String(d.title ?? ""),
      note: d.note != null ? String(d.note) : null,
      createdAt: String(d.createdAt ?? ""),
      updatedAt: String(d.updatedAt ?? ""),
    };
  } catch (e) {
    if (e instanceof ApiError && (e.status === 404 || e.status === 400))
      return null;
    throw e;
  }
}

export async function updateMood(
  getToken: GetTokenFn,
  id: string,
  payload: { title?: string; note?: string | null },
): Promise<MoodLog> {
  const res = await request<{ data?: unknown }>(getToken, `/api/moods/${id}`, {
    method: "PATCH",
    body: payload,
  });
  const d = (res.data ?? res) as Record<string, unknown>;
  return {
    id: String(d.id ?? id),
    title: String(d.title ?? payload.title ?? ""),
    note: d.note != null ? String(d.note) : (payload.note ?? null),
    createdAt: String(d.createdAt ?? ""),
    updatedAt: String(d.updatedAt ?? ""),
  };
}

export async function deleteMood(
  getToken: GetTokenFn,
  id: string,
): Promise<void> {
  await request(getToken, `/api/moods/${id}`, { method: "DELETE" });
}

// --- Current user ---

export async function fetchMyEntries(
  getToken: GetTokenFn,
  limit = 50,
  opts?: { from?: string; to?: string },
): Promise<JournalEntry[]> {
  const params = new URLSearchParams();
  params.set("limit", String(limit));
  if (opts?.from) params.set("from", opts.from);
  if (opts?.to) params.set("to", opts.to);
  const qs = params.toString();
  const res = await request<{ data?: unknown; entries?: unknown }>(
    getToken,
    `/api/users/me/entries?${qs}`,
  );
  const list = Array.isArray(res)
    ? res
    : Array.isArray((res as { data?: unknown }).data)
      ? (res as { data: unknown[] }).data
      : Array.isArray((res as { entries?: unknown }).entries)
        ? (res as { entries: unknown[] }).entries
        : [];
  return list.map((e) => toEntry((e ?? {}) as Record<string, unknown>));
}

// --- Calendar reminders (user-scoped) ---

function toReminder(raw: Record<string, unknown>): CalendarReminder {
  return {
    id: String(raw.id ?? ""),
    dateISO: String(raw.dateISO ?? raw.date ?? ""),
    time: String(raw.time ?? "09:00"),
    repeat:
      raw.repeat === "daily" ||
      raw.repeat === "weekdays" ||
      raw.repeat === "weekly"
        ? raw.repeat
        : "none",
    title: String(raw.title ?? "Reminder"),
    journalId: raw.journalId != null ? String(raw.journalId) : null,
    createdAt: raw.createdAt as string | undefined,
    updatedAt: raw.updatedAt as string | undefined,
  };
}

export async function fetchReminders(
  getToken: GetTokenFn,
  opts?: { from?: string; to?: string },
): Promise<CalendarReminder[]> {
  try {
    const params = new URLSearchParams();
    if (opts?.from) params.set("from", opts.from);
    if (opts?.to) params.set("to", opts.to);
    const qs = params.toString();
    const path = `/api/users/me/reminders${qs ? `?${qs}` : ""}`;
    const res = await request<{ data?: unknown[]; reminders?: unknown[] }>(
      getToken,
      path,
    );
    const list = res.data ?? res.reminders ?? [];
    return list.map((r) => toReminder(r as Record<string, unknown>));
  } catch {
    return [];
  }
}

export async function createReminder(
  getToken: GetTokenFn,
  payload: {
    dateISO: string;
    time: string;
    repeat?: "none" | "daily" | "weekdays" | "weekly";
    title: string;
    journalId?: string | null;
  },
): Promise<CalendarReminder> {
  const res = await request<{ data: unknown }>(
    getToken,
    "/api/users/me/reminders",
    { method: "POST", body: payload },
  );
  return toReminder(res.data as Record<string, unknown>);
}

export async function updateReminder(
  getToken: GetTokenFn,
  reminderId: string,
  payload: {
    dateISO?: string;
    time?: string;
    repeat?: "none" | "daily" | "weekdays" | "weekly";
    title?: string;
    journalId?: string | null;
  },
): Promise<CalendarReminder> {
  const res = await request<{ data: unknown }>(
    getToken,
    `/api/users/me/reminders/${encodeURIComponent(reminderId)}`,
    { method: "PATCH", body: payload },
  );
  return toReminder(res.data as Record<string, unknown>);
}

export async function deleteReminder(
  getToken: GetTokenFn,
  reminderId: string,
): Promise<void> {
  await request(
    getToken,
    `/api/users/me/reminders/${encodeURIComponent(reminderId)}`,
    { method: "DELETE" },
  );
}

export async function fetchPreferences(
  getToken: GetTokenFn,
): Promise<UserPreferences> {
  const res = await request<{ data: unknown }>(
    getToken,
    "/api/users/me/preferences",
  );
  const d = res.data as Record<string, unknown>;
  return {
    theme: d?.theme as UserPreferences["theme"],
    goal: d?.goal as string | null,
    topics: d?.topics as UserPreferences["topics"],
    reason: d?.reason as string | null,
  };
}

export async function updatePreferences(
  getToken: GetTokenFn,
  payload: UserPreferences,
): Promise<UserPreferences> {
  const res = await request<{ data: unknown }>(
    getToken,
    "/api/users/me/preferences",
    { method: "PATCH", body: payload },
  );
  const d = res.data as Record<string, unknown>;
  return {
    theme: d?.theme as UserPreferences["theme"],
    goal: d?.goal as string | null,
    topics: d?.topics as UserPreferences["topics"],
    reason: d?.reason as string | null,
  };
}

export async function fetchNotification(
  getToken: GetTokenFn,
): Promise<NotificationSettings> {
  const res = await request<{ data: unknown }>(
    getToken,
    "/api/users/me/notification",
  );
  const d = res.data as Record<string, unknown>;
  return {
    dailyReminderEnabled: d?.dailyReminderEnabled as boolean | undefined,
    dailyReminderTime: d?.dailyReminderTime as string | undefined,
    timezone: d?.timezone as string | undefined,
    frequency: d?.frequency as string | undefined,
  };
}

export async function updateNotification(
  getToken: GetTokenFn,
  payload: Partial<NotificationSettings>,
): Promise<NotificationSettings> {
  const res = await request<{ data: unknown }>(
    getToken,
    "/api/users/me/notification",
    { method: "PATCH", body: payload },
  );
  const d = res.data as Record<string, unknown>;
  return {
    dailyReminderEnabled: d?.dailyReminderEnabled as boolean | undefined,
    dailyReminderTime: d?.dailyReminderTime as string | undefined,
    timezone: d?.timezone as string | undefined,
    frequency: d?.frequency as string | undefined,
  };
}

// --- User stats & subscription ---

export type UserStats = {
  luminaScore: number;
  luminaLevel: number;
  lastJournal: { title: string; journalId: number; daysAgo: number } | null;
  entriesThisWeek: number;
  moodScore: number | null;
  entryQualityScore: number | null;
  currentStreak: number;
  reflections: number;
  gratitudeEntries: number;
  wordsPerEntry: number | null;
  consistency: number;
  promptsCompleted: number;
};

export async function fetchUserStats(getToken: GetTokenFn): Promise<UserStats> {
  const res = await request<{ data: unknown }>(getToken, "/api/users/me/stats");
  const d = (res.data ?? res) as Record<string, unknown>;
  const lastJournal = d?.lastJournal as
    | { title: string; journalId: number; daysAgo: number }
    | null
    | undefined;
  return {
    luminaScore: Number(d?.luminaScore ?? 0),
    luminaLevel: Number(d?.luminaLevel ?? 1),
    lastJournal: lastJournal ?? null,
    entriesThisWeek: Number(d?.entriesThisWeek ?? 0),
    moodScore: d?.moodScore != null ? Number(d.moodScore) : null,
    entryQualityScore:
      d?.entryQualityScore != null ? Number(d.entryQualityScore) : null,
    currentStreak: Number(d?.currentStreak ?? 0),
    reflections: Number(d?.reflections ?? 0),
    gratitudeEntries: Number(d?.gratitudeEntries ?? 0),
    wordsPerEntry: d?.wordsPerEntry != null ? Number(d.wordsPerEntry) : null,
    consistency: Number(d?.consistency ?? 0),
    promptsCompleted: Number(d?.promptsCompleted ?? 0),
  };
}

export type SubscriptionStatus = {
  status: "active" | "trialing" | "past_due" | "canceled" | null;
  planId?: string | null;
};

export async function fetchSubscription(
  getToken: GetTokenFn,
): Promise<SubscriptionStatus> {
  const res = await request<{ data?: unknown }>(
    getToken,
    "/api/users/me/subscription",
  );
  const d = (res.data ?? res) as Record<string, unknown>;
  return {
    status: (d?.status as SubscriptionStatus["status"]) ?? null,
    planId: d?.planId != null ? String(d.planId) : null,
  };
}

// --- Privacy / data deletion ---

/** Permanently delete all journals and entries for the current user. */
export async function deleteMyJournalData(getToken: GetTokenFn): Promise<void> {
  await request(getToken, "/api/users/me/journals", { method: "DELETE" });
}

/** Delete stored AI/personalization data (prompts, etc.) for the current user. */
export async function deleteMyAiData(getToken: GetTokenFn): Promise<void> {
  await request(getToken, "/api/users/me/ai-data", { method: "DELETE" });
}

/** Permanently delete all user data (journals, preferences, AI data, etc.). Caller should sign out after. */
export async function deleteAllMyData(getToken: GetTokenFn): Promise<void> {
  await request(getToken, "/api/users/me/delete-all-data", {
    method: "POST",
  });
}

// --- Onboarding ---

export async function completeOnboarding(
  getToken: GetTokenFn,
  payload: {
    firstEntryContent: string;
    journalName?: string;
    displayName?: string;
    goal?: string;
    topics?: string;
    reason?: string;
    dailyReminderTime?: string;
    dailyReminderEnabled?: boolean;
  },
): Promise<{ journalId: number; entryId: number }> {
  const res = await request<{ data: { journalId: number; entryId: number } }>(
    getToken,
    "/api/onboard/complete",
    { method: "POST", body: payload },
  );
  return res.data;
}

// --- Billing (return URLs for WebBrowser) ---

export async function createCheckoutSession(
  getToken: GetTokenFn,
): Promise<{ url: string; sessionId?: string }> {
  const res = await request<{ data: { url: string; sessionId?: string } }>(
    getToken,
    "/api/billing/checkout",
    { method: "POST" },
  );
  return res.data;
}

export async function createPortalSession(
  getToken: GetTokenFn,
): Promise<{ url: string }> {
  const res = await request<{ data: { url: string } }>(
    getToken,
    "/api/billing/portal",
    { method: "POST" },
  );
  return res.data;
}

/** Refresh subscription status from Stripe (e.g. after checkout). */
export async function syncBilling(
  getToken: GetTokenFn,
): Promise<SubscriptionStatus> {
  const res = await request<{ data?: unknown }>(getToken, "/api/billing/sync", {
    method: "POST",
  });
  const d = (res.data ?? res) as Record<string, unknown>;
  return {
    status: (d?.status as SubscriptionStatus["status"]) ?? null,
    planId: d?.planId != null ? String(d.planId) : null,
  };
}

export { ApiError };
