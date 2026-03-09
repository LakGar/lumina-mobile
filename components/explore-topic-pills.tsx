import { radius } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useThemeColors } from "@/hooks/use-theme-colors";
import * as Haptics from "expo-haptics";
import React, { useCallback } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

const TOPICS = [
  "Gratitude",
  "Mood",
  "Goals",
  "Reflection",
  "Daily wins",
  "Intentions",
];

type ExploreTopicPillsProps = {
  onStartJournaling?: (prompt: string) => void;
};

export function ExploreTopicPills({
  onStartJournaling,
}: ExploreTopicPillsProps) {
  const colorScheme = useColorScheme();
  const colors = useThemeColors();

  const onPress = useCallback(
    (topic: string) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onStartJournaling?.(topic);
    },
    [onStartJournaling],
  );

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {TOPICS.map((topic) => (
          <Pressable
            key={topic}
            onPress={() => onPress(topic)}
            style={({ pressed }) => [
              styles.pill,
              {
                backgroundColor: colors.muted,
                borderColor: colors.border,
                opacity: pressed ? 0.85 : 1,
              },
            ]}
          >
            <Text style={[styles.pillLabel, { color: colors.foreground }]}>
              {topic}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 8,
  },
  scrollContent: {
    paddingHorizontal: 20,
    flexDirection: "row",
  },
  pill: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: radius.full,
    borderWidth: StyleSheet.hairlineWidth,
    marginRight: 10,
  },
  pillLabel: {
    fontSize: 14,
    fontWeight: "500",
  },
});
