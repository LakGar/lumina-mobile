import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { radius } from "@/constants/theme";
import { useApi } from "@/hooks/use-api";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useThemeColors } from "@/hooks/use-theme-colors";
import { ApiError } from "@/lib/api";
import { useClerk } from "@clerk/clerk-expo";
import Ionicons from "@expo/vector-icons/Ionicons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const PADDING_H = 20;
const STORAGE_KEY_AI = "@privacy/ai_suggestions";
const STORAGE_KEY_PROMPTS = "@privacy/store_prompts";
const STORAGE_KEY_ANALYTICS = "@privacy/analytics";

export default function PrivacySettingsScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const api = useApi();
  const { signOut } = useClerk();

  const [aiSuggestions, setAiSuggestions] = useState(true);
  const [storePromptsForPersonalization, setStorePromptsForPersonalization] =
    useState(false);
  const [analyticsAndImprovement, setAnalyticsAndImprovement] = useState(true);
  const [deleting, setDeleting] = useState<"journal" | "ai" | "all" | null>(
    null,
  );
  const [loadingToggles, setLoadingToggles] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      (async () => {
        try {
          const [ai, prompts, analytics] = await Promise.all([
            AsyncStorage.getItem(STORAGE_KEY_AI),
            AsyncStorage.getItem(STORAGE_KEY_PROMPTS),
            AsyncStorage.getItem(STORAGE_KEY_ANALYTICS),
          ]);
          if (cancelled) return;
          if (ai !== null) setAiSuggestions(ai === "true");
          if (prompts !== null)
            setStorePromptsForPersonalization(prompts === "true");
          if (analytics !== null)
            setAnalyticsAndImprovement(analytics === "true");
        } catch {
          // keep defaults
        } finally {
          if (!cancelled) setLoadingToggles(false);
        }
      })();
      return () => {
        cancelled = true;
      };
    }, []),
  );

  useEffect(() => {
    if (!loadingToggles) {
      AsyncStorage.setItem(STORAGE_KEY_AI, String(aiSuggestions)).catch(
        () => {},
      );
    }
  }, [aiSuggestions, loadingToggles]);
  useEffect(() => {
    if (!loadingToggles) {
      AsyncStorage.setItem(
        STORAGE_KEY_PROMPTS,
        String(storePromptsForPersonalization),
      ).catch(() => {});
    }
  }, [storePromptsForPersonalization, loadingToggles]);
  useEffect(() => {
    if (!loadingToggles) {
      AsyncStorage.setItem(
        STORAGE_KEY_ANALYTICS,
        String(analyticsAndImprovement),
      ).catch(() => {});
    }
  }, [analyticsAndImprovement, loadingToggles]);

  const goBack = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  }, [router]);

  const confirmDelete = (
    title: string,
    message: string,
    onConfirm: () => void,
  ) => {
    Alert.alert(title, message, [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: onConfirm },
    ]);
  };

  const handleDeleteJournalData = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    confirmDelete(
      "Delete journal data",
      "This will permanently delete all your journal entries. This cannot be undone.",
      async () => {
        setDeleting("journal");
        try {
          await api.deleteMyJournalData();
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          Alert.alert("Done", "All journal data has been deleted.");
        } catch (e) {
          const msg =
            e instanceof ApiError && (e.status === 404 || e.status === 501)
              ? "This feature is not available yet. Please try again later."
              : "Could not delete journal data. Please try again.";
          Alert.alert("Error", msg);
        } finally {
          setDeleting(null);
        }
      },
    );
  };

  const handleDeleteAiData = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    confirmDelete(
      "Delete AI data",
      "This will delete stored prompts and AI-related data used for personalization.",
      async () => {
        setDeleting("ai");
        try {
          await api.deleteMyAiData();
          setStorePromptsForPersonalization(false);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          Alert.alert("Done", "AI data has been deleted.");
        } catch (e) {
          const msg =
            e instanceof ApiError && (e.status === 404 || e.status === 501)
              ? "This feature is not available yet. Please try again later."
              : "Could not delete AI data. Please try again.";
          Alert.alert("Error", msg);
        } finally {
          setDeleting(null);
        }
      },
    );
  };

  const handleDeleteAllData = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    confirmDelete(
      "Delete all data",
      "This will permanently delete all your data including journals, preferences, and account data. You will be signed out. This cannot be undone.",
      async () => {
        setDeleting("all");
        try {
          await api.deleteAllMyData();
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          await signOut();
          router.replace("/(auth)/sign-in");
        } catch (e) {
          const msg =
            e instanceof ApiError && (e.status === 404 || e.status === 501)
              ? "This feature is not available yet. Please try again later."
              : "Could not delete all data. Please try again.";
          Alert.alert("Error", msg);
          setDeleting(null);
        }
      },
    );
  };

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
          accessibilityLabel="Back"
        >
          <Ionicons name="chevron-back" size={24} color={colors.foreground} />
        </Pressable>
        <ThemedText style={styles.headerTitle}>Privacy settings</ThemedText>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingHorizontal: PADDING_H,
            paddingTop: 24,
            paddingBottom: insets.bottom + 32,
          },
        ]}
        showsVerticalScrollIndicator={true}
      >
        {/* AI settings */}
        <View style={styles.section}>
          <ThemedText
            style={[styles.sectionTitle, { color: colors.mutedForeground }]}
          >
            AI settings
          </ThemedText>
          <View
            style={[
              styles.listCard,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <View
              style={[styles.settingRow, { borderBottomColor: colors.border }]}
            >
              <Ionicons
                name="sparkles-outline"
                size={22}
                color={colors.mutedForeground}
              />
              <View style={styles.settingLabelBlock}>
                <Text
                  style={[styles.settingLabel, { color: colors.foreground }]}
                >
                  AI suggestions
                </Text>
                <Text
                  style={[
                    styles.settingSublabel,
                    { color: colors.mutedForeground },
                  ]}
                >
                  Prompts and reflection suggestions in the app
                </Text>
              </View>
              <Switch
                value={aiSuggestions}
                onValueChange={(v) => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setAiSuggestions(v);
                }}
                trackColor={{ false: colors.muted, true: colors.primary }}
                thumbColor={colors.primaryForeground}
                accessibilityLabel="AI suggestions"
                accessibilityRole="switch"
              />
            </View>
            <View style={[styles.settingRow, styles.settingRowLast]}>
              <Ionicons
                name="server-outline"
                size={22}
                color={colors.mutedForeground}
              />
              <View style={styles.settingLabelBlock}>
                <Text
                  style={[styles.settingLabel, { color: colors.foreground }]}
                >
                  Store prompts for personalization
                </Text>
                <Text
                  style={[
                    styles.settingSublabel,
                    { color: colors.mutedForeground },
                  ]}
                >
                  Save prompts to improve suggestions for you
                </Text>
              </View>
              <Switch
                value={storePromptsForPersonalization}
                onValueChange={(v) => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setStorePromptsForPersonalization(v);
                }}
                trackColor={{ false: colors.muted, true: colors.primary }}
                thumbColor={colors.primaryForeground}
                accessibilityLabel="Store prompts for personalization"
                accessibilityRole="switch"
              />
            </View>
          </View>
        </View>

        {/* Data & privacy */}
        <View style={styles.section}>
          <ThemedText
            style={[styles.sectionTitle, { color: colors.mutedForeground }]}
          >
            Data & privacy
          </ThemedText>
          <View
            style={[
              styles.listCard,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <View
              style={[styles.settingRow, { borderBottomColor: colors.border }]}
            >
              <Ionicons
                name="analytics-outline"
                size={22}
                color={colors.mutedForeground}
              />
              <View style={styles.settingLabelBlock}>
                <Text
                  style={[styles.settingLabel, { color: colors.foreground }]}
                >
                  Analytics & improvement
                </Text>
                <Text
                  style={[
                    styles.settingSublabel,
                    { color: colors.mutedForeground },
                  ]}
                >
                  Anonymous usage to improve the app
                </Text>
              </View>
              <Switch
                value={analyticsAndImprovement}
                onValueChange={(v) => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setAnalyticsAndImprovement(v);
                }}
                trackColor={{ false: colors.muted, true: colors.primary }}
                thumbColor={colors.primaryForeground}
                accessibilityLabel="Analytics and improvement"
                accessibilityRole="switch"
              />
            </View>
          </View>
        </View>

        {/* Delete data */}
        <View style={styles.section}>
          <ThemedText
            style={[styles.sectionTitle, { color: colors.mutedForeground }]}
          >
            Delete data
          </ThemedText>
          <View
            style={[
              styles.listCard,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <Pressable
              onPress={handleDeleteJournalData}
              disabled={deleting !== null}
              accessibilityRole="button"
              accessibilityLabel="Delete journal data"
              style={({ pressed }) => [
                styles.dangerRow,
                { borderBottomColor: colors.border },
                (pressed || deleting !== null) && { opacity: 0.7 },
              ]}
            >
              <Ionicons
                name="journal-outline"
                size={22}
                color={colors.destructive}
              />
              <Text style={[styles.dangerLabel, { color: colors.destructive }]}>
                Delete journal data
              </Text>
              {deleting === "journal" ? (
                <ActivityIndicator size="small" color={colors.destructive} />
              ) : (
                <Ionicons
                  name="chevron-forward"
                  size={18}
                  color={colors.destructive}
                />
              )}
            </Pressable>
            <Pressable
              onPress={handleDeleteAiData}
              disabled={deleting !== null}
              accessibilityRole="button"
              accessibilityLabel="Delete AI data"
              style={({ pressed }) => [
                styles.dangerRow,
                { borderBottomColor: colors.border },
                (pressed || deleting !== null) && { opacity: 0.7 },
              ]}
            >
              <Ionicons
                name="trash-outline"
                size={22}
                color={colors.destructive}
              />
              <Text style={[styles.dangerLabel, { color: colors.destructive }]}>
                Delete AI data
              </Text>
              {deleting === "ai" ? (
                <ActivityIndicator size="small" color={colors.destructive} />
              ) : (
                <Ionicons
                  name="chevron-forward"
                  size={18}
                  color={colors.destructive}
                />
              )}
            </Pressable>
            <Pressable
              onPress={handleDeleteAllData}
              disabled={deleting !== null}
              accessibilityRole="button"
              accessibilityLabel="Delete all data"
              style={({ pressed }) => [
                styles.dangerRow,
                styles.dangerRowLast,
                (pressed || deleting !== null) && { opacity: 0.7 },
              ]}
            >
              <Ionicons
                name="warning-outline"
                size={22}
                color={colors.destructive}
              />
              <Text style={[styles.dangerLabel, { color: colors.destructive }]}>
                Delete all data
              </Text>
              {deleting === "all" ? (
                <ActivityIndicator size="small" color={colors.destructive} />
              ) : (
                <Ionicons
                  name="chevron-forward"
                  size={18}
                  color={colors.destructive}
                />
              )}
            </Pressable>
          </View>
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
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backButton: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: "700" },
  headerRight: { width: 32 },
  scroll: { flex: 1 },
  scrollContent: {},
  section: { marginBottom: 28 },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 10,
    paddingHorizontal: 2,
  },
  listCard: {
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  settingRowLast: { borderBottomWidth: 0 },
  settingLabelBlock: { flex: 1, minWidth: 0 },
  settingLabel: { fontSize: 16, fontWeight: "500" },
  settingSublabel: { fontSize: 13, marginTop: 2 },
  dangerRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  dangerRowLast: { borderBottomWidth: 0 },
  dangerLabel: { flex: 1, fontSize: 16, fontWeight: "500" },
});
