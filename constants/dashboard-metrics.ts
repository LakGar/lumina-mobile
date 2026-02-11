import type Ionicons from "@expo/vector-icons/Ionicons";

export type Trend = "up" | "down" | "neutral";

export type DashboardMetric = {
  id: string;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: number;
  average: string;
  trend: Trend;
};

export const DASHBOARD_METRICS: DashboardMetric[] = [
  {
    id: "total-journals",
    icon: "book-outline",
    label: "Total journals",
    value: 12,
    average: "2",
    trend: "up",
  },
  {
    id: "entries-this-week",
    icon: "document-text-outline",
    label: "Entries this week",
    value: 5,
    average: "4",
    trend: "up",
  },
  {
    id: "entry-quality-score",
    icon: "star-outline",
    label: "Entry quality score",
    value: 88,
    average: "84",
    trend: "up",
  },
  {
    id: "mood-score",
    icon: "happy-outline",
    label: "Mood score",
    value: 7.2,
    average: "6.8",
    trend: "up",
  },
  {
    id: "current-streak",
    icon: "flame-outline",
    label: "Current streak",
    value: 14,
    average: "21",
    trend: "neutral",
  },
  {
    id: "reflections",
    icon: "chatbubble-ellipses-outline",
    label: "Reflections",
    value: 32,
    average: "8",
    trend: "down",
  },
  {
    id: "gratitude-entries",
    icon: "heart-outline",
    label: "Gratitude entries",
    value: 28,
    average: "7",
    trend: "neutral",
  },
  {
    id: "words-per-entry",
    icon: "reader-outline",
    label: "Words per entry",
    value: 312,
    average: "280",
    trend: "up",
  },
  {
    id: "consistency",
    icon: "calendar-outline",
    label: "Consistency",
    value: 86,
    average: "96%",
    trend: "down",
  },
  {
    id: "prompts-completed",
    icon: "checkmark-done-outline",
    label: "Prompts completed",
    value: 45,
    average: "This month",
    trend: "neutral",
  },
];

export const DEFAULT_ORDER = DASHBOARD_METRICS.map((m) => m.id);
