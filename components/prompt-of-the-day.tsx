import { hexToRgba, radius, Shadows } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useThemeColors } from "@/hooks/use-theme-colors";
import Ionicons from "@expo/vector-icons/Ionicons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import React, { useCallback, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { ThemedText } from "./themed-text";

const PROMPTS = [
  "What’s one small win you’re grateful for today?",
  "Describe a moment this week when you felt at peace.",
  "What would you tell your past self from a year ago?",
  "Who supported you recently, and how did it feel?",
  "What’s something you’re looking forward to?",
  "If today had a theme song, what would it be and why?",
  "What’s a boundary you want to set or respect this week?",
];

function getRandomPrompt() {
  return PROMPTS[Math.floor(Math.random() * PROMPTS.length)];
}

type PromptOfTheDayProps = {
  onStartJournaling?: (prompt: string) => void;
};

export function PromptOfTheDay({ onStartJournaling }: PromptOfTheDayProps) {
  const colorScheme = useColorScheme();
  const colors = useThemeColors();
  const [prompt, setPrompt] = useState(() => getRandomPrompt());

  const onGenerate = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPrompt(getRandomPrompt());
  }, []);

  const onStartJournalingPress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onStartJournaling?.(prompt);
  }, [prompt, onStartJournaling]);

  const gradientColors: readonly [string, string, string] =
    colorScheme === "dark"
      ? [colors.card, hexToRgba(colors.accent, 0.08), hexToRgba(colors.primary, 0.06)]
      : [colors.card, hexToRgba(colors.accent, 0.6), hexToRgba(colors.primary, 0.05)];

  return (
    <View style={styles.container}>
      <View style={[styles.card, { borderColor: colors.border }, Shadows.sm]}>
        <LinearGradient
          colors={gradientColors}
          style={StyleSheet.absoluteFillObject}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
        <View style={[styles.cardInner]}>
          <View style={styles.header}>
            <ThemedText
              type="default"
              style={[
                styles.label,
                { color: colors.mutedForeground, textAlign: "center" },
              ]}
            >
              Daily Prompt
            </ThemedText>
          </View>
          <Text style={[styles.promptText, { color: colors.foreground }]}>
            {prompt}
          </Text>
          <View style={styles.buttonContainer}>
            <Pressable
              onPress={onGenerate}
              style={({ pressed }) => [
                styles.button,
                { backgroundColor: colors.accent },
                pressed && { opacity: 0.85 },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Generate new prompt"
            >
              <Ionicons name="refresh" size={16} color={colors.foreground} />
              <Text
                style={[
                  styles.buttonLabel,
                  {
                    color: colors.foreground,
                  },
                ]}
              >
                Generate new
              </Text>
            </Pressable>
            <Pressable
              onPress={onStartJournalingPress}
              style={({ pressed }) => [
                styles.button,
                { backgroundColor: colors.primary },
                pressed && { opacity: 0.85 },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Start journaling"
            >
              <Ionicons
                name="journal-outline"
                size={16}
                color={colors.primaryForeground}
              />
              <Text
                style={[
                  styles.buttonLabel,
                  { color: colors.primaryForeground },
                ]}
              >
                Start journaling
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  card: {
    borderRadius: radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
    position: "relative",
  },
  cardInner: {
    padding: 16,
    position: "relative",
    zIndex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
    width: "100%",
  },
  label: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    textAlign: "center",
    width: "100%",
    opacity: 0.6,
  },
  promptText: {
    fontSize: 19,
    lineHeight: 22,
    marginBottom: 14,
    width: "100%",
    textAlign: "center",
    paddingVertical: 20,
  },
  buttonContainer: {
    flexDirection: "row",
    gap: 10,
  },
  button: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: radius.lg,
  },
  buttonLabel: {
    fontSize: 14,
    fontWeight: "600",
  },
});
