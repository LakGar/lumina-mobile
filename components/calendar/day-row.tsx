import type { CalendarDayRow, CalendarItem } from "@/constants/calendar-mock";
import { Colors, radius } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import Ionicons from "@expo/vector-icons/Ionicons";
import * as Haptics from "expo-haptics";
import React, { memo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { CalendarCard } from "./calendar-card";

const MAX_VISIBLE_CARDS = 2;

type DayRowProps = {
  day: CalendarDayRow;
  onCardPress: (item: CalendarItem) => void;
  onAddPress: (dateISO: string) => void;
  onCardLongPress?: (item: CalendarItem) => void;
};

function DayRowInner({
  day,
  onCardPress,
  onAddPress,
  onCardLongPress,
}: DayRowProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const [expanded, setExpanded] = useState(false);

  const items = day.items;
  const visible = expanded ? items : items.slice(0, MAX_VISIBLE_CARDS);
  const hasMore = items.length > MAX_VISIBLE_CARDS && !expanded;
  const moreCount = items.length - MAX_VISIBLE_CARDS;

  return (
    <View style={[styles.row, { borderBottomColor: colors.border }]}>
      <View style={styles.leftCol}>
        <Text style={[styles.dayLabel, { color: colors.mutedForeground }]}>
          {day.dayLabel}
        </Text>
        <View
          style={[
            styles.dateWrap,
            day.isToday && { backgroundColor: colors.primary },
          ]}
        >
          <Text
            style={[
              styles.dayNumber,
              {
                color: day.isToday
                  ? colors.primaryForeground
                  : colors.foreground,
              },
            ]}
          >
            {day.dayNumber}
          </Text>
        </View>
      </View>
      <View style={styles.middleCol}>
        {visible.length === 0 ? (
          <View style={styles.placeholder} />
        ) : (
          <>
            {visible.map((item) => (
              <View key={item.id} style={styles.cardWrap}>
                <CalendarCard
                  item={item}
                  onPress={() => onCardPress(item)}
                  onLongPress={
                    onCardLongPress ? () => onCardLongPress(item) : undefined
                  }
                />
              </View>
            ))}
            {hasMore && (
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setExpanded(true);
                }}
                style={({ pressed }) => [
                  styles.moreBtn,
                  { borderColor: colors.border },
                  pressed && styles.pressed,
                ]}
              >
                <Text style={[styles.moreText, { color: colors.primary }]}>
                  +{moreCount} more
                </Text>
              </Pressable>
            )}
          </>
        )}
      </View>
      <View style={styles.rightCol}>
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onAddPress(day.dateISO);
          }}
          style={({ pressed }) => [
            styles.addBtn,
            { borderColor: colors.border, backgroundColor: colors.card },
            pressed && styles.pressed,
          ]}
          accessibilityLabel={`Add entry or reminder for ${day.dayLabel} ${day.dayNumber}`}
        >
          <Ionicons name="add" size={18} color={colors.foreground} />
          <Text style={[styles.addText, { color: colors.foreground }]}>
            Add
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

export const DayRow = memo(DayRowInner);

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    minHeight: 72,
  },
  leftCol: {
    width: 52,
    alignItems: "center",
  },
  dayLabel: {
    fontSize: 10,
    fontWeight: "600",
    marginBottom: 2,
  },
  dateWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  dayNumber: {
    fontSize: 16,
    fontWeight: "700",
  },
  middleCol: {
    flex: 1,
    minWidth: 0,
    marginLeft: 10,
    gap: 6,
  },
  placeholder: {
    minHeight: 40,
  },
  cardWrap: {
    marginBottom: 4,
  },
  moreBtn: {
    alignSelf: "flex-start",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: radius.sm,
    borderWidth: StyleSheet.hairlineWidth,
    marginTop: 2,
  },
  moreText: {
    fontSize: 12,
    fontWeight: "600",
  },
  rightCol: {
    marginLeft: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
  },
  addText: {
    fontSize: 13,
    fontWeight: "600",
  },
  pressed: {
    opacity: 0.8,
  },
});
