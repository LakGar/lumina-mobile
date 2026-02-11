/**
 * Lightweight date helpers (no date-fns). All in local time.
 */

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** Monday = 1, Sunday = 0; startOfWeek returns the Monday of the week by default */
export function startOfWeek(date: Date, mondayStart = true): Date {
  const d = new Date(date.getTime());
  const day = d.getDay();
  const diff = mondayStart ? (day === 0 ? -6 : 1 - day) : -day;
  return addDays(d, diff);
}

export function addDays(date: Date, n: number): Date {
  const out = new Date(date.getTime());
  out.setDate(out.getDate() + n);
  return out;
}

export function formatYYYYMMDD(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

const WEEKDAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
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

/** "Sat, Feb 6" style for header */
export function formatShortDate(date: Date): string {
  const weekday = WEEKDAY_NAMES[date.getDay()];
  const month = MONTH_NAMES[date.getMonth()];
  const day = date.getDate();
  return `${weekday}, ${month} ${day}`;
}

export function isToday(date: Date): boolean {
  const a = formatYYYYMMDD(date);
  const b = formatYYYYMMDD(new Date());
  return a === b;
}

const DAY_LABELS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

export function getDayLabel(date: Date): string {
  return DAY_LABELS[date.getDay()];
}

/** "2:30 PM" (12h, no leading zero) */
export function formatTime(date: Date): string {
  const h = date.getHours();
  const m = date.getMinutes();
  const am = h < 12;
  const h12 = h % 12 || 12;
  const mm = m < 10 ? `0${m}` : String(m);
  return `${h12}:${mm} ${am ? "AM" : "PM"}`;
}

/** "Today 2:30 PM" | "Yesterday 3:00 PM" | "Mon, Feb 3 at 10:15 AM" */
export function formatEntryTimestamp(date: Date): string {
  const today = new Date();
  const y = date.getFullYear();
  const sameYear = y === today.getFullYear();
  const d = date.getDate();
  const m = date.getMonth();
  const timeStr = formatTime(date);

  if (isToday(date)) return `Today at ${timeStr}`;
  const yesterday = addDays(today, -1);
  if (
    d === yesterday.getDate() &&
    m === yesterday.getMonth() &&
    y === yesterday.getFullYear()
  ) {
    return `Yesterday at ${timeStr}`;
  }
  const weekday = WEEKDAY_NAMES[date.getDay()];
  const month = MONTH_NAMES[m];
  return sameYear
    ? `${weekday}, ${month} ${d} at ${timeStr}`
    : `${weekday}, ${month} ${d}, ${y} at ${timeStr}`;
}

/** Compact for list row: "Today 1:52 PM" | "Yesterday 2:00 PM" | "Feb 6" */
export function formatEntryListTime(date: Date): string {
  const timeStr = formatTime(date);
  if (isToday(date)) return `Today ${timeStr}`;
  const yesterday = addDays(new Date(), -1);
  if (
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear()
  ) {
    return `Yesterday ${timeStr}`;
  }
  const month = MONTH_NAMES[date.getMonth()];
  const day = date.getDate();
  return `${month} ${day}`;
}

/** "Updated Tue" or "Updated today" for journal list subtext */
export function formatUpdatedShort(date: Date): string {
  if (isToday(date)) return "Updated today";
  return `Updated ${WEEKDAY_NAMES[date.getDay()].slice(0, 3)}`;
}

/** Build list of week start dates: from (today - 26 weeks) to (today + 26 weeks), one per week */
export function getWeekPages(
  centerDate: Date,
  weeksBack = 26,
  weeksForward = 26,
): Date[] {
  const start = startOfWeek(centerDate);
  const pages: Date[] = [];
  for (let i = -weeksBack; i <= weeksForward; i++) {
    pages.push(addDays(start, i * 7));
  }
  return pages;
}
