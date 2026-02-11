import { createEntry } from "@/constants/mock-journals";
import { Colors, radius, Shadows } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import Ionicons from "@expo/vector-icons/Ionicons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useCallback } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { ThemedText } from "./themed-text";

const DEFAULT_JOURNAL_ID = "j2";
/** Mock "last entry" for Previous entry button (e5 = Evening reflection in j2) */
const LAST_ENTRY_ID = "e5";

const LUMINA_TIERS = [
  { id: "bronze", label: "Bronze", progressMax: 100 },
  { id: "silver", label: "Silver", progressMax: 100 },
  { id: "gold", label: "Gold", progressMax: 100 },
  { id: "platinum", label: "Platinum", progressMax: 100 },
  { id: "diamond", label: "Diamond", progressMax: 100 },
  { id: "expert", label: "Expert", progressMax: 100 },
] as const;

const WEEKDAY_LABELS = ["M", "T", "W", "T", "F", "S", "S"];

// Mock data – replace with real state/API later
const MOCK = {
  currentTierIndex: 1,
  tierProgress: 65,
  lastJournalDaysAgo: 2,
  lastJournalTitle: "Evening reflection",
  journaledDaysThisWeek: [true, true, false, true, true, false, false],
  entriesThisWeek: 5,
};

const CARD_WIDTH_PCT = "48.8%";

export function InsightSection() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const tier = LUMINA_TIERS[MOCK.currentTierIndex];
  const progressPct = Math.min(
    100,
    (MOCK.tierProgress / (tier?.progressMax ?? 100)) * 100,
  );

  // Gradient backgrounds – soft wash from card to theme tint
  type GradientTuple = readonly [string, string, string];
  const cardGradients: Record<
    "level" | "lastJournal" | "weekly" | "entries",
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
  };
  const titleColor = {
    level: colorScheme === "dark" ? "#fed7aa" : "#9a3412",
    lastJournal: colorScheme === "dark" ? "#e9d5ff" : "#6b21a8",
    weekly: colorScheme === "dark" ? "#fef3c7" : "#92400e",
    entries: colorScheme === "dark" ? "#d4d4d8" : "#52525b",
  };

  const router = useRouter();

  const handlePress = useCallback((action: () => void) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    action();
  }, []);

  const onWriteEntry = useCallback(() => {
    const newEntry = createEntry(DEFAULT_JOURNAL_ID);
    router.push({
      pathname: "/(home)/entry/[entryId]",
      params: { entryId: newEntry.id, journalId: DEFAULT_JOURNAL_ID },
    });
  }, [router]);

  const onCreateJournal = useCallback(() => {
    router.push("/(home)/create-journal");
  }, [router]);

  const onPreviousEntry = useCallback(() => {
    router.push({
      pathname: "/(home)/entry/[entryId]",
      params: { entryId: LAST_ENTRY_ID, journalId: DEFAULT_JOURNAL_ID },
    });
  }, [router]);

  const lastJournalText =
    MOCK.lastJournalDaysAgo === 0
      ? "Today"
      : MOCK.lastJournalDaysAgo === 1
        ? "Yesterday"
        : `${MOCK.lastJournalDaysAgo} days ago`;

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
                {tier?.label ?? "Bronze"}
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
                1,345pts to Gold
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
              {MOCK.lastJournalTitle ? ` · ${MOCK.lastJournalTitle}` : ""}
            </Text>
          </View>
        </View>

        {/* Journals this week card */}
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
                  ENTRIES
                </Text>
                <Text
                  style={[
                    styles.dayLabel,
                    { color: colors.mutedForeground, fontSize: 16 },
                  ]}
                >
                  4/7
                </Text>
              </View>
              <View style={styles.weekBar}>
                {WEEKDAY_LABELS.map((day, i) => (
                  <View key={i} style={styles.daySegmentWrap}>
                    <View
                      style={[
                        styles.daySegment,
                        {
                          backgroundColor: MOCK.journaledDaysThisWeek[i]
                            ? colors.primary
                            : colors.muted,
                          opacity: MOCK.journaledDaysThisWeek[i] ? 1 : 0.5,
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
              {MOCK.entriesThisWeek}
            </Text>
          </View>
        </View>
      </View>

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
});
