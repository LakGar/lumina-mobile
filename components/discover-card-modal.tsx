import { Colors, radius, Shadows } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import Ionicons from "@expo/vector-icons/Ionicons";
import * as Haptics from "expo-haptics";
import React from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

const TOPICS = [
  "Gratitude",
  "Mood",
  "Goals",
  "Reflection",
  "Daily wins",
  "Intentions",
  "Mindfulness",
  "Growth",
];

const PROMPTS = [
  "What made you smile today?",
  "One thing you'd do differently this week",
  "Who are you grateful for right now?",
  "What are you most proud of this month?",
  "What's one small win from today?",
  "How are you really feeling right now?",
];

const WRITING_TIP =
  "Short reflections work. You don't need to write pages—a few sentences about your day, one thing you're grateful for, or how you feel can be enough. Consistency matters more than length.";

const GUIDED_DESCRIPTION =
  "Guided journaling walks you through prompts step by step. Open your journals to create entries and use prompts from the Explore tab to get started.";

export type DiscoverCardModalProps = {
  visible: boolean;
  onClose: () => void;
  cardId: string | null;
  cardLabel: string;
  cardSubtitle: string;
  onStartJournaling: (prompt: string) => void;
  onOpenJournals: () => void;
};

export function DiscoverCardModal({
  visible,
  onClose,
  cardId,
  cardLabel,
  cardSubtitle,
  onStartJournaling,
  onOpenJournals,
}: DiscoverCardModalProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  const handleStart = (prompt: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onClose();
    onStartJournaling(prompt);
  };

  if (!cardId) return null;

  const isGuided = cardId === "guided";

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable
        style={[styles.backdrop, { backgroundColor: "rgba(0,0,0,0.5)" }]}
        onPress={onClose}
      >
        <Pressable
          style={[styles.sheet, { backgroundColor: colors.background }]}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <Text style={[styles.title, { color: colors.foreground }]}>
              {cardLabel}
            </Text>
            <Pressable
              onPress={onClose}
              hitSlop={12}
              style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
            >
              <Ionicons name="close" size={24} color={colors.foreground} />
            </Pressable>
          </View>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator
          >
            {cardId === "topics" && (
              <View style={styles.list}>
                {TOPICS.map((topic) => (
                  <Pressable
                    key={topic}
                    onPress={() => handleStart(topic)}
                    style={({ pressed }) => [
                      styles.listItem,
                      {
                        backgroundColor: colors.card,
                        borderColor: colors.border,
                      },
                      pressed && { opacity: 0.85 },
                      Shadows.xs,
                    ]}
                  >
                    <Ionicons
                      name="albums-outline"
                      size={20}
                      color={colors.primary}
                    />
                    <Text
                      style={[
                        styles.listItemText,
                        { color: colors.foreground },
                      ]}
                    >
                      {topic}
                    </Text>
                    <Ionicons
                      name="chevron-forward"
                      size={18}
                      color={colors.mutedForeground}
                    />
                  </Pressable>
                ))}
              </View>
            )}

            {cardId === "prompts" && (
              <View style={styles.list}>
                {PROMPTS.map((prompt) => (
                  <Pressable
                    key={prompt}
                    onPress={() => handleStart(prompt)}
                    style={({ pressed }) => [
                      styles.promptItem,
                      {
                        backgroundColor: colors.card,
                        borderColor: colors.border,
                      },
                      pressed && { opacity: 0.85 },
                      Shadows.xs,
                    ]}
                  >
                    <Text
                      style={[styles.promptText, { color: colors.foreground }]}
                    >
                      {prompt}
                    </Text>
                    <Ionicons name="pencil" size={18} color={colors.primary} />
                  </Pressable>
                ))}
              </View>
            )}

            {cardId === "tips" && (
              <View style={styles.tipBlock}>
                <Text style={[styles.tipBody, { color: colors.foreground }]}>
                  {WRITING_TIP}
                </Text>
                <Pressable
                  onPress={() =>
                    handleStart("Writing tip: Short reflections work")
                  }
                  style={({ pressed }) => [
                    styles.primaryBtn,
                    { backgroundColor: colors.primary },
                    pressed && { opacity: 0.9 },
                    Shadows.sm,
                  ]}
                >
                  <Ionicons
                    name="pencil"
                    size={18}
                    color={colors.primaryForeground}
                  />
                  <Text
                    style={[
                      styles.primaryBtnText,
                      { color: colors.primaryForeground },
                    ]}
                  >
                    Start journaling
                  </Text>
                </Pressable>
              </View>
            )}

            {cardId === "guided" && (
              <View style={styles.tipBlock}>
                <Text style={[styles.tipBody, { color: colors.foreground }]}>
                  {GUIDED_DESCRIPTION}
                </Text>
                <Pressable
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    onClose();
                    onOpenJournals();
                  }}
                  style={({ pressed }) => [
                    styles.primaryBtn,
                    { backgroundColor: colors.primary },
                    pressed && { opacity: 0.9 },
                    Shadows.sm,
                  ]}
                >
                  <Ionicons
                    name="book-outline"
                    size={18}
                    color={colors.primaryForeground}
                  />
                  <Text
                    style={[
                      styles.primaryBtnText,
                      { color: colors.primaryForeground },
                    ]}
                  >
                    Open journals
                  </Text>
                </Pressable>
              </View>
            )}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: "flex-end",
  },
  sheet: {
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    maxHeight: "85%",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  title: { fontSize: 18, fontWeight: "600" },
  scroll: { maxHeight: 400 },
  scrollContent: { padding: 20, paddingBottom: 32 },
  list: { gap: 8 },
  listItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  listItemText: { flex: 1, fontSize: 16, fontWeight: "500" },
  promptItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 14,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  promptText: { flex: 1, fontSize: 15 },
  tipBlock: { gap: 16 },
  tipBody: { fontSize: 15, lineHeight: 22 },
  primaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: radius.lg,
  },
  primaryBtnText: { fontSize: 16, fontWeight: "600" },
});
