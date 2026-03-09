import { useColorScheme } from "@/hooks/use-color-scheme";
import { useThemeColors } from "@/hooks/use-theme-colors";
import {
  addDays,
  formatYYYYMMDD,
  getWeekPages,
  startOfWeek,
} from "@/utils/date";
import * as Haptics from "expo-haptics";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { FlatList } from "react-native";
import {
  Dimensions,
  LayoutChangeEvent,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, {
  runOnJS,
  useAnimatedScrollHandler,
  useSharedValue,
} from "react-native-reanimated";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const DAY_LABELS_SHORT = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];

const WEEKS_BACK = 26;
const WEEKS_FORWARD = 26;

type WeekAtGlanceProps = {
  selectedDate: Date;
  onDateChange?: (date: Date) => void;
  onWeekChange?: (weekIndex: number) => void;
  markersByDate?: Record<string, string[]>;
};

function weekKey(weekStart: Date): string {
  return formatYYYYMMDD(weekStart);
}

export function WeekAtGlance({
  selectedDate,
  onDateChange,
  onWeekChange,
  markersByDate = {},
}: WeekAtGlanceProps) {
  const colorScheme = useColorScheme();
  const colors = useThemeColors();
  const [pageWidth, setPageWidth] = useState<number | null>(null);
  const listRef = useRef<FlatList>(null);

  const weekPages = useMemo(() => {
    const center = startOfWeek(new Date());
    return getWeekPages(center, WEEKS_BACK, WEEKS_FORWARD);
  }, []);

  const weekIndexForDate = useCallback(
    (date: Date) => {
      const selectedWeekStart = startOfWeek(date);
      return weekPages.findIndex(
        (w) => formatYYYYMMDD(w) === formatYYYYMMDD(selectedWeekStart),
      );
    },
    [weekPages],
  );

  const initialIndex = useMemo(
    () => weekIndexForDate(selectedDate),
    [weekIndexForDate, selectedDate],
  );

  const isInitialMount = useRef(true);
  useEffect(() => {
    if (pageWidth == null || pageWidth <= 0) return;
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    const index = weekIndexForDate(selectedDate);
    if (index < 0) return;
    listRef.current?.scrollToOffset({
      offset: index * pageWidth,
      animated: true,
    });
  }, [selectedDate, weekIndexForDate, pageWidth]);

  const lastReportedWeekIndex = React.useRef<number | null>(null);
  const reportWeekIndex = useCallback(
    (index: number) => {
      if (lastReportedWeekIndex.current !== index) {
        lastReportedWeekIndex.current = index;
        onWeekChange?.(index);
      }
    },
    [onWeekChange],
  );

  const scrollX = useSharedValue(0);
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (e) => {
      scrollX.value = e.contentOffset.x;
      if (pageWidth != null && pageWidth > 0) {
        const page = Math.round(e.contentOffset.x / pageWidth);
        runOnJS(reportWeekIndex)(page);
      }
    },
  });

  const onContainerLayout = useCallback((e: LayoutChangeEvent) => {
    const w = Math.floor(e.nativeEvent.layout.width);
    if (w > 0) setPageWidth((prev) => (prev !== w ? w : prev));
  }, []);

  const onWeekRowLayout = useCallback((e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    if (w > 0) setPageWidth((prev) => (prev !== w ? w : prev));
  }, []);

  const handleDayPress = useCallback(
    (date: Date) => {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch (_) {}
      onDateChange?.(date);
    },
    [onDateChange],
  );

  const selectedKey = formatYYYYMMDD(selectedDate);

  const renderWeek = useCallback(
    ({ item: weekStart }: { item: Date }) => {
      const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
      const width = pageWidth ?? SCREEN_WIDTH;

      return (
        <View
          style={[styles.weekRow, { width }]}
          onLayout={onWeekRowLayout}
        >
          {days.map((date, i) => {
            const key = formatYYYYMMDD(date);
            const isSelected = key === selectedKey;
            const markers = markersByDate[key] ?? [];
            const dayNum = date.getDate();
            const label = DAY_LABELS_SHORT[i];

            return (
              <Pressable
                key={key}
                style={styles.dayCell}
                onPress={() => handleDayPress(date)}
                accessibilityRole="button"
                accessibilityLabel={`${label} ${dayNum}${isSelected ? ", selected" : ""}`}
              >
                <Text
                  style={[styles.dayLabel, { color: colors.mutedForeground }]}
                  numberOfLines={1}
                >
                  {label}
                </Text>
                <View
                  style={[
                    styles.datePill,
                    isSelected && {
                      backgroundColor: colors.foreground,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.dateNum,
                      {
                        color: isSelected
                          ? colors.background
                          : colors.foreground,
                      },
                    ]}
                  >
                    {dayNum}
                  </Text>
                </View>
                <View style={styles.markersRow}>
                  {markers.slice(0, 2).map((hex, i) => (
                    <View
                      key={i}
                      style={[styles.marker, { backgroundColor: hex }]}
                    />
                  ))}
                </View>
              </Pressable>
            );
          })}
        </View>
      );
    },
    [
      selectedKey,
      markersByDate,
      pageWidth,
      onWeekRowLayout,
      handleDayPress,
      colors.mutedForeground,
      colors.foreground,
      colors.background,
    ],
  );

  const keyExtractor = useCallback((item: Date) => weekKey(item), []);

  const getItemLayout = useCallback(
    (_: unknown, index: number) => {
      const w = pageWidth ?? SCREEN_WIDTH;
      return { length: w, offset: w * index, index };
    },
    [pageWidth],
  );

  if (pageWidth == null || pageWidth <= 0) {
    return (
      <View style={styles.container} onLayout={onContainerLayout}>
        <View style={[styles.weekRow, styles.placeholderRow]} />
      </View>
    );
  }

  return (
    <View style={styles.container} onLayout={onContainerLayout}>
      <Animated.FlatList
        style={styles.list}
        ref={listRef}
        data={weekPages}
        renderItem={renderWeek}
        keyExtractor={keyExtractor}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        snapToInterval={pageWidth}
        snapToAlignment="start"
        decelerationRate="fast"
        getItemLayout={getItemLayout}
        initialScrollIndex={Math.max(0, initialIndex)}
        initialNumToRender={3}
        windowSize={5}
        maxToRenderPerBatch={3}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 22,
    minHeight: 88,
    width: "100%",
  },
  list: {
    width: "100%",
  },
  placeholderRow: {
    width: "100%",
    minHeight: 60,
  },
  weekRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  dayCell: {
    flex: 1,
    minWidth: 0,
    alignItems: "center",
    justifyContent: "flex-start",
  },
  dayLabel: {
    fontSize: 8,
    fontWeight: "600",
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  datePill: {
    width: 20,
    height: 20,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  dateNum: {
    fontSize: 12,
    fontWeight: "700",
  },
  markersRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
  },
  marker: {
    width: 6,
    height: 6,
    borderRadius: 2,
  },
});
