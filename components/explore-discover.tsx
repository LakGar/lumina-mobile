import { createEntry } from "@/constants/mock-journals";
import { Colors, radius, Shadows } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import Ionicons from "@expo/vector-icons/Ionicons";
import { GlassView } from "expo-glass-effect";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useCallback } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { ThemedText } from "./themed-text";

const DEFAULT_JOURNAL_ID = "j2";

const CARD_WIDTH_PCT = "48%";

const DISCOVER_ITEMS: Array<{
  id: string;
  label: string;
  subtitle: string;
  icon:
    | "albums-outline"
    | "chatbubble-ellipses-outline"
    | "bulb-outline"
    | "navigate-outline";
  gradientLight: [string, string];
  gradientDark: [string, string];
}> = [
  {
    id: "topics",
    label: "Topics",
    subtitle: "Gratitude, goals, mood",
    icon: "albums-outline",
    gradientLight: ["rgba(254, 243, 199, 0.5)", "rgba(194, 65, 12, 0.06)"],
    gradientDark: ["rgba(249, 115, 22, 0.1)", "rgba(254, 243, 199, 0.03)"],
  },
  {
    id: "prompts",
    label: "Popular prompts",
    subtitle: "Trending this week",
    icon: "chatbubble-ellipses-outline",
    gradientLight: ["rgba(233, 213, 255, 0.45)", "rgba(168, 85, 247, 0.05)"],
    gradientDark: ["rgba(168, 85, 247, 0.1)", "rgba(233, 213, 255, 0.04)"],
  },
  {
    id: "tips",
    label: "Writing tip",
    subtitle: "Short reflections work",
    icon: "bulb-outline",
    gradientLight: ["rgba(254, 243, 199, 0.5)", "rgba(180, 83, 9, 0.05)"],
    gradientDark: ["rgba(254, 243, 199, 0.06)", "rgba(180, 83, 9, 0.08)"],
  },
  {
    id: "guided",
    label: "Guided",
    subtitle: "Step-by-step flows",
    icon: "navigate-outline",
    gradientLight: ["rgba(245, 245, 244, 0.9)", "rgba(115, 115, 115, 0.04)"],
    gradientDark: ["rgba(212, 212, 216, 0.06)", "rgba(250, 250, 250, 0.02)"],
  },
];

export function ExploreDiscover() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  const onPress = useCallback(
    (id: string, label: string, subtitle: string) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      if (id === "guided") {
        router.push("/(home)/(tabs)/journals");
        return;
      }
      if (id === "topics") {
        const newEntry = createEntry(
          DEFAULT_JOURNAL_ID,
          "Gratitude, goals, mood",
        );
        router.push({
          pathname: "/(home)/entry/[entryId]",
          params: { entryId: newEntry.id, journalId: DEFAULT_JOURNAL_ID },
        });
        return;
      }
      if (id === "prompts") {
        const newEntry = createEntry(DEFAULT_JOURNAL_ID, "Trending this week");
        router.push({
          pathname: "/(home)/entry/[entryId]",
          params: { entryId: newEntry.id, journalId: DEFAULT_JOURNAL_ID },
        });
        return;
      }
      if (id === "tips") {
        const newEntry = createEntry(
          DEFAULT_JOURNAL_ID,
          "Writing tip: Short reflections work",
        );
        router.push({
          pathname: "/(home)/entry/[entryId]",
          params: { entryId: newEntry.id, journalId: DEFAULT_JOURNAL_ID },
        });
      }
    },
    [router],
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="compass-outline" size={20} color={colors.primary} />
        <ThemedText
          type="default"
          style={[styles.sectionLabel, { color: colors.mutedForeground }]}
        >
          Discover
        </ThemedText>
      </View>
      <View style={styles.grid}>
        {DISCOVER_ITEMS.map((item) => (
          <Pressable
            key={item.id}
            onPress={() => onPress(item.id, item.label, item.subtitle)}
            style={({ pressed }) => [
              styles.tile,
              { borderColor: colors.border },
              { width: CARD_WIDTH_PCT },
              Shadows.sm,
              pressed && { opacity: 0.92 },
            ]}
          >
            <LinearGradient
              colors={[
                colors.card,
                ...(colorScheme === "dark"
                  ? item.gradientDark
                  : item.gradientLight),
              ]}
              style={StyleSheet.absoluteFillObject}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            />
            <View style={styles.tileContent}>
              <GlassView
                style={[styles.iconWrap, { backgroundColor: colors.muted }]}
              >
                <Ionicons name={item.icon} size={22} color={colors.primary} />
              </GlassView>
              <Text
                style={[styles.tileLabel, { color: colors.foreground }]}
                numberOfLines={1}
              >
                {item.label}
              </Text>
              <Text
                style={[styles.tileSubtitle, { color: colors.mutedForeground }]}
                numberOfLines={1}
              >
                {item.subtitle}
              </Text>
            </View>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingBottom: 24,
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
    gap: 12,
  },
  tile: {
    borderRadius: radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
    minHeight: 96,
    position: "relative",
  },
  tileContent: {
    padding: 12,
    position: "relative",
    zIndex: 1,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  tileLabel: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 2,
  },
  tileSubtitle: {
    fontSize: 12,
  },
});
