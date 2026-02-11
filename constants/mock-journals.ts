/**
 * Mock journals and entries for UI development.
 * Replace with real API/state later.
 */

export type JournalEntry = {
  id: string;
  journalId: string;
  /** ISO date string */
  createdAt: string;
  /** ISO date string; when entry was last edited (defaults to createdAt) */
  updatedAt?: string;
  /** Optional title (e.g. prompt) */
  title?: string;
  body: string;
  /** Tags for the entry (e.g. gratitude, goals, reflection) */
  tags?: string[];
  /** Mood at time of writing */
  mood?: string;
  /** Image URIs (local file or remote) */
  images?: string[];
};

export type EntrySortOption = "newest" | "oldest" | "lastEdited";

export type Journal = {
  id: string;
  title: string;
  /** Optional short description */
  description?: string;
  /** When the journal was created (ISO) */
  createdAt: string;
  /** Entry count for list display */
  entryCount: number;
  /** Last activity (ISO) for sorting */
  updatedAt: string;
};

const now = new Date();
const toISO = (d: Date) => d.toISOString();

function addHours(d: Date, h: number): Date {
  const out = new Date(d.getTime());
  out.setHours(out.getHours() + h);
  return out;
}

function addDays(d: Date, n: number): Date {
  const out = new Date(d.getTime());
  out.setDate(out.getDate() + n);
  return out;
}

export const MOCK_JOURNALS: Journal[] = [
  {
    id: "j1",
    title: "Morning pages",
    description: "Three pages every morning",
    createdAt: toISO(addDays(now, -14)),
    entryCount: 12,
    updatedAt: toISO(now),
  },
  {
    id: "j2",
    title: "Evening wind-down",
    description: "Reflect on the day",
    createdAt: toISO(addDays(now, -7)),
    entryCount: 5,
    updatedAt: toISO(addDays(now, -1)),
  },
  {
    id: "j3",
    title: "Gratitude log",
    description: "Three things I'm grateful for",
    createdAt: toISO(addDays(now, -30)),
    entryCount: 28,
    updatedAt: toISO(addDays(now, -2)),
  },
];

export const MOCK_ENTRIES: Record<string, JournalEntry[]> = {
  j1: [
    {
      id: "e1",
      journalId: "j1",
      createdAt: toISO(addHours(now, -2)),
      title: "Morning check-in",
      body: "Woke up early. Feeling focused. Want to ship the journals feature today.",
      tags: ["focus", "goals"],
      mood: "energized",
    },
    {
      id: "e2",
      journalId: "j1",
      createdAt: toISO(addHours(addDays(now, -1), 7)),
      title: "Morning pages",
      body: "First page: stream of consciousness here... Second: ideas for the app. Third: what I'm avoiding.",
      tags: ["stream-of-consciousness", "ideas"],
      mood: "calm",
    },
    {
      id: "e3",
      journalId: "j1",
      createdAt: toISO(addHours(addDays(now, -2), 8)),
      body: "Didn't write much. Just a few lines. Still counts.",
      tags: ["minimal"],
      mood: "neutral",
    },
    {
      id: "e4",
      journalId: "j1",
      createdAt: toISO(addHours(addDays(now, -3), 7)),
      title: "Morning pages",
      body: "Longer entry today. Reflected on the week and set intentions for the next few days.",
      tags: ["reflection", "intentions"],
      mood: "grounded",
    },
  ],
  j2: [
    {
      id: "e5",
      journalId: "j2",
      createdAt: toISO(addHours(addDays(now, -1), 21)),
      title: "Evening reflection",
      body: "Today went well. Shipped the dashboard. Tomorrow: journals list and detail.",
      tags: ["reflection", "wins"],
      mood: "satisfied",
    },
    {
      id: "e6",
      journalId: "j2",
      createdAt: toISO(addHours(addDays(now, -2), 22)),
      body: "Tired. One win: fixed the tab bar. Grateful for coffee.",
      tags: ["gratitude", "wins"],
      mood: "tired",
    },
  ],
  j3: [
    {
      id: "e7",
      journalId: "j3",
      createdAt: toISO(addHours(addDays(now, -2), 20)),
      body: "1. My health. 2. This project. 3. Quiet evening.",
      tags: ["gratitude", "health"],
      mood: "grateful",
    },
  ],
};

/** In-memory overrides for edited entries (persists for session only) */
const entryOverrides: Record<string, Partial<JournalEntry>> = {};

/** Session-created entries (new entries not in MOCK_ENTRIES) */
const sessionEntries: JournalEntry[] = [];
let sessionEntryIdCounter = 1000;

export function setEntryOverride(
  entryId: string,
  data: Partial<
    Pick<
      JournalEntry,
      "title" | "body" | "tags" | "mood" | "images" | "updatedAt"
    >
  >,
) {
  entryOverrides[entryId] = { ...entryOverrides[entryId], ...data };
}

function mergeEntry(base: JournalEntry): JournalEntry {
  const over = entryOverrides[base.id];
  return over ? { ...base, ...over } : base;
}

function allEntriesForJournal(journalId: string): JournalEntry[] {
  const fromMock = MOCK_ENTRIES[journalId] ?? [];
  const fromSession = sessionEntries.filter((e) => e.journalId === journalId);
  const byId = new Map<string, JournalEntry>();
  fromMock.forEach((e) => byId.set(e.id, mergeEntry(e)));
  fromSession.forEach((e) => byId.set(e.id, mergeEntry(e)));
  return Array.from(byId.values());
}

export function getEntriesForJournal(
  journalId: string,
  sort: EntrySortOption = "newest",
): JournalEntry[] {
  const merged = allEntriesForJournal(journalId);
  const byCreated = (a: JournalEntry, b: JournalEntry) =>
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  const byCreatedAsc = (a: JournalEntry, b: JournalEntry) =>
    new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  const updatedAt = (e: JournalEntry) =>
    (e.updatedAt ? new Date(e.updatedAt) : new Date(e.createdAt)).getTime();
  const byLastEdited = (a: JournalEntry, b: JournalEntry) =>
    updatedAt(b) - updatedAt(a);
  if (sort === "oldest") return [...merged].sort(byCreatedAsc);
  if (sort === "lastEdited") return [...merged].sort(byLastEdited);
  return [...merged].sort(byCreated);
}

/** Create a new entry in a journal (session-only; add to API later). Returns the new entry. */
export function createEntry(
  journalId: string,
  initialTitle?: string,
): JournalEntry {
  const now = toISO(new Date());
  const id = `e-session-${sessionEntryIdCounter++}`;
  const entry: JournalEntry = {
    id,
    journalId,
    createdAt: now,
    updatedAt: now,
    body: "",
    ...(initialTitle ? { title: initialTitle } : {}),
  };
  sessionEntries.push(entry);
  return entry;
}

/** Strip HTML tags for plain-text preview (body may be HTML from rich editor) */
function stripHtml(html: string): string {
  if (!html || !html.trim()) return "";
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

/** First 120–180 chars of body, newlines → space, for list preview. Handles HTML body. */
export function getEntryPreview(body: string, maxLen = 160): string {
  const raw = body ?? "";
  const oneLine = (raw.startsWith("<") ? stripHtml(raw) : raw)
    .replace(/\s+/g, " ")
    .trim();
  if (oneLine.length <= maxLen) return oneLine;
  return oneLine.slice(0, maxLen).trim() + "…";
}

/** Display title for list: title or first line of body. Handles HTML body. */
export function getEntryListTitle(entry: JournalEntry): string {
  if (entry.title?.trim()) return entry.title.trim();
  const raw = entry.body ?? "";
  const text = raw.startsWith("<") ? stripHtml(raw) : raw;
  const first = text.split(/\n/)[0]?.replace(/\s+/g, " ").trim();
  return first || "Untitled";
}

export function getEntryById(entryId: string): JournalEntry | undefined {
  const fromSession = sessionEntries.find((e) => e.id === entryId);
  if (fromSession) return mergeEntry(fromSession);
  for (const journalId of Object.keys(MOCK_ENTRIES)) {
    const entries = MOCK_ENTRIES[journalId] ?? [];
    const found = entries.find((e) => e.id === entryId);
    if (found) return mergeEntry(found);
  }
  return undefined;
}

export function getJournalById(id: string): Journal | undefined {
  return MOCK_JOURNALS.find((j) => j.id === id);
}

/** Live entry count for a journal (includes session-created entries) */
export function getJournalEntryCount(journalId: string): number {
  return allEntriesForJournal(journalId).length;
}
