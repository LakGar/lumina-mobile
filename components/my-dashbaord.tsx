import {
  DASHBOARD_METRICS,
  type DashboardMetric,
} from "@/constants/dashboard-metrics";
import { radius, Shadows } from "@/constants/theme";
import { useDashboardSettings } from "@/contexts/dashboard-settings-context";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useThemeColors } from "@/hooks/use-theme-colors";
import Ionicons from "@expo/vector-icons/Ionicons";
import React, { useCallback, useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { ThemedText } from "./themed-text";
import { ThemedView } from "./themed-view";

const TREND_POSITIVE = "#22c55e";
const TREND_NEGATIVE = "#f97316";

type Trend = "up" | "down" | "neutral";

function TrendIcon({ trend }: { trend: Trend }) {
  const colorScheme = useColorScheme();
  const colors = useThemeColors();

  if (trend === "up") {
    return (
      <Ionicons
        name="triangle"
        size={8}
        color={TREND_POSITIVE}
        style={styles.trendIconUp}
      />
    );
  }
  if (trend === "down") {
    return (
      <Ionicons
        name="triangle"
        size={8}
        color={TREND_NEGATIVE}
        style={styles.trendIconDown}
      />
    );
  }
  return (
    <View
      style={[styles.trendCircle, { backgroundColor: colors.mutedForeground }]}
    />
  );
}

const metricsById: Record<string, DashboardMetric> = Object.fromEntries(
  DASHBOARD_METRICS.map((m) => [m.id, m]),
);

function formatActiveDayLabel(date: Date): string {
  const today = new Date();
  const ymd = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  if (ymd(date) === ymd(today)) return "Today";
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (ymd(date) === ymd(yesterday)) return "Yesterday";
  return date.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

type MyDashboardProps = {
  onCustomizePress?: () => void;
  /** Active/selected date so stats can reflect "for this day" vs average. */
  selectedDate?: Date;
  /** Real entries count for selected day (overrides "entries" metric when provided). */
  entriesForSelectedDay?: number | null;
  /** Real entries count this week (overrides "entries-this-week" value when provided). */
  entriesThisWeek?: number | null;
  /** Real total journals count (overrides "total-journals" when provided). */
  totalJournals?: number | null;
  /** Override value (and optional average) per metric id. */
  metricOverrides?: Record<string, { value: number; average?: string }> | null;
};

export default function MyDashboard({
  onCustomizePress,
  selectedDate,
  entriesForSelectedDay,
  entriesThisWeek,
  totalJournals,
  metricOverrides,
}: MyDashboardProps) {
  const colorScheme = useColorScheme();
  const colors = useThemeColors();
  const { getOrderedVisible, isLoading } = useDashboardSettings();

  const visibleMetrics = useMemo(() => {
    const ids = getOrderedVisible();
    return ids
      .map((id) => metricsById[id])
      .filter(Boolean) as DashboardMetric[];
  }, [getOrderedVisible]);

  const valueForMetric = useCallback(
    (item: DashboardMetric): { value: string; average: string } => {
      if (item.id === "entries-this-week" && entriesThisWeek != null) {
        return { value: String(entriesThisWeek), average: "this week" };
      }
      if (item.id === "total-journals" && totalJournals != null) {
        return { value: String(totalJournals), average: "journals" };
      }
      const over = metricOverrides?.[item.id];
      if (over != null) {
        return {
          value: String(over.value),
          average: over.average ?? "—",
        };
      }
      return { value: "—", average: "—" };
    },
    [entriesThisWeek, totalJournals, metricOverrides],
  );

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <ThemedText type="title" style={styles.title}>
          My Dashboard
        </ThemedText>
        <Pressable
          onPress={onCustomizePress}
          style={({ pressed }) => [
            styles.customizeBtn,
            pressed && styles.pressed,
          ]}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Customize dashboard"
        >
          <ThemedText type="link" style={styles.customizeText}>
            Customize
          </ThemedText>
          <Ionicons
            name="chevron-forward"
            size={13}
            color={colors.primary}
            style={styles.chevron}
          />
        </Pressable>
      </View>

      <View style={styles.metricsColumn}>
        {(isLoading ? DASHBOARD_METRICS : visibleMetrics).map((item) => (
          <View
            key={item.id}
            style={[
              styles.metricRow,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
              },
              Shadows.sm,
            ]}
          >
            <View style={[styles.metricIconWrap]}>
              <Ionicons
                name={item.icon}
                size={22}
                color={colors.mutedForeground}
              />
            </View>
            <View style={styles.metricBody}>
              <Text style={[styles.metricLabel, { color: colors.foreground }]}>
                {item.label}
                {selectedDate && item.id === "entries-this-week" && (
                  <Text
                    style={[
                      styles.metricLabelSub,
                      { color: colors.mutedForeground },
                    ]}
                  >
                    {" "}
                    · {formatActiveDayLabel(selectedDate)}
                  </Text>
                )}
              </Text>
            </View>
            <View>
              <View style={styles.valueRow}>
                <Text
                  style={[styles.metricValue, { color: colors.foreground }]}
                >
                  {valueForMetric(item).value}
                </Text>
                <TrendIcon trend={item.trend} />
              </View>
              <Text
                style={[
                  styles.metricAverage,
                  { color: colors.mutedForeground },
                ]}
              >
                {valueForMetric(item).average}
              </Text>
            </View>
          </View>
        ))}
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 24,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
  },
  customizeBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  customizeText: {
    fontSize: 13,
  },
  chevron: {
    marginLeft: 2,
  },
  pressed: {
    opacity: 0.7,
  },
  metricsColumn: {
    gap: 12,
  },
  metricRow: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    padding: 10,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
  },
  metricIconWrap: {
    width: 30,
    height: 30,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
    opacity: 0.6,
  },
  metricBody: {
    flex: 1,
  },
  metricLabel: {
    fontSize: 12,
    fontWeight: "500",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  metricLabelSub: {
    fontSize: 11,
    fontWeight: "400",
    textTransform: "none",
  },
  valueRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  metricValue: {
    fontSize: 17,
    fontWeight: "700",
  },
  trendIconUp: {
    transform: [{ rotate: "0deg" }],
  },
  trendIconDown: {
    transform: [{ rotate: "180deg" }],
  },
  trendCircle: {
    width: 6,
    height: 6,
    borderRadius: 5,
    opacity: 0.6,
  },
  metricAverage: {
    fontSize: 10,
    marginTop: 2,
    opacity: 0.9,
    textAlign: "center",
  },
});
