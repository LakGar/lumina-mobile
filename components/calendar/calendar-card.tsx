import type { CalendarItem, JournalTemplate } from "@/constants/calendar-mock";
import { radius, Shadows } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useThemeColors } from "@/hooks/use-theme-colors";
import Ionicons from "@expo/vector-icons/Ionicons";
import * as Haptics from "expo-haptics";
import React, { memo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

const TEMPLATE_ACCENT: Record<JournalTemplate, string> = {
  morning_pages: "#b85c2a",
  evening_wind_down: "#8b7aa8",
  gratitude: "#6b8e6b",
  free_write: "#5a7a9a",
};

const ACCENT_STRIPE_WIDTH = 5;

type CalendarCardProps = {
  item: CalendarItem;
  onPress: () => void;
  onLongPress?: () => void;
};

function CalendarCardInner({ item, onPress, onLongPress }: CalendarCardProps) {
  const colorScheme = useColorScheme();
  const colors = useThemeColors();

  const accent =
    item.kind === "entry" ? TEMPLATE_ACCENT[item.template] : colors.primary;

  const title = item.title;
  const subtitle =
    item.kind === "entry"
      ? (item.preview ?? "1 entry")
      : item.time
        ? `Scheduled ${formatTime(item.time)}`
        : "Scheduled";

  return (
    <Pressable
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
      onLongPress={onLongPress}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
        },
        pressed && styles.pressed,
      ]}
      accessibilityRole="button"
      accessibilityLabel={`${title}, ${subtitle}`}
    >
      <View style={[styles.stripe, { backgroundColor: accent }]} />
      <View style={styles.content}>
        <Text
          style={[styles.title, { color: colors.foreground }]}
          numberOfLines={1}
        >
          {title}
        </Text>
        <Text
          style={[styles.subtitle, { color: colors.mutedForeground }]}
          numberOfLines={1}
        >
          {subtitle}
        </Text>
      </View>
      {item.kind === "entry" && (
        <View style={styles.iconWrap}>
          <Ionicons
            name="document-text-outline"
            size={14}
            color={colors.mutedForeground}
          />
        </View>
      )}
    </Pressable>
  );
}

function formatTime(hhmm: string): string {
  const [h, m] = hhmm.split(":").map(Number);
  const am = h < 12;
  const h12 = h % 12 || 12;
  const mm = m < 10 ? `0${m}` : String(m);
  return `${h12}:${mm} ${am ? "AM" : "PM"}`;
}

export const CalendarCard = memo(CalendarCardInner);

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 52,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
    ...Shadows.xs,
  },
  stripe: {
    width: ACCENT_STRIPE_WIDTH,
    alignSelf: "stretch",
  },
  content: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 10,
    minWidth: 0,
  },
  title: {
    fontSize: 14,
    fontWeight: "600",
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  iconWrap: {
    paddingRight: 10,
  },
  pressed: {
    opacity: 0.85,
  },
});
