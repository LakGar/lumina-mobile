import { createEntry } from "@/constants/mock-journals";
import { Colors, radius } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, { useCallback } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

const DEFAULT_JOURNAL_ID = "j2";

const TOPICS = [
  "Gratitude",
  "Mood",
  "Goals",
  "Reflection",
  "Daily wins",
  "Intentions",
];

export function ExploreTopicPills() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  const onPress = useCallback(
    (topic: string) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const newEntry = createEntry(DEFAULT_JOURNAL_ID, topic);
      router.push({
        pathname: "/(home)/entry/[entryId]",
        params: { entryId: newEntry.id, journalId: DEFAULT_JOURNAL_ID },
      });
    },
    [router],
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
