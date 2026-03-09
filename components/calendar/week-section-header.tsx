import type { CalendarWeekSection } from "@/constants/calendar-mock";
import { clearRemindersForWeek } from "@/constants/calendar-mock";
import { radius } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useThemeColors } from "@/hooks/use-theme-colors";
import Ionicons from "@expo/vector-icons/Ionicons";
import * as Haptics from "expo-haptics";
import React, { memo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

type WeekSectionHeaderProps = {
  section: CalendarWeekSection;
  onReset?: () => void;
};

function WeekSectionHeaderInner({ section, onReset }: WeekSectionHeaderProps) {
  const colorScheme = useColorScheme();
  const colors = useThemeColors();

  const handleReset = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    clearRemindersForWeek(section.weekKey);
    onReset?.();
  };

  const summaryParts = [
    `Entries: ${section.entriesCount}`,
    `Reminders: ${section.remindersCount}`,
    `Streak: ${section.streak}`,
  ].filter(Boolean);

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
        },
      ]}
    >
      <View style={styles.topRow}>
        <Text style={[styles.dateRange, { color: colors.foreground }]}>
          {section.dateRangeLabel}
        </Text>
        <View style={[styles.pill, { backgroundColor: colors.muted }]}>
          <Text style={[styles.pillText, { color: colors.mutedForeground }]}>
            {section.weekLabel}
          </Text>
        </View>
      </View>
      <View style={styles.summaryRow}>
        <Text style={[styles.summary, { color: colors.mutedForeground }]}>
          {summaryParts.join(" · ")}
        </Text>
        <Pressable
          onPress={handleReset}
          style={({ pressed }) => [
            styles.resetBtn,
            { borderColor: colors.border },
            pressed && styles.pressed,
          ]}
          hitSlop={8}
          accessibilityLabel="Reset reminders for this week"
        >
          <Ionicons
            name="refresh-outline"
            size={14}
            color={colors.mutedForeground}
          />
          <Text style={[styles.resetText, { color: colors.mutedForeground }]}>
            Reset
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

export const WeekSectionHeader = memo(WeekSectionHeaderInner);

const styles = StyleSheet.create({
  container: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    marginBottom: 4,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  dateRange: {
    fontSize: 15,
    fontWeight: "600",
  },
  pill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.sm,
  },
  pillText: {
    fontSize: 11,
    fontWeight: "600",
  },
  summaryRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 6,
  },
  summary: {
    fontSize: 12,
  },
  resetBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: radius.sm,
    borderWidth: StyleSheet.hairlineWidth,
  },
  resetText: {
    fontSize: 12,
  },
  pressed: {
    opacity: 0.7,
  },
});
