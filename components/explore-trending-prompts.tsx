import { radius, Shadows } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useThemeColors } from "@/hooks/use-theme-colors";
import Ionicons from "@expo/vector-icons/Ionicons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import {
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { ThemedText } from "./themed-text";

const CARD_WIDTH = Dimensions.get("window").width * 0.7;
const CARD_MARGIN = 10;

const TRENDING_PROMPTS: Array<{
  id: string;
  text: string;
  gradientLight: [string, string];
  gradientDark: [string, string];
}> = [
  {
    id: "1",
    text: "What made you smile today?",
    gradientLight: ["rgba(254, 243, 199, 0.85)", "rgba(194, 65, 12, 0.08)"],
    gradientDark: ["rgba(249, 115, 22, 0.15)", "rgba(254, 243, 199, 0.05)"],
  },
  {
    id: "2",
    text: "One thing you’d do differently this week",
    gradientLight: ["rgba(233, 213, 255, 0.8)", "rgba(168, 85, 247, 0.06)"],
    gradientDark: ["rgba(168, 85, 247, 0.12)", "rgba(233, 213, 255, 0.04)"],
  },
  {
    id: "3",
    text: "Who are you grateful for right now?",
    gradientLight: ["rgba(187, 247, 208, 0.7)", "rgba(34, 197, 94, 0.06)"],
    gradientDark: ["rgba(34, 197, 94, 0.1)", "rgba(187, 247, 208, 0.04)"],
  },
  {
    id: "4",
    text: "What are you most proud of this month?",
    gradientLight: ["rgba(254, 215, 170, 0.8)", "rgba(234, 88, 12, 0.06)"],
    gradientDark: ["rgba(234, 88, 12, 0.1)", "rgba(254, 215, 170, 0.04)"],
  },
];

type ExploreTrendingPromptsProps = {
  onStartJournaling?: (prompt: string) => void;
};

export function ExploreTrendingPrompts({
  onStartJournaling,
}: ExploreTrendingPromptsProps) {
  const colorScheme = useColorScheme();
  const colors = useThemeColors();

  const onPress = (item: (typeof TRENDING_PROMPTS)[0]) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onStartJournaling?.(item.text);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="trending-up" size={20} color={colors.primary} />
        <ThemedText
          type="default"
          style={[styles.sectionLabel, { color: colors.mutedForeground }]}
        >
          Trending prompts
        </ThemedText>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {TRENDING_PROMPTS.map((item) => (
          <Pressable
            key={item.id}
            onPress={() => onPress(item)}
            style={({ pressed }) => [
              styles.card,
              { borderColor: colors.border },
              Shadows.sm,
              pressed && { opacity: 0.92 },
            ]}
          >
            <LinearGradient
              colors={
                colorScheme === "dark" ? item.gradientDark : item.gradientLight
              }
              style={StyleSheet.absoluteFillObject}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            />
            <View style={styles.cardInner}>
              <Text
                style={[styles.promptText, { color: colors.foreground }]}
                numberOfLines={3}
              >
                {item.text}
              </Text>
              <View style={styles.useRow}>
                <Ionicons name="pencil" size={14} color={colors.primary} />
                <Text style={[styles.useLabel, { color: colors.primary }]}>
                  Use prompt
                </Text>
              </View>
            </View>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 20,
    paddingBottom: 4,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  scrollContent: {
    paddingHorizontal: 20,
    gap: CARD_MARGIN,
    paddingBottom: 8,
  },
  card: {
    width: CARD_WIDTH,
    minHeight: 100,
    borderRadius: radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
  },
  cardInner: {
    padding: 14,
    minHeight: 100,
    justifyContent: "space-between",
  },
  promptText: {
    fontSize: 15,
    lineHeight: 21,
    marginBottom: 10,
  },
  useRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  useLabel: {
    fontSize: 13,
    fontWeight: "600",
  },
});
