import type {
  CalendarEntryItem,
  CalendarItem,
  CalendarReminderItem,
  CalendarWeekSection,
  JournalTemplate,
} from "@/constants/calendar-mock";
import { buildCalendarSectionsFromItems } from "@/constants/calendar-mock";
import type { CalendarReminder, JournalEntry } from "@/lib/api";
import { ApiError } from "@/lib/api";
import { addDays, formatYYYYMMDD, startOfWeek } from "@/utils/date";
import { useCallback, useEffect, useRef, useState } from "react";

const WEEKS_BACK = 2;
const WEEKS_FORWARD = 4;
/** Use cached recent-entries path (no from/to) to avoid rate limit; we filter by date client-side. */
const ENTRIES_LIMIT = 100;

function entryToCalendarItem(entry: JournalEntry): CalendarEntryItem {
  const created = entry.createdAt ? new Date(entry.createdAt) : new Date();
  const dateISO = formatYYYYMMDD(created);
  const title =
    entry.title?.trim() ||
    (entry.body?.trim()
      ? entry.body.trim().split(/\n/)[0]?.slice(0, 50) || "Entry"
      : "Entry");
  const preview =
    entry.body?.trim().replace(/\s+/g, " ").slice(0, 60) || "1 entry";
  return {
    id: `e-${entry.id}`,
    kind: "entry",
    dateISO,
    template: "free_write" as JournalTemplate,
    title,
    preview: preview.length >= 60 ? `${preview}…` : preview,
    updatedAt: entry.updatedAt ?? entry.createdAt ?? new Date().toISOString(),
    mood: entry.mood ?? undefined,
    tags: entry.tags,
    entryId: entry.id,
  };
}

function reminderToCalendarItem(r: CalendarReminder): CalendarReminderItem {
  return {
    id: r.id,
    kind: "reminder",
    dateISO: r.dateISO,
    time: r.time,
    repeat: r.repeat ?? "none",
    title: r.title,
  };
}

export type CalendarMode = "all" | "upcoming" | "history";

export type UseCalendarDataResult = {
  sections: CalendarWeekSection[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
};

export function useCalendarData(
  mode: CalendarMode,
  fetchMyEntries: (
    limit?: number,
    opts?: { from?: string; to?: string },
  ) => Promise<JournalEntry[]>,
  fetchReminders: (opts?: {
    from?: string;
    to?: string;
  }) => Promise<CalendarReminder[]>,
): UseCalendarDataResult {
  const [sections, setSections] = useState<CalendarWeekSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const inFlightRef = useRef<Promise<void> | null>(null);

  const fetchMyEntriesRef = useRef(fetchMyEntries);
  const fetchRemindersRef = useRef(fetchReminders);
  fetchMyEntriesRef.current = fetchMyEntries;
  fetchRemindersRef.current = fetchReminders;

  const load = useCallback(async () => {
    if (inFlightRef.current) {
      await inFlightRef.current;
      return;
    }
    setLoading(true);
    setError(null);
    const now = new Date();
    const start = startOfWeek(now);
    const weekStarts: Date[] = [];
    for (let i = -WEEKS_BACK; i <= WEEKS_FORWARD; i++) {
      weekStarts.push(addDays(start, i * 7));
    }
    const firstDate = weekStarts[0]!;
    const lastDate = addDays(weekStarts[weekStarts.length - 1]!, 6);
    const from = formatYYYYMMDD(firstDate);
    const to = formatYYYYMMDD(lastDate);

    const doLoad = async () => {
      try {
        const [entries, reminders] = await Promise.all([
          fetchMyEntriesRef.current(ENTRIES_LIMIT),
          fetchRemindersRef.current({ from, to }),
        ]);

        const entryItems: CalendarItem[] = entries
          .map(entryToCalendarItem)
          .filter((item) => item.dateISO >= from && item.dateISO <= to);
        const reminderItems: CalendarItem[] = reminders.map(
          reminderToCalendarItem,
        );
        const allItems = [...entryItems, ...reminderItems];

        const built = buildCalendarSectionsFromItems(
          weekStarts,
          allItems,
          mode,
        );
        setSections(built);
      } catch (e) {
        const err =
          e instanceof ApiError && e.status === 429
            ? "Too many requests. Please wait a moment and pull to refresh."
            : e instanceof Error
              ? e.message
              : "Failed to load calendar";
        setError(err);
        setSections([]);
      } finally {
        setLoading(false);
        inFlightRef.current = null;
      }
    };

    const promise = doLoad();
    inFlightRef.current = promise;
  }, [mode]);

  useEffect(() => {
    load();
  }, [load]);

  return { sections, loading, error, refetch: load };
}
