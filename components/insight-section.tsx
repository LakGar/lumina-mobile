import { Colors, radius, Shadows } from "@/constants/theme";
import { useApi } from "@/hooks/use-api";
import { useColorScheme } from "@/hooks/use-color-scheme";
import type { MoodLog } from "@/lib/api";
import Ionicons from "@expo/vector-icons/Ionicons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useRef, useState } from "react";
import {
  Alert,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { ThemedText } from "./themed-text";

export type InsightSectionProps = {
  selectedDate?: Date;
  entriesThisWeek?: number | null;
  entriesForSelectedDay?: number | null;
  lastJournalEntry?: { title: string; daysAgo: number } | null;
  journaledDaysThisWeek?: boolean[] | null;
  /** @deprecated Mood card now uses standalone general moods from GET /api/moods */
  recentMoodSummary?: { lastMood: string; count: number } | null;
  /** Lumina level score (0 when no backend). */
  luminaScore?: number;
  /** Optional: navigate to mood trends screen (e.g. "View trends" link). */
  onNavigateToMood?: () => void;
  onCreateEntry: () => void;
  onNavigateToEntry: (entryId: string, journalId: string) => void;
  onNavigateToCreateJournal?: () => void;
};

const LUMINA_TIERS = [
  { id: "bronze", label: "Bronze", progressMax: 100 },
  { id: "silver", label: "Silver", progressMax: 100 },
  { id: "gold", label: "Gold", progressMax: 100 },
  { id: "platinum", label: "Platinum", progressMax: 100 },
  { id: "diamond", label: "Diamond", progressMax: 100 },
  { id: "expert", label: "Expert", progressMax: 100 },
] as const;

const WEEKDAY_LABELS = ["M", "T", "W", "T", "F", "S", "S"];

const DEFAULT_WEEK_BAR = [
  false,
  false,
  false,
  false,
  false,
  false,
  false,
] as const;

const CARD_WIDTH_PCT = "48.8%";

export function InsightSection({
  selectedDate,
  entriesThisWeek: entriesThisWeekProp,
  entriesForSelectedDay,
  lastJournalEntry,
  journaledDaysThisWeek,
  recentMoodSummary,
  luminaScore = 0,
  onNavigateToMood,
  onCreateEntry,
  onNavigateToEntry,
  onNavigateToCreateJournal,
}: InsightSectionProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const api = useApi();
  const entriesThisWeek = entriesThisWeekProp ?? 0;
  const weekBar = journaledDaysThisWeek ?? [...DEFAULT_WEEK_BAR];
  const tier = LUMINA_TIERS[0];
  const progressPct = Math.min(100, Math.max(0, luminaScore));

  const [generalMoods, setGeneralMoods] = useState<MoodLog[]>([]);
  const [moodModalVisible, setMoodModalVisible] = useState(false);
  const [moodTitleInput, setMoodTitleInput] = useState("");
  const [moodNoteInput, setMoodNoteInput] = useState("");
  const [moodSubmitting, setMoodSubmitting] = useState(false);
  const apiRef = useRef(api);
  apiRef.current = api;

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      apiRef.current
        .fetchMoods({ limit: 30 })
        .then((list) => {
          if (!cancelled) setGeneralMoods(list);
        })
        .catch(() => {
          if (!cancelled) setGeneralMoods([]);
        });
      return () => {
        cancelled = true;
      };
    }, []),
  );

  const lastGeneralMood = generalMoods[0] ?? null;
  const generalMoodCount = generalMoods.length;

  const openLogMoodModal = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setMoodTitleInput("");
    setMoodNoteInput("");
    setMoodModalVisible(true);
  }, []);

  const closeLogMoodModal = useCallback(() => {
    setMoodModalVisible(false);
    setMoodTitleInput("");
    setMoodNoteInput("");
  }, []);

  const submitLogMood = useCallback(() => {
    const title = moodTitleInput.trim();
    if (!title) {
      Alert.alert("Mood required", "Please enter how you're feeling.");
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setMoodSubmitting(true);
    api
      .createMood({
        title,
        note: moodNoteInput.trim() || null,
      })
      .then((newMood) => {
        setGeneralMoods((prev) => [newMood, ...prev]);
        closeLogMoodModal();
      })
      .catch(() => {
        Alert.alert("Error", "Could not save mood. Please try again.");
      })
      .finally(() => {
        setMoodSubmitting(false);
      });
  }, [api, moodTitleInput, moodNoteInput, closeLogMoodModal]);

  // Gradient backgrounds – soft wash from card to theme tint
  type GradientTuple = readonly [string, string, string];
  const cardGradients: Record<
    "level" | "lastJournal" | "weekly" | "entries" | "mood",
    GradientTuple
  > = {
    level:
      colorScheme === "dark"
        ? [colors.card, "rgba(249, 115, 22, 0.14)", "rgba(254, 243, 199, 0.04)"]
        : [colors.card, "rgba(254, 243, 199, 0.5)", "rgba(194, 65, 12, 0.06)"],
    lastJournal:
      colorScheme === "dark"
        ? [colors.card, "rgba(168, 85, 247, 0.12)", "rgba(233, 213, 255, 0.04)"]
        : [
            colors.card,
            "rgba(233, 213, 255, 0.35)",
            "rgba(168, 85, 247, 0.06)",
          ],
    weekly:
      colorScheme === "dark"
        ? [colors.card, "rgba(180, 83, 9, 0.12)", "rgba(254, 243, 199, 0.04)"]
        : [colors.card, "rgba(254, 243, 199, 0.4)", "rgba(180, 83, 9, 0.07)"],
    entries:
      colorScheme === "dark"
        ? [
            colors.card,
            "rgba(212, 212, 216, 0.08)",
            "rgba(250, 250, 250, 0.03)",
          ]
        : [
            colors.card,
            "rgba(245, 245, 244, 0.8)",
            "rgba(115, 115, 115, 0.05)",
          ],
    mood:
      colorScheme === "dark"
        ? [colors.card, "rgba(34, 197, 94, 0.12)", "rgba(187, 247, 208, 0.04)"]
        : [colors.card, "rgba(187, 247, 208, 0.5)", "rgba(34, 197, 94, 0.08)"],
  };

  // Title strip backgrounds – clearer, still on theme
  const titleBg = {
    level:
      colorScheme === "dark"
        ? "rgba(249, 115, 22, 0.22)"
        : "rgba(194, 65, 12, 0.14)",
    lastJournal:
      colorScheme === "dark"
        ? "rgba(168, 85, 247, 0.2)"
        : "rgba(168, 85, 247, 0.12)",
    weekly:
      colorScheme === "dark"
        ? "rgba(180, 83, 9, 0.22)"
        : "rgba(180, 83, 9, 0.14)",
    entries:
      colorScheme === "dark"
        ? "rgba(161, 161, 170, 0.18)"
        : "rgba(115, 115, 115, 0.12)",
    mood:
      colorScheme === "dark"
        ? "rgba(34, 197, 94, 0.2)"
        : "rgba(34, 197, 94, 0.14)",
  };
  const titleColor = {
    level: colorScheme === "dark" ? "#fed7aa" : "#9a3412",
    lastJournal: colorScheme === "dark" ? "#e9d5ff" : "#6b21a8",
    weekly: colorScheme === "dark" ? "#fef3c7" : "#92400e",
    entries: colorScheme === "dark" ? "#d4d4d8" : "#52525b",
    mood: colorScheme === "dark" ? "#86efac" : "#15803d",
  };

  const handlePress = useCallback((action: () => void) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    action();
  }, []);

  const onWriteEntry = useCallback(() => {
    handlePress(onCreateEntry);
  }, [handlePress, onCreateEntry]);

  const router = useRouter();
  const onCreateJournal = useCallback(() => {
    const go =
      onNavigateToCreateJournal ??
      (() => router.push("/(home)/create-journal"));
    handlePress(go);
  }, [handlePress, onNavigateToCreateJournal, router]);

  const onPreviousEntry = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      const entries = await api.fetchMyEntries(1);
      const first = entries[0];
      if (!first) {
        Alert.alert("No entries yet", "Write your first entry to see it here.");
        return;
      }
      onNavigateToEntry(first.id, first.journalId);
    } catch (e) {
      Alert.alert(
        "Error",
        e instanceof Error ? e.message : "Could not load previous entry",
      );
    }
  }, [api, onNavigateToEntry]);

  const lastJournalDaysAgo = lastJournalEntry?.daysAgo ?? null;
  const lastJournalTitle = lastJournalEntry?.title ?? null;
  const lastJournalText =
    lastJournalEntry == null
      ? "No entries yet"
      : lastJournalDaysAgo === 0
        ? "Today"
        : lastJournalDaysAgo === 1
          ? "Yesterday"
          : `${lastJournalDaysAgo} days ago`;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="stats-chart-outline" size={20} color={colors.primary} />
        <ThemedText
          type="default"
          style={[styles.sectionLabel, { color: colors.mutedForeground }]}
        >
          Insight
        </ThemedText>
      </View>

      <View style={styles.grid}>
        {/* Lumina level card */}
        <View
          style={[
            styles.tile,
            { borderColor: colors.border },
            { width: CARD_WIDTH_PCT },
            Shadows.sm,
          ]}
        >
          <LinearGradient
            colors={cardGradients.level}
            style={StyleSheet.absoluteFillObject}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
          <View style={styles.tileContent}>
            <View
              style={[styles.titlePill, { backgroundColor: titleBg.level }]}
            >
              <Text style={[styles.tileLabel, { color: titleColor.level }]}>
                Lumina level
              </Text>
            </View>
            <View>
              <Text style={[styles.tileValue, { color: colors.foreground }]}>
                {luminaScore > 0 ? (tier?.label ?? "Bronze") : "0"}
              </Text>
              <View
                style={[
                  styles.progressTrack,
                  { backgroundColor: colors.muted },
                ]}
              >
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${progressPct}%`,
                      backgroundColor: colors.primary,
                    },
                  ]}
                />
              </View>
              <Text
                style={[
                  styles.tileValueSecondary,
                  { color: colors.foreground },
                ]}
              >
                {luminaScore > 0
                  ? "Keep journaling to level up"
                  : "Start journaling to earn points"}
              </Text>
            </View>
          </View>
        </View>

        {/* Last journal card */}
        <View
          style={[
            styles.tile,
            { borderColor: colors.border },
            { width: CARD_WIDTH_PCT },
            Shadows.sm,
          ]}
        >
          <LinearGradient
            colors={cardGradients.lastJournal}
            style={StyleSheet.absoluteFillObject}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
          <View style={styles.tileContent}>
            <View
              style={[
                styles.titlePill,
                { backgroundColor: titleBg.lastJournal },
              ]}
            >
              <Text
                style={[styles.tileLabel, { color: titleColor.lastJournal }]}
              >
                Last journal
              </Text>
            </View>
            <Text
              style={[styles.tileValue, { color: colors.foreground }]}
              numberOfLines={2}
            >
              {lastJournalText}
              {lastJournalTitle ? ` · ${lastJournalTitle}` : ""}
            </Text>
          </View>
        </View>

        {/* This week: journaled every day? */}
        <View
          style={[
            styles.tile,
            { borderColor: colors.border },
            { width: CARD_WIDTH_PCT },
            Shadows.sm,
          ]}
        >
          <LinearGradient
            colors={cardGradients.weekly}
            style={StyleSheet.absoluteFillObject}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
          <View style={styles.tileContent}>
            <View
              style={[styles.titlePill, { backgroundColor: titleBg.weekly }]}
            >
              <Text style={[styles.tileLabel, { color: titleColor.weekly }]}>
                This week
              </Text>
            </View>
            <View>
              <View style={styles.weekBarLabels}>
                <Text
                  style={[styles.dayLabel, { color: colors.mutedForeground }]}
                >
                  {weekBar.every(Boolean)
                    ? "JOURNALED EVERY DAY"
                    : "DAYS JOURNALED"}
                </Text>
                <Text
                  style={[
                    styles.tileValue,
                    { color: colors.foreground, marginBottom: 0 },
                  ]}
                >
                  {weekBar.every(Boolean)
                    ? "Every day!"
                    : `${weekBar.filter(Boolean).length}/7 days`}
                </Text>
              </View>
              <View style={styles.weekBar}>
                {WEEKDAY_LABELS.map((day, i) => (
                  <View key={i} style={styles.daySegmentWrap}>
                    <View
                      style={[
                        styles.daySegment,
                        {
                          backgroundColor: weekBar[i]
                            ? colors.primary
                            : colors.muted,
                          opacity: weekBar[i] ? 1 : 0.5,
                        },
                      ]}
                    />
                  </View>
                ))}
              </View>
            </View>
          </View>
        </View>

        {/* Entries this week card */}
        <View
          style={[
            styles.tile,
            { borderColor: colors.border },
            { width: CARD_WIDTH_PCT },
            Shadows.sm,
          ]}
        >
          <LinearGradient
            colors={cardGradients.entries}
            style={StyleSheet.absoluteFillObject}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
          <View style={styles.tileContent}>
            <View
              style={[styles.titlePill, { backgroundColor: titleBg.entries }]}
            >
              <Text style={[styles.tileLabel, { color: titleColor.entries }]}>
                Entries this week
              </Text>
            </View>
            <Text style={[styles.tileValue, { color: colors.foreground }]}>
              {entriesThisWeek}
            </Text>
          </View>
        </View>

        {/* Mood card – general mood (standalone), not tied to a journal */}
        <Pressable
          onPress={openLogMoodModal}
          style={({ pressed }) => [
            styles.tile,
            { borderColor: colors.border, width: CARD_WIDTH_PCT },
            Shadows.sm,
            pressed && { opacity: 0.9 },
          ]}
        >
          <LinearGradient
            colors={cardGradients.mood}
            style={StyleSheet.absoluteFillObject}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
          <View style={styles.tileContent}>
            <View style={[styles.titlePill, { backgroundColor: titleBg.mood }]}>
              <Text style={[styles.tileLabel, { color: titleColor.mood }]}>
                Mood
              </Text>
            </View>
            <Text
              style={[styles.tileValue, { color: colors.foreground }]}
              numberOfLines={1}
            >
              {lastGeneralMood ? lastGeneralMood.title : "—"}
            </Text>
            <Text
              style={[
                styles.tileValueSecondary,
                { color: colors.mutedForeground },
              ]}
            >
              {generalMoodCount > 0
                ? `${generalMoodCount} logged`
                : "Tap to log mood"}
            </Text>
          </View>
        </Pressable>
      </View>

      {/* Log mood modal – general mood with optional note */}
      <Modal
        visible={moodModalVisible}
        transparent
        animationType="fade"
        onRequestClose={closeLogMoodModal}
      >
        <Pressable style={styles.modalBackdrop} onPress={closeLogMoodModal}>
          <Pressable
            style={[
              styles.modalCard,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
              },
            ]}
            onPress={(e) => e.stopPropagation()}
          >
            <ThemedText style={styles.modalTitle}>Log mood</ThemedText>
            <Text
              style={[styles.modalLabel, { color: colors.mutedForeground }]}
            >
              How are you feeling?
            </Text>
            <TextInput
              style={[
                styles.modalInput,
                {
                  backgroundColor: colors.background,
                  borderColor: colors.border,
                  color: colors.foreground,
                },
              ]}
              placeholder="e.g. Grateful, Calm, Tired"
              placeholderTextColor={colors.mutedForeground}
              value={moodTitleInput}
              onChangeText={setMoodTitleInput}
              autoCapitalize="sentences"
              editable={!moodSubmitting}
            />
            <Text
              style={[styles.modalLabel, { color: colors.mutedForeground }]}
            >
              Additional note (optional)
            </Text>
            <TextInput
              style={[
                styles.modalInput,
                styles.modalInputMultiline,
                {
                  backgroundColor: colors.background,
                  borderColor: colors.border,
                  color: colors.foreground,
                },
              ]}
              placeholder="Any context or reflection..."
              placeholderTextColor={colors.mutedForeground}
              value={moodNoteInput}
              onChangeText={setMoodNoteInput}
              multiline
              numberOfLines={3}
              editable={!moodSubmitting}
            />
            <View style={styles.modalActions}>
              <Pressable
                onPress={closeLogMoodModal}
                disabled={moodSubmitting}
                style={({ pressed }) => [
                  styles.modalButton,
                  { borderColor: colors.border },
                  pressed && { opacity: 0.7 },
                ]}
              >
                <Text
                  style={[styles.modalButtonText, { color: colors.foreground }]}
                >
                  Cancel
                </Text>
              </Pressable>
              <Pressable
                onPress={submitLogMood}
                disabled={moodSubmitting}
                style={({ pressed }) => [
                  styles.modalButton,
                  { backgroundColor: colors.primary },
                  pressed && { opacity: 0.85 },
                ]}
              >
                {moodSubmitting ? (
                  <Text
                    style={[
                      styles.modalButtonText,
                      { color: colors.primaryForeground },
                    ]}
                  >
                    Saving...
                  </Text>
                ) : (
                  <Text
                    style={[
                      styles.modalButtonText,
                      { color: colors.primaryForeground },
                    ]}
                  >
                    Save
                  </Text>
                )}
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Action buttons – full width row */}
      <View style={styles.actions}>
        <Pressable
          onPress={() => handlePress(onWriteEntry)}
          style={({ pressed }) => [
            styles.actionBtn,
            { backgroundColor: colors.primary },
            pressed && { opacity: 0.85 },
          ]}
        >
          <Ionicons name="pencil" size={18} color={colors.primaryForeground} />
          <Text
            style={[styles.actionBtnText, { color: colors.primaryForeground }]}
          >
            Write entry
          </Text>
        </Pressable>
        <Pressable
          onPress={() => handlePress(onCreateJournal)}
          style={({ pressed }) => [
            styles.actionBtn,
            {
              backgroundColor: colors.accent,
              borderWidth: StyleSheet.hairlineWidth,
              borderColor: colors.border,
            },
            pressed && { opacity: 0.85 },
          ]}
        >
          <Ionicons
            name="journal-outline"
            size={18}
            color={colors.foreground}
          />
          <Text style={[styles.actionBtnText, { color: colors.foreground }]}>
            Create journal
          </Text>
        </Pressable>
        <Pressable
          onPress={() => handlePress(onPreviousEntry)}
          style={({ pressed }) => [
            styles.actionBtn,
            {
              backgroundColor: colors.accent,
              borderWidth: StyleSheet.hairlineWidth,
              borderColor: colors.border,
            },
            pressed && { opacity: 0.85 },
          ]}
        >
          <Ionicons name="time-outline" size={18} color={colors.foreground} />
          <Text style={[styles.actionBtnText, { color: colors.foreground }]}>
            Previous entry
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 8,
  },
  tile: {
    borderRadius: radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
    minHeight: 170,
    position: "relative",
    width: CARD_WIDTH_PCT,
  },
  tileContent: {
    padding: 12,
    position: "relative",
    zIndex: 1,
    flexDirection: "column",
    justifyContent: "space-between",
    flex: 1,
  },
  titlePill: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.md,
    marginBottom: 8,
  },
  tileLabel: {
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  tileValue: {
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 6,
    width: "100%",
    textAlign: "right",
  },
  tileValueSecondary: {
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.4,
    marginBottom: 4,
    textAlign: "right",
    marginTop: 4,
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
    marginTop: 2,
  },
  progressFill: {
    height: "100%",
    borderRadius: 3,
  },
  weekBar: {
    flexDirection: "row",
    gap: 4,
    marginTop: 4,
  },
  daySegmentWrap: {
    flex: 1,
    alignItems: "center",
  },
  daySegment: {
    width: "100%",
    height: 5,
    borderRadius: 1,
    marginBottom: 2,
  },
  weekBarLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
    alignItems: "flex-end",
  },
  dayLabel: {
    fontSize: 9,
    fontWeight: "600",
  },
  actions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 14,
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: radius.lg,
  },
  actionBtnText: {
    fontSize: 13,
    fontWeight: "600",
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  modalCard: {
    width: "100%",
    maxWidth: 360,
    borderRadius: radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 20,
    ...Shadows.lg,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 16,
  },
  modalLabel: {
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 6,
  },
  modalInput: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.lg,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 14,
  },
  modalInputMultiline: {
    minHeight: 72,
    textAlignVertical: "top",
  },
  modalActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: radius.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
});
