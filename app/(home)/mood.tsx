import { JournalSelectModal } from "@/components/journal-select-modal";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Colors, radius, Shadows } from "@/constants/theme";
import { useApi } from "@/hooks/use-api";
import { useColorScheme } from "@/hooks/use-color-scheme";
import Ionicons from "@expo/vector-icons/Ionicons";
import * as Haptics from "expo-haptics";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type MoodEntry = {
  id: string;
  journalId: string;
  mood: string;
  date: string;
};

function formatDate(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  const ymd = (x: Date) =>
    `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}-${String(x.getDate()).padStart(2, "0")}`;
  if (ymd(d) === ymd(today)) return "Today";
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (ymd(d) === ymd(yesterday)) return "Yesterday";
  return d.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export default function MoodScreen() {
  const router = useRouter();
  const api = useApi();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const insets = useSafeAreaInsets();
  const [moodEntries, setMoodEntries] = useState<MoodEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [pickerVisible, setPickerVisible] = useState(false);
  const creatingRef = useRef(false);
  const apiRef = useRef(api);
  apiRef.current = api;

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      (async () => {
        setLoading(true);
        try {
          const entries = await apiRef.current.fetchMyEntries(100);
          if (cancelled) return;
          const withMood = entries
            .filter((e) => e.mood?.trim())
            .map((e) => ({
              id: e.id,
              journalId: e.journalId,
              mood: (e.mood ?? "").trim(),
              date: e.createdAt,
            }));
          setMoodEntries(withMood);
        } catch {
          if (!cancelled) setMoodEntries([]);
        } finally {
          if (!cancelled) setLoading(false);
        }
      })();
      return () => {
        cancelled = true;
      };
    }, []),
  );

  const goBack = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  }, [router]);

  const handleJournalSelected = useCallback(
    async (journalId: string) => {
      if (creatingRef.current) return;
      creatingRef.current = true;
      try {
        const newEntry = await api.createEntry(journalId, { content: "." });
        router.push({
          pathname: "/(home)/entry/[entryId]",
          params: { entryId: newEntry.id, journalId },
        });
      } catch (e) {
        Alert.alert(
          "Error",
          e instanceof Error ? e.message : "Could not create entry",
        );
      } finally {
        creatingRef.current = false;
      }
    },
    [router, api],
  );

  const moodCountByDay = React.useMemo(() => {
    const map: Record<string, number> = {};
    for (const e of moodEntries) {
      const d = new Date(e.date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      map[key] = (map[key] ?? 0) + 1;
    }
    const last7: { label: string; count: number }[] = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      last7.push({
        label:
          i === 0
            ? "Today"
            : i === 1
              ? "Yesterday"
              : d.toLocaleDateString(undefined, { weekday: "short" }),
        count: map[key] ?? 0,
      });
    }
    return last7;
  }, [moodEntries]);

  const maxDayCount = Math.max(1, ...moodCountByDay.map((d) => d.count));

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top + 8 }]}>
      <View style={styles.header}>
        <Pressable
          onPress={goBack}
          hitSlop={12}
          style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
        >
          <Ionicons name="arrow-back" size={24} color={colors.foreground} />
        </Pressable>
        <ThemedText type="subtitle" style={styles.title}>
          Mood
        </ThemedText>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 24 },
        ]}
        showsVerticalScrollIndicator
      >
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setPickerVisible(true);
          }}
          style={({ pressed }) => [
            styles.logBtn,
            { backgroundColor: colors.primary },
            Shadows.sm,
            pressed && { opacity: 0.9 },
          ]}
        >
          <Ionicons
            name="add-circle-outline"
            size={22}
            color={colors.primaryForeground}
          />
          <Text
            style={[styles.logBtnText, { color: colors.primaryForeground }]}
          >
            Log mood
          </Text>
        </Pressable>

        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <>
            <ThemedText
              style={[styles.sectionTitle, { color: colors.mutedForeground }]}
            >
              Last 7 days
            </ThemedText>
            <View
              style={[
                styles.trendRow,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              {moodCountByDay.map((day, i) => (
                <View key={i} style={styles.trendCell}>
                  <View
                    style={[
                      styles.trendBar,
                      {
                        height: Math.max(4, (day.count / maxDayCount) * 80),
                        backgroundColor: colors.primary,
                      },
                    ]}
                  />
                  <Text
                    style={[
                      styles.trendLabel,
                      { color: colors.mutedForeground },
                    ]}
                    numberOfLines={1}
                  >
                    {day.label}
                  </Text>
                  <Text
                    style={[styles.trendCount, { color: colors.foreground }]}
                  >
                    {day.count}
                  </Text>
                </View>
              ))}
            </View>

            <ThemedText
              style={[
                styles.sectionTitle,
                { color: colors.mutedForeground, marginTop: 24 },
              ]}
            >
              Previous moods
            </ThemedText>
            {moodEntries.length === 0 ? (
              <ThemedText
                style={[styles.empty, { color: colors.mutedForeground }]}
              >
                No mood entries yet. Log a mood by creating an entry and adding
                a mood.
              </ThemedText>
            ) : (
              <View style={styles.list}>
                {moodEntries.slice(0, 30).map((e) => (
                  <Pressable
                    key={e.id}
                    onPress={() =>
                      router.push({
                        pathname: "/(home)/entry/[entryId]",
                        params: { entryId: e.id, journalId: e.journalId },
                      })
                    }
                    style={({ pressed }) => [
                      styles.row,
                      {
                        backgroundColor: colors.card,
                        borderColor: colors.border,
                      },
                      pressed && { opacity: 0.85 },
                      Shadows.xs,
                    ]}
                  >
                    <Ionicons
                      name="happy-outline"
                      size={20}
                      color={colors.primary}
                    />
                    <View style={styles.rowBody}>
                      <Text
                        style={[styles.rowMood, { color: colors.foreground }]}
                      >
                        {e.mood}
                      </Text>
                      <Text
                        style={[
                          styles.rowDate,
                          { color: colors.mutedForeground },
                        ]}
                      >
                        {formatDate(e.date)}
                      </Text>
                    </View>
                    <Ionicons
                      name="chevron-forward"
                      size={18}
                      color={colors.mutedForeground}
                    />
                  </Pressable>
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>

      <JournalSelectModal
        visible={pickerVisible}
        onClose={() => setPickerVisible(false)}
        onSelectJournal={handleJournalSelected}
        onCreateNewJournal={() => {
          setPickerVisible(false);
          router.push("/(home)/create-journal");
        }}
        fetchJournals={api.fetchJournals}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  title: { fontSize: 18 },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 8 },
  logBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: radius.lg,
    marginBottom: 20,
  },
  logBtnText: { fontSize: 16, fontWeight: "600" },
  centered: { paddingVertical: 40, alignItems: "center" },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  trendRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    padding: 12,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    minHeight: 100,
  },
  trendCell: {
    flex: 1,
    alignItems: "center",
    gap: 4,
  },
  trendBar: {
    width: 20,
    borderRadius: 4,
    minHeight: 4,
  },
  trendLabel: { fontSize: 10 },
  trendCount: { fontSize: 12, fontWeight: "600" },
  list: { gap: 8 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  rowBody: { flex: 1 },
  rowMood: { fontSize: 16, fontWeight: "500" },
  rowDate: { fontSize: 12, marginTop: 2 },
  empty: { fontSize: 14, lineHeight: 20 },
});
