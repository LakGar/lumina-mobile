import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { radius } from "@/constants/theme";
import { useSubscription } from "@/contexts/subscription-context";
import { useApi } from "@/hooks/use-api";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useThemeColors } from "@/hooks/use-theme-colors";
import { isPlanLimitError } from "@/lib/api";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { showJournalLimitUpgrade, showPlanLimitUpgrade } from "@/utils/plan-limit";

const PADDING_H = 20;
const FREE_JOURNAL_LIMIT = 3;

export default function CreateJournalScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const api = useApi();
  const { isPro } = useSubscription() ?? { isPro: false };

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const goBack = () => router.back();

  const onSubmit = async () => {
    const t = title.trim();
    if (!t || submitting) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (!isPro) {
      try {
        const list = await api.fetchJournals();
        if (list.length >= FREE_JOURNAL_LIMIT) {
          showJournalLimitUpgrade(router);
          return;
        }
      } catch {
        // continue; backend will 403 if over limit
      }
    }
    setSubmitting(true);
    try {
      const journal = await api.createJournal(t);
      router.replace(`/(home)/journal/${journal.id}`);
    } catch (e) {
      if (isPlanLimitError(e)) {
        showPlanLimitUpgrade(router);
        return;
      }
      Alert.alert(
        "Error",
        e instanceof Error ? e.message : "Could not create journal",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const canSubmit = title.trim().length > 0 && !submitting;

  return (
    <ThemedView style={styles.container}>
      <View
        style={[
          styles.header,
          {
            paddingTop: insets.top + 8,
            paddingBottom: 12,
            paddingHorizontal: PADDING_H,
            backgroundColor: colors.background,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <Pressable
          onPress={goBack}
          style={({ pressed }) => [
            styles.backButton,
            pressed && { opacity: 0.7 },
          ]}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Cancel"
        >
          <ThemedText
            style={[styles.cancelText, { color: colors.mutedForeground }]}
          >
            Cancel
          </ThemedText>
        </Pressable>
        <ThemedText style={styles.headerTitle}>New journal</ThemedText>
        <Pressable
          onPress={onSubmit}
          disabled={!canSubmit}
          style={({ pressed }) => [
            styles.saveButton,
            canSubmit
              ? { backgroundColor: colors.primary }
              : { backgroundColor: colors.muted },
            pressed && canSubmit && { opacity: 0.85 },
          ]}
          accessibilityRole="button"
          accessibilityLabel="Create journal"
        >
          {submitting ? (
            <ActivityIndicator size="small" color={colors.primaryForeground} />
          ) : (
            <ThemedText
              style={[
                styles.saveText,
                {
                  color: canSubmit
                    ? colors.primaryForeground
                    : colors.mutedForeground,
                },
              ]}
            >
              Create
            </ThemedText>
          )}
        </Pressable>
      </View>

      <KeyboardAvoidingView
        style={styles.keyboard}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={0}
      >
        <View
          style={[
            styles.form,
            {
              paddingHorizontal: PADDING_H,
              paddingTop: 24,
              paddingBottom: insets.bottom + 24,
            },
          ]}
        >
          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.mutedForeground }]}>
              Title
            </Text>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="e.g. Morning pages"
              placeholderTextColor={colors.mutedForeground}
              style={[
                styles.input,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  color: colors.foreground,
                },
              ]}
              autoCapitalize="words"
              autoCorrect={false}
            />
          </View>
          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.mutedForeground }]}>
              Description (optional)
            </Text>
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="A short note about this journal"
              placeholderTextColor={colors.mutedForeground}
              style={[
                styles.input,
                styles.inputMultiline,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  color: colors.foreground,
                },
              ]}
              multiline
              numberOfLines={3}
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backButton: {
    padding: 4,
    minWidth: 64,
  },
  cancelText: {
    fontSize: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  saveButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: radius.lg,
  },
  saveText: {
    fontSize: 16,
    fontWeight: "600",
  },
  keyboard: { flex: 1 },
  form: {},
  field: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 8,
  },
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.lg,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
  },
  inputMultiline: {
    minHeight: 88,
    textAlignVertical: "top",
  },
});
