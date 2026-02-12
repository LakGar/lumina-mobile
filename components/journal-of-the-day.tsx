import { Colors, radius, Shadows } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import Ionicons from "@expo/vector-icons/Ionicons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useCallback } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { ThemedText } from "./themed-text";

const MOCK_JOURNAL = {
  title: "Evening wind-down",
  description:
    "Reflect on your day with a few short answers. What went well? What would you do differently? One thing you're grateful for.",
  promptCount: 3,
};

type JournalOfTheDayProps = {
  onStartJournaling?: (prompt: string) => void;
};

export function JournalOfTheDay({ onStartJournaling }: JournalOfTheDayProps) {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  const onStart = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (onStartJournaling) {
      onStartJournaling(MOCK_JOURNAL.title);
      return;
    }
    router.push("/(home)/(tabs)/journals");
  }, [router, onStartJournaling]);

  const gradientColors: readonly [string, string, string] =
    colorScheme === "dark"
      ? [colors.card, "rgba(233, 213, 255, 0.06)", "rgba(168, 85, 247, 0.05)"]
      : [colors.card, "rgba(233, 213, 255, 0.4)", "rgba(168, 85, 247, 0.04)"];

  return (
    <View style={styles.container}>
      <View style={[styles.card, { borderColor: colors.border }, Shadows.sm]}>
        <LinearGradient
          colors={gradientColors}
          style={StyleSheet.absoluteFillObject}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
        <View style={styles.cardInner}>
          <View style={styles.header}>
            <Ionicons name="book-outline" size={20} color={colors.primary} />
            <ThemedText
              type="default"
              style={[styles.label, { color: colors.mutedForeground }]}
            >
              Journal of the day
            </ThemedText>
          </View>
          <Text style={[styles.title, { color: colors.foreground }]}>
            {MOCK_JOURNAL.title}
          </Text>
          <Text
            style={[styles.description, { color: colors.mutedForeground }]}
            numberOfLines={3}
          >
            {MOCK_JOURNAL.description}
          </Text>
          <View style={styles.footer}>
            <Text
              style={[styles.promptCount, { color: colors.mutedForeground }]}
            >
              {MOCK_JOURNAL.promptCount} prompts
            </Text>
            <Pressable
              onPress={onStart}
              style={({ pressed }) => [
                styles.button,
                { backgroundColor: colors.primary },
                pressed && { opacity: 0.85 },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Start this journal"
            >
              <Ionicons
                name="pencil"
                size={16}
                color={colors.primaryForeground}
              />
              <Text
                style={[
                  styles.buttonLabel,
                  { color: colors.primaryForeground },
                ]}
              >
                Start journal
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
    paddingBottom: 16,
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
  },
  label: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 17,
    fontWeight: "700",
    marginBottom: 6,
    textTransform: "uppercase",
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 14,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  promptCount: {
    fontSize: 12,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
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
