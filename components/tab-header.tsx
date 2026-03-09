import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { WeekAtGlance } from "@/components/week-at-glance";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useThemeColors } from "@/hooks/use-theme-colors";
import { addDays, formatShortDate, isToday } from "@/utils/date";
import { useUser } from "@clerk/clerk-expo";
import Ionicons from "@expo/vector-icons/Ionicons";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export type TabHeaderMode = "home" | "default" | "titleOnly";

export type TabHeaderProps = {
  title: string;
  mode?: TabHeaderMode;
  programStartDate?: Date;
  /** Key: YYYY-MM-DD, value: array of marker colors (hex) */
  markersByDate?: Record<string, string[]>;
  onDateChange?: (date: Date) => void;
  /** When false, the week-at-glance strip animates out (e.g. on scroll down). Default true. */
  showWeekStrip?: boolean;
  /** When true, header uses blur/translucent background so content can scroll under it. */
  overlay?: boolean;
  /** Optional right-side action (e.g. add icon for Journals). When set, shows a button that calls onPress. */
  rightAction?: { onPress: () => void; accessibilityLabel?: string };
  /** Current streak (days). Only shown when >= 2; hide for 0 or 1 day streak. */
  streak?: number;
  /** Controlled selected date for home mode; when set with onDateChange, header uses these instead of internal state. */
  selectedDate?: Date;
};

const HEADER_TOP_PADDING = 12;

const WEEK_STRIP_ANIM_DURATION = 320;
const WEEK_STRIP_COLLAPSED_HEIGHT = 120;
const SMOOTH_EASING = Easing.bezier(0.25, 0.1, 0.25, 1);

export default function TabHeader({
  title,
  mode = "default",
  programStartDate,
  markersByDate,
  onDateChange,
  showWeekStrip = true,
  overlay = false,
  rightAction,
  streak,
  selectedDate: controlledSelectedDate,
}: TabHeaderProps) {
  const colorScheme = useColorScheme();
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const paddingTop = insets.top + HEADER_TOP_PADDING;
  const router = useRouter();
  const { user } = useUser();
  const avatarImageUrl = user?.imageUrl ?? null;
  const avatarInitials =
    [user?.firstName?.[0], user?.lastName?.[0]]
      .filter(Boolean)
      .join("")
      .toUpperCase() ||
    user?.fullName?.[0]?.toUpperCase() ||
    "?";

  const [internalDate, setInternalDate] = useState(() => new Date());
  const selectedDate = controlledSelectedDate ?? internalDate;
  const handleDateChange = useCallback(
    (date: Date) => {
      setInternalDate(date);
      onDateChange?.(date);
    },
    [onDateChange],
  );
  useEffect(() => {
    if (controlledSelectedDate != null) {
      setInternalDate(controlledSelectedDate);
    }
  }, [controlledSelectedDate]);

  const goPrevDay = useCallback(() => {
    const next = addDays(selectedDate, -1);
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (_) {}
    handleDateChange(next);
  }, [selectedDate, handleDateChange]);

  const goNextDay = useCallback(() => {
    const next = addDays(selectedDate, 1);
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (_) {}
    handleDateChange(next);
  }, [selectedDate, handleDateChange]);

  const isExplore = title === "Explore";
  const isJournals = title === "Journals";
  const isTitleOnlyMinimal =
    mode === "titleOnly" && title !== "Explore" && !isJournals;
  const showRightAddButton = isExplore || (isJournals && rightAction);

  const weekStripVisible = useSharedValue(showWeekStrip ? 1 : 0);
  useEffect(() => {
    weekStripVisible.value = withTiming(showWeekStrip ? 1 : 0, {
      duration: WEEK_STRIP_ANIM_DURATION,
      easing: SMOOTH_EASING,
    });
  }, [showWeekStrip, weekStripVisible]);

  const weekStripAnimatedStyle = useAnimatedStyle(() => ({
    opacity: weekStripVisible.value,
    maxHeight: weekStripVisible.value * WEEK_STRIP_COLLAPSED_HEIGHT,
    transform: [{ translateY: (1 - weekStripVisible.value) * -8 }],
  }));

  if (isTitleOnlyMinimal && !isJournals) {
    return (
      <ThemedView
        style={[
          styles.container,
          styles.titleOnlyContainer,
          { paddingTop, backgroundColor: colors.background },
        ]}
      >
        <ThemedText style={styles.title}>{title}</ThemedText>
      </ThemedView>
    );
  }

  if (isJournals) {
    return (
      <View style={[styles.container, overlay && styles.overlayContainer]}>
        {overlay && (
          <BlurView
            intensity={60}
            tint={colorScheme === "dark" ? "dark" : "light"}
            style={StyleSheet.absoluteFill}
          />
        )}
        <View
          style={[
            styles.headerContent,
            styles.journalsHeaderRow,
            {
              paddingTop,
              paddingBottom: 12,
              paddingHorizontal: 20,
              backgroundColor: overlay ? "transparent" : colors.background,
            },
          ]}
        >
          <View style={[styles.left, { paddingLeft: 0 }]}>
            <View
              style={[styles.userAvatar, { backgroundColor: colors.primary }]}
            >
              {avatarImageUrl ? (
                <Image
                  source={{ uri: avatarImageUrl }}
                  style={styles.userAvatarImage}
                />
              ) : (
                <Text
                  style={[
                    styles.userAvatarText,
                    { color: colors.primaryForeground },
                  ]}
                >
                  {avatarInitials}
                </Text>
              )}
            </View>
          </View>
          <View style={styles.journalsCenterAbsolute} pointerEvents="box-none">
            <ThemedText style={styles.title}>{title}</ThemedText>
          </View>
          <View style={styles.journalsRight}>
            {rightAction ? (
              <Pressable
                onPress={rightAction.onPress}
                style={({ pressed }) => [
                  styles.iconButton,
                  pressed && styles.pressed,
                ]}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel={rightAction.accessibilityLabel ?? "Add"}
              >
                <Ionicons name="add" size={24} color={colors.foreground} />
              </Pressable>
            ) : (
              <View style={styles.iconButton} />
            )}
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, overlay && styles.overlayContainer]}>
      {overlay && (
        <BlurView
          intensity={60}
          tint={colorScheme === "dark" ? "dark" : "light"}
          style={StyleSheet.absoluteFill}
        />
      )}
      <View
        style={[
          styles.headerContent,
          {
            paddingTop,
            backgroundColor: overlay ? "transparent" : colors.background,
          },
        ]}
      >
        <View style={styles.topRow}>
          <View style={styles.left}>
            <View
              style={[styles.userAvatar, { backgroundColor: colors.primary }]}
            >
              {avatarImageUrl ? (
                <Image
                  source={{ uri: avatarImageUrl }}
                  style={styles.userAvatarImage}
                />
              ) : (
                <Text
                  style={[
                    styles.userAvatarText,
                    { color: colors.primaryForeground },
                  ]}
                >
                  {avatarInitials}
                </Text>
              )}
            </View>
            {!isExplore && streak != null && streak >= 2 && (
              <View
                style={[styles.dailyStreak, { backgroundColor: colors.card }]}
              >
                <Ionicons name="flame" size={24} color={colors.primary} />
                <Text
                  style={[styles.dailyStreakText, { color: colors.foreground }]}
                >
                  {streak}
                </Text>
              </View>
            )}
          </View>
          <View style={styles.center}>
            {mode === "home" ? (
              <View style={[styles.dateRow, { backgroundColor: colors.card }]}>
                <Pressable
                  onPress={goPrevDay}
                  style={({ pressed }) => [
                    styles.chevronHit,
                    pressed && styles.pressed,
                  ]}
                  hitSlop={12}
                  accessibilityRole="button"
                  accessibilityLabel="Previous day"
                >
                  <Ionicons
                    name="chevron-back"
                    size={18}
                    color={colors.foreground}
                  />
                </Pressable>
                <ThemedText
                  style={[{ fontSize: 14, padding: 8, borderRadius: 8 }]}
                  numberOfLines={1}
                >
                  {isToday(selectedDate)
                    ? "Today"
                    : formatShortDate(selectedDate)}
                </ThemedText>
                <Pressable
                  onPress={goNextDay}
                  style={({ pressed }) => [
                    styles.chevronHit,
                    pressed && styles.pressed,
                  ]}
                  hitSlop={12}
                  accessibilityRole="button"
                  accessibilityLabel="Next day"
                >
                  <Ionicons
                    name="chevron-forward"
                    size={18}
                    color={colors.foreground}
                  />
                </Pressable>
              </View>
            ) : (
              <ThemedText style={styles.title}>{title}</ThemedText>
            )}
          </View>
          <View style={styles.right}>
            {showRightAddButton && (
              <Pressable
                onPress={isExplore ? undefined : rightAction?.onPress}
                style={({ pressed }) => [
                  styles.iconButton,
                  pressed && styles.pressed,
                ]}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel={
                  isExplore ? "Add" : (rightAction?.accessibilityLabel ?? "Add")
                }
              >
                <Ionicons name="add" size={24} color={colors.foreground} />
              </Pressable>
            )}
            <Pressable
              onPress={() => router.push("/(home)/calendar")}
              style={({ pressed }) => [
                styles.iconButton,
                pressed && styles.pressed,
              ]}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Open Calendar"
            >
              <Ionicons
                name="calendar-outline"
                size={24}
                color={colors.foreground}
              />
            </Pressable>
          </View>
        </View>

        {mode === "home" && (
          <Animated.View style={[weekStripAnimatedStyle, styles.weekStripWrap]}>
            <WeekAtGlance
              selectedDate={selectedDate}
              onDateChange={handleDateChange}
              markersByDate={markersByDate}
            />
          </Animated.View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: 8,
  },
  overlayContainer: {
    overflow: "hidden",
  },
  headerContent: {
    flex: 1,
  },
  weekStripWrap: {
    overflow: "hidden",
  },
  titleOnlyContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  left: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    position: "relative",
    paddingLeft: 20,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 8,
  },
  chevronHit: {
    padding: 4,
  },
  pressed: {
    opacity: 0.6,
  },
  right: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingRight: 20,
  },
  journalsHeaderRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
  },
  journalsCenterAbsolute: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    top: 70,
  },
  journalsRight: {
    width: 40,
    minWidth: 40,
    alignItems: "flex-end",
    justifyContent: "center",
  },
  placeholderLeft: {
    width: 40,
    minWidth: 40,
  },
  iconButton: {
    padding: 4,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  userAvatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  userAvatarText: {
    fontSize: 14,
    fontWeight: "600",
  },
  dailyStreak: {
    position: "absolute",
    left: 50,
    top: 3.5,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  dailyStreakText: {
    fontSize: 14,
    fontWeight: "600",
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
  },
});
