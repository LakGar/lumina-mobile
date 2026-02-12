import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import Ionicons from "@expo/vector-icons/Ionicons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function TutorialScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const insets = useSafeAreaInsets();

  const goBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

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
          Tutorial
        </ThemedText>
        <View style={{ width: 24 }} />
      </View>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator
      >
        <View
          style={[
            styles.card,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <Ionicons name="book-outline" size={28} color={colors.primary} />
          <ThemedText style={[styles.cardTitle, { color: colors.foreground }]}>
            Create journals
          </ThemedText>
          <ThemedText
            style={[styles.cardBody, { color: colors.mutedForeground }]}
          >
            Tap Journals in the tab bar, then + to add a journal. Use journals
            to group entries by topic or goal.
          </ThemedText>
        </View>
        <View
          style={[
            styles.card,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <Ionicons name="create-outline" size={28} color={colors.primary} />
          <ThemedText style={[styles.cardTitle, { color: colors.foreground }]}>
            Write entries
          </ThemedText>
          <ThemedText
            style={[styles.cardBody, { color: colors.mutedForeground }]}
          >
            From Home, tap Create entry and choose a journal. Add a title, mood,
            and tags. Your entry is saved when you go back.
          </ThemedText>
        </View>
        <View
          style={[
            styles.card,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <Ionicons
            name="stats-chart-outline"
            size={28}
            color={colors.primary}
          />
          <ThemedText style={[styles.cardTitle, { color: colors.foreground }]}>
            Dashboard & insights
          </ThemedText>
          <ThemedText
            style={[styles.cardBody, { color: colors.mutedForeground }]}
          >
            My Dashboard shows your stats. Use the date strip to see data for
            different days. Customize which metrics appear in App Settings.
          </ThemedText>
        </View>
      </ScrollView>
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
  scrollContent: { padding: 20, paddingBottom: 40 },
  card: {
    padding: 18,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: 14,
    gap: 8,
  },
  cardTitle: { fontSize: 16, fontWeight: "600" },
  cardBody: { fontSize: 14, lineHeight: 20 },
});
