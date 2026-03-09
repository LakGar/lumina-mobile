import { hexToRgba, radius, Shadows } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useThemeColors } from "@/hooks/use-theme-colors";
import Ionicons from "@expo/vector-icons/Ionicons";
import { GlassView } from "expo-glass-effect";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useCallback, useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { ThemedText } from "./themed-text";

type ExploreDiscoverProps = {
  onStartJournaling?: (prompt: string) => void;
  /** When set, card tap opens this callback with card info (e.g. to show a modal) instead of starting journaling directly. */
  onCardPress?: (id: string, label: string, subtitle: string) => void;
};

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
}> = [
  { id: "topics", label: "Topics", subtitle: "Gratitude, goals, mood", icon: "albums-outline" },
  { id: "prompts", label: "Popular prompts", subtitle: "Trending this week", icon: "chatbubble-ellipses-outline" },
  { id: "tips", label: "Writing tip", subtitle: "Short reflections work", icon: "bulb-outline" },
  { id: "guided", label: "Guided", subtitle: "Step-by-step flows", icon: "navigate-outline" },
];

export function ExploreDiscover({
  onStartJournaling,
  onCardPress,
}: ExploreDiscoverProps) {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = useThemeColors();
  const isDark = colorScheme === "dark";

  const tileGradients = useMemo(() => {
    const primary = colors.primary;
    const accent = colors.accent;
    const muted = colors.muted;
    const mutedFg = colors.mutedForeground;
    return {
      topics: [colors.card, hexToRgba(accent, isDark ? 0.1 : 0.5), hexToRgba(primary, isDark ? 0.03 : 0.06)] as const,
      prompts: [colors.card, hexToRgba(accent, isDark ? 0.1 : 0.45), hexToRgba(primary, isDark ? 0.04 : 0.05)] as const,
      tips: [colors.card, hexToRgba(accent, isDark ? 0.06 : 0.5), hexToRgba(primary, isDark ? 0.08 : 0.05)] as const,
      guided: [colors.card, hexToRgba(muted, isDark ? 0.06 : 0.9), hexToRgba(mutedFg, isDark ? 0.02 : 0.04)] as const,
    };
  }, [colors, isDark]);

  const onPress = useCallback(
    (id: string, label: string, subtitle: string) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      if (onCardPress) {
        onCardPress(id, label, subtitle);
        return;
      }
      if (id === "guided") {
        router.push("/(home)/(tabs)/journals");
        return;
      }
      if (onStartJournaling) {
        const prompt =
          id === "topics"
            ? "Gratitude, goals, mood"
            : id === "prompts"
              ? "Trending this week"
              : id === "tips"
                ? "Writing tip: Short reflections work"
                : subtitle;
        onStartJournaling(prompt);
      }
    },
    [router, onStartJournaling, onCardPress],
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
              colors={tileGradients[item.id as keyof typeof tileGradients]}
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
