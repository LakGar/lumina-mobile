/**
 * Calendar types and mock data for journal entries + reminders (weekly grouped).
 */

import { addDays, formatYYYYMMDD, startOfWeek } from "@/utils/date";

export type JournalTemplate =
  | "morning_pages"
  | "evening_wind_down"
  | "gratitude"
  | "free_write";

export type CalendarEntryItem = {
  id: string;
  kind: "entry";
  dateISO: string;
  template: JournalTemplate;
  title: string;
  preview?: string;
  updatedAt: string;
  mood?: string;
  tags?: string[];
  entryId?: string;
};

export type CalendarReminderItem = {
  id: string;
  kind: "reminder";
  dateISO: string;
  time: string;
  repeat?: "none" | "daily" | "weekly";
  title: string;
};

export type CalendarItem = CalendarEntryItem | CalendarReminderItem;

export function isEntryItem(item: CalendarItem): item is CalendarEntryItem {
  return item.kind === "entry";
}

export function isReminderItem(
  item: CalendarItem,
): item is CalendarReminderItem {
  return item.kind === "reminder";
}

export type CalendarWeekSection = {
  weekKey: string;
  weekStart: Date;
  weekLabel: string;
  weekNumber: number;
  dateRangeLabel: string;
  entriesCount: number;
  remindersCount: number;
  streak: number;
  days: CalendarDayRow[];
};

export type CalendarDayRow = {
  date: Date;
  dateISO: string;
  dayLabel: string;
  dayNumber: number;
  isToday: boolean;
  items: CalendarItem[];
};

const MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

function formatRange(start: Date, end: Date): string {
  const a = MONTH_NAMES[start.getMonth()];
  const b = MONTH_NAMES[end.getMonth()];
  const d1 = start.getDate();
  const d2 = end.getDate();
  if (a === b) return `${a} ${d1} – ${d2}`;
  return `${a} ${d1} – ${b} ${d2}`;
}

function getWeekNumber(date: Date): number {
  const start = startOfWeek(date);
  const jan1 = new Date(date.getFullYear(), 0, 1);
  const startJan1 = startOfWeek(jan1);
  const diff =
    (start.getTime() - startJan1.getTime()) / (7 * 24 * 60 * 60 * 1000);
  return Math.max(1, Math.floor(diff) + 1);
}

const DAY_LABELS_MON_FIRST = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];

function buildDayRow(date: Date, items: CalendarItem[]): CalendarDayRow {
  const dayOfWeek = date.getDay();
  const monFirstIndex = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  return {
    date,
    dateISO: formatYYYYMMDD(date),
    dayLabel: DAY_LABELS_MON_FIRST[monFirstIndex],
    dayNumber: date.getDate(),
    isToday: formatYYYYMMDD(date) === formatYYYYMMDD(new Date()),
    items,
  };
}

/** Group items by dateISO; build sections for weeks that have any items or are in range */
function groupItemsByDate(items: CalendarItem[]): Map<string, CalendarItem[]> {
  const map = new Map<string, CalendarItem[]>();
  for (const item of items) {
    const list = map.get(item.dateISO) ?? [];
    list.push(item);
    map.set(item.dateISO, list);
  }
  return map;
}

/** Generate mock calendar items for a range of weeks */
function generateMockItems(weekStarts: Date[]): CalendarItem[] {
  const items: CalendarItem[] = [];
  let id = 1;
  const templates: JournalTemplate[] = [
    "morning_pages",
    "evening_wind_down",
    "gratitude",
    "free_write",
  ];
  const entryTitles: Record<JournalTemplate, string> = {
    morning_pages: "Morning Pages",
    evening_wind_down: "Evening Wind-down",
    gratitude: "Gratitude",
    free_write: "Quick Reflection",
  };
  for (const weekStart of weekStarts) {
    for (let d = 0; d < 7; d++) {
      const date = addDays(weekStart, d);
      const dateISO = formatYYYYMMDD(date);
      const isPast =
        date < new Date() &&
        formatYYYYMMDD(date) !== formatYYYYMMDD(new Date());
      if (d === 1 || d === 3) {
        items.push({
          id: `e-${id++}`,
          kind: "entry",
          dateISO,
          template: templates[d % 4],
          title: entryTitles[templates[d % 4]],
          preview: "1 entry",
          updatedAt: new Date(
            date.getTime() + 18 * 60 * 60 * 1000,
          ).toISOString(),
          mood: "calm",
          tags: ["daily"],
          entryId: `entry-${id}`,
        });
      }
      if (d === 2 || d === 4 || d === 5) {
        items.push({
          id: `r-${id++}`,
          kind: "reminder",
          dateISO,
          time: d === 2 ? "09:00" : "20:30",
          repeat: d === 2 ? "daily" : "none",
          title: d === 2 ? "Morning Pages" : "Evening Wind-down",
        });
      }
      if (d === 0 && isPast) {
        items.push({
          id: `e-${id++}`,
          kind: "entry",
          dateISO,
          template: "free_write",
          title: "Quick Reflection",
          preview: "3 prompts",
          updatedAt: new Date(
            date.getTime() + 12 * 60 * 60 * 1000,
          ).toISOString(),
          entryId: `entry-${id}`,
        });
      }
    }
  }
  return items;
}

/** Build week sections from a flat list of calendar items (entries + reminders) */
export function buildCalendarSectionsFromItems(
  weekStarts: Date[],
  items: CalendarItem[],
  mode: "all" | "upcoming" | "history",
): CalendarWeekSection[] {
  const byDate = groupItemsByDate(items);
  const todayISO = formatYYYYMMDD(new Date());
  const sections: CalendarWeekSection[] = [];

  for (const weekStart of weekStarts) {
    const weekEnd = addDays(weekStart, 6);
    const weekKey = formatYYYYMMDD(weekStart);
    const weekNumber = getWeekNumber(weekStart);
    const days: CalendarDayRow[] = [];
    let entriesCount = 0;
    let remindersCount = 0;

    for (let d = 0; d < 7; d++) {
      const date = addDays(weekStart, d);
      const dateISO = formatYYYYMMDD(date);
      let dayItems = byDate.get(dateISO) ?? [];
      if (mode === "upcoming") {
        dayItems = dayItems
          .filter(isReminderItem)
          .concat(
            dayItems.filter(isEntryItem).filter((e) => dateISO >= todayISO),
          );
      } else if (mode === "history") {
        dayItems = dayItems
          .filter(isEntryItem)
          .concat(
            dayItems.filter(isReminderItem).filter((r) => dateISO < todayISO),
          );
      }
      entriesCount += dayItems.filter(isEntryItem).length;
      remindersCount += dayItems.filter(isReminderItem).length;
      days.push(buildDayRow(date, dayItems));
    }

    sections.push({
      weekKey,
      weekStart,
      weekLabel: `WEEK ${weekNumber}`,
      weekNumber,
      dateRangeLabel: formatRange(weekStart, weekEnd),
      entriesCount,
      remindersCount,
      streak: 0,
      days,
    });
  }

  return sections;
}

/** Build week sections for SectionList (current month ± 2 weeks) — mock data */
export function getMockCalendarSections(
  mode: "all" | "upcoming" | "history",
): CalendarWeekSection[] {
  const now = new Date();
  const start = startOfWeek(now);
  const weekStarts: Date[] = [];
  for (let i = -2; i <= 4; i++) {
    weekStarts.push(addDays(start, i * 7));
  }
  const allItems = generateMockItems(weekStarts);
  const sections = buildCalendarSectionsFromItems(weekStarts, allItems, mode);
  sections.forEach((s) => {
    (s as { streak: number }).streak = 14;
  });
  return sections;
}

/** Clear reminders for a week (mock: just for UI; no server) */
export function clearRemindersForWeek(_weekKey: string): void {
  // In a real app would call API; for mock no-op or update local state
}
