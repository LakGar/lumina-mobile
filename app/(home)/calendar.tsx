import {
  AddActionSheet,
  type AddAction,
} from "@/components/calendar/add-action-sheet";
import { DayRow } from "@/components/calendar/day-row";
import { WeekSectionHeader } from "@/components/calendar/week-section-header";
import type {
  CalendarItem,
  CalendarWeekSection,
} from "@/constants/calendar-mock";
import { Colors, radius } from "@/constants/theme";
import { useApi } from "@/hooks/use-api";
import { useCalendarData, type CalendarMode } from "@/hooks/use-calendar-data";
import { useColorScheme } from "@/hooks/use-color-scheme";
import Ionicons from "@expo/vector-icons/Ionicons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type SectionType = CalendarWeekSection;

function formatDateLabel(dateISO: string): string {
  const [y, m, d] = dateISO.split("-").map(Number);
  const months = [
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
  return `${months[m - 1]} ${d}`;
}

export default function CalendarScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const api = useApi();

  const [mode, setMode] = useState<CalendarMode>("all");
  const [addSheetVisible, setAddSheetVisible] = useState(false);
  const [addSheetDateISO, setAddSheetDateISO] = useState<string | null>(null);
  const [filterVisible, setFilterVisible] = useState(false);
  const [showPastEntries, setShowPastEntries] = useState(true);

  const { sections, loading, error, refetch } = useCalendarData(
    mode,
    api.fetchMyEntries,
    api.fetchReminders,
  );
  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const goBack = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  }, [router]);

  const openAddSheet = useCallback((dateISO: string) => {
    setAddSheetDateISO(dateISO);
    setAddSheetVisible(true);
  }, []);

  const closeAddSheet = useCallback(() => {
    setAddSheetVisible(false);
    setAddSheetDateISO(null);
  }, []);

  const handleAddAction = useCallback(
    (action: AddAction) => {
      if (action === "create_entry" || action === "quick_entry") {
        // In a real app: create entry for addSheetDateISO and navigate to it
        router.push("/(home)/(tabs)/journals");
      } else if (action === "schedule_reminder") {
        // Open reminder edit (mock: just close)
        closeAddSheet();
      }
    },
    [router, closeAddSheet],
  );

  const handleCardPress = useCallback(
    (item: CalendarItem) => {
      if (item.kind === "entry" && item.entryId) {
        router.push({
          pathname: "/(home)/entry/[entryId]",
          params: { entryId: item.entryId },
        });
      } else {
        // Reminder: would open reminder edit sheet
      }
    },
    [router],
  );

  const handleCardLongPress = useCallback((_item: CalendarItem) => {
    // Context menu: Edit / Duplicate / Delete
  }, []);

  const renderWeekBlock = useCallback(
    ({ item: section }: { item: SectionType }) => (
      <View
        style={[
          styles.weekBlock,
          {
            backgroundColor: colors.card,
            borderColor: colors.border,
          },
        ]}
      >
        <WeekSectionHeader section={section} />
        {section.days.map((day) => (
          <DayRow
            key={day.dateISO}
            day={day}
            onCardPress={handleCardPress}
            onAddPress={openAddSheet}
            onCardLongPress={handleCardLongPress}
          />
        ))}
      </View>
    ),
    [
      colors.card,
      colors.border,
      handleCardPress,
      openAddSheet,
      handleCardLongPress,
    ],
  );

  const keyExtractor = useCallback((item: SectionType) => item.weekKey, []);

  const openFilter = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setFilterVisible(true);
  }, []);

  const closeFilter = useCallback(() => setFilterVisible(false), []);

  const openMoreMenu = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert(
      "Calendar",
      undefined,
      [
        {
          text: "Calendar settings",
          onPress: () => router.push("/(home)/app-settings"),
        },
        {
          text: "Notification settings",
          onPress: () => router.push("/(home)/app-settings"),
        },
        { text: "Cancel", style: "cancel" },
      ],
      { cancelable: true },
    );
  }, [router]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Top Nav */}
      <View
        style={[
          styles.header,
          {
            paddingTop: insets.top + 8,
            paddingBottom: 12,
            borderBottomColor: colors.border,
            backgroundColor: colors.background,
          },
        ]}
      >
        <Pressable
          onPress={goBack}
          style={({ pressed }) => [styles.backBtn, pressed && styles.pressed]}
          hitSlop={12}
          accessibilityLabel="Go back"
        >
          <Ionicons name="chevron-back" size={24} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.title, { color: colors.foreground }]}>
          Calendar
        </Text>
        <View style={styles.headerRight}>
          <Pressable
            onPress={openFilter}
            style={({ pressed }) => [styles.iconBtn, pressed && styles.pressed]}
            accessibilityLabel="Filter"
          >
            <Ionicons
              name="options-outline"
              size={22}
              color={colors.foreground}
            />
          </Pressable>
          <Pressable
            onPress={openMoreMenu}
            style={({ pressed }) => [styles.iconBtn, pressed && styles.pressed]}
            accessibilityLabel="More options"
          >
            <Ionicons
              name="ellipsis-horizontal"
              size={22}
              color={colors.foreground}
            />
          </Pressable>
        </View>
      </View>

      {/* Segmented control: All | Upcoming | History */}
      <View
        style={[
          styles.segmentedWrap,
          {
            borderBottomColor: colors.border,
            backgroundColor: colors.background,
          },
        ]}
      >
        {(["all", "upcoming", "history"] as const).map((m) => (
          <Pressable
            key={m}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setMode(m);
            }}
            style={[
              styles.segment,
              mode === m && { backgroundColor: colors.primary },
            ]}
          >
            <Text
              style={[
                styles.segmentText,
                {
                  color:
                    mode === m
                      ? colors.primaryForeground
                      : colors.mutedForeground,
                },
              ]}
            >
              {m === "all" ? "All" : m === "upcoming" ? "Upcoming" : "History"}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Week sections */}
      {error ? (
        <View style={[styles.errorWrap, { paddingTop: insets.top + 60 }]}>
          <Text style={[styles.errorText, { color: colors.mutedForeground }]}>
            {error}
          </Text>
          <Pressable
            onPress={() => refetch()}
            style={({ pressed }) => [
              styles.retryBtn,
              { backgroundColor: colors.primary },
              pressed && { opacity: 0.9 },
            ]}
          >
            <Text
              style={[styles.retryBtnText, { color: colors.primaryForeground }]}
            >
              Retry
            </Text>
          </Pressable>
        </View>
      ) : loading && sections.length === 0 ? (
        <View style={[styles.loadingWrap, { paddingTop: insets.top + 60 }]}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>
            Loading calendar…
          </Text>
        </View>
      ) : (
        <FlatList<SectionType>
          data={sections}
          keyExtractor={keyExtractor}
          renderItem={renderWeekBlock}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: insets.bottom + 24 },
          ]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
            />
          }
        />
      )}

      <AddActionSheet
        visible={addSheetVisible}
        dateLabel={
          addSheetDateISO ? formatDateLabel(addSheetDateISO) : undefined
        }
        onClose={closeAddSheet}
        onSelect={handleAddAction}
      />

      {/* Filter sheet */}
      <Modal
        visible={filterVisible}
        transparent
        animationType="fade"
        onRequestClose={closeFilter}
      >
        <Pressable style={styles.filterOverlay} onPress={closeFilter}>
          <Pressable
            style={[styles.filterSheet, { backgroundColor: colors.background }]}
            onPress={(e) => e.stopPropagation()}
          >
            <View
              style={[styles.filterHandle, { backgroundColor: colors.border }]}
            />
            <Text style={[styles.filterTitle, { color: colors.foreground }]}>
              Filter
            </Text>
            <View
              style={[styles.filterRow, { borderBottomColor: colors.border }]}
            >
              <Text style={[styles.filterLabel, { color: colors.foreground }]}>
                Show past entries
              </Text>
              <Switch
                value={showPastEntries}
                onValueChange={setShowPastEntries}
                trackColor={{ false: colors.muted, true: colors.primary }}
                thumbColor={colors.primaryForeground}
              />
            </View>
            <Pressable
              onPress={closeFilter}
              style={[styles.filterDone, { backgroundColor: colors.primary }]}
            >
              <Text
                style={[
                  styles.filterDoneText,
                  { color: colors.primaryForeground },
                ]}
              >
                Done
              </Text>
            </Pressable>
            <View style={{ height: insets.bottom + 16 }} />
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: { padding: 4, marginRight: 8 },
  pressed: { opacity: 0.7 },
  title: {
    flex: 1,
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  iconBtn: { padding: 6 },
  segmentedWrap: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  segment: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: radius.lg,
    alignItems: "center",
  },
  segmentText: {
    fontSize: 14,
    fontWeight: "600",
  },
  listContent: {
    paddingHorizontal: 12,
    paddingTop: 12,
  },
  loadingWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  loadingText: {
    fontSize: 15,
  },
  errorWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    gap: 16,
  },
  errorText: {
    fontSize: 15,
    textAlign: "center",
  },
  retryBtn: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: radius.lg,
  },
  retryBtnText: {
    fontSize: 16,
    fontWeight: "600",
  },
  weekBlock: {
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
    marginBottom: 16,
  },
  filterOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  filterSheet: {
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingTop: 12,
    paddingHorizontal: 16,
  },
  filterHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 16,
  },
  filterTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
  },
  filterRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  filterLabel: {
    fontSize: 16,
  },
  filterDone: {
    marginTop: 20,
    paddingVertical: 14,
    borderRadius: radius.md,
    alignItems: "center",
  },
  filterDoneText: {
    fontSize: 16,
    fontWeight: "600",
  },
});
