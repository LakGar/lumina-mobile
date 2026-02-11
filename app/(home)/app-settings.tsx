import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Colors, radius, Shadows } from "@/constants/theme";
import { useTheme } from "@/contexts/theme-context";
import { useColorScheme } from "@/hooks/use-color-scheme";
import Ionicons from "@expo/vector-icons/Ionicons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const PADDING_H = 20;

type ThemeOption = "light" | "dark" | "system";

export default function AppSettingsScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const insets = useSafeAreaInsets();
  const themeContext = useTheme();

  const [pushEnabled, setPushEnabled] = useState(true);
  const [emailReminders, setEmailReminders] = useState(true);
  const [promptsAndTips, setPromptsAndTips] = useState(false);

  const preference: ThemeOption = themeContext?.preference ?? "light";

  const goBack = () => router.back();

  const setTheme = (value: ThemeOption) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    themeContext?.setPreference(value);
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
        <ThemedText style={styles.headerTitle}>App settings</ThemedText>
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
        {/* Appearance / Theme */}
        <View style={styles.section}>
          <ThemedText
            style={[styles.sectionTitle, { color: colors.mutedForeground }]}
          >
            Appearance
          </ThemedText>
          <View
            style={[
              styles.card,
              { backgroundColor: colors.card, borderColor: colors.border },
              Shadows.xs,
            ]}
          >
            <Text style={[styles.cardLabel, { color: colors.mutedForeground }]}>
              Theme
            </Text>
            <View style={styles.themeRow}>
              {(["light", "dark", "system"] as const).map((opt) => (
                <Pressable
                  key={opt}
                  onPress={() => setTheme(opt)}
                  style={({ pressed }) => [
                    styles.themeOption,
                    {
                      backgroundColor:
                        preference === opt ? colors.primary : colors.muted,
                      borderColor: colors.border,
                      opacity: pressed ? 0.85 : 1,
                    },
                  ]}
                >
                  <Ionicons
                    name={
                      opt === "light"
                        ? "sunny"
                        : opt === "dark"
                          ? "moon"
                          : "phone-portrait-outline"
                    }
                    size={20}
                    color={
                      preference === opt
                        ? colors.primaryForeground
                        : colors.foreground
                    }
                  />
                  <Text
                    style={[
                      styles.themeOptionLabel,
                      {
                        color:
                          preference === opt
                            ? colors.primaryForeground
                            : colors.foreground,
                      },
                    ]}
                  >
                    {opt === "light"
                      ? "Light"
                      : opt === "dark"
                        ? "Dark"
                        : "System"}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        </View>

        {/* Notifications */}
        <View style={styles.section}>
          <ThemedText
            style={[styles.sectionTitle, { color: colors.mutedForeground }]}
          >
            Notifications
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
                name="notifications-outline"
                size={22}
                color={colors.mutedForeground}
              />
              <View style={styles.settingLabelBlock}>
                <Text
                  style={[styles.settingLabel, { color: colors.foreground }]}
                >
                  Push notifications
                </Text>
                <Text
                  style={[
                    styles.settingSublabel,
                    { color: colors.mutedForeground },
                  ]}
                >
                  Reminders and updates
                </Text>
              </View>
              <Switch
                value={pushEnabled}
                onValueChange={(v) => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setPushEnabled(v);
                }}
                trackColor={{ false: colors.muted, true: colors.primary }}
                thumbColor={colors.primaryForeground}
              />
            </View>
            <View
              style={[styles.settingRow, { borderBottomColor: colors.border }]}
            >
              <Ionicons
                name="mail-unread-outline"
                size={22}
                color={colors.mutedForeground}
              />
              <View style={styles.settingLabelBlock}>
                <Text
                  style={[styles.settingLabel, { color: colors.foreground }]}
                >
                  Email reminders
                </Text>
                <Text
                  style={[
                    styles.settingSublabel,
                    { color: colors.mutedForeground },
                  ]}
                >
                  Daily or weekly journal reminders
                </Text>
              </View>
              <Switch
                value={emailReminders}
                onValueChange={(v) => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setEmailReminders(v);
                }}
                trackColor={{ false: colors.muted, true: colors.primary }}
                thumbColor={colors.primaryForeground}
              />
            </View>
            <View style={[styles.settingRow, styles.settingRowLast]}>
              <Ionicons
                name="bulb-outline"
                size={22}
                color={colors.mutedForeground}
              />
              <View style={styles.settingLabelBlock}>
                <Text
                  style={[styles.settingLabel, { color: colors.foreground }]}
                >
                  Prompts & tips
                </Text>
                <Text
                  style={[
                    styles.settingSublabel,
                    { color: colors.mutedForeground },
                  ]}
                >
                  Occasional writing prompts and tips
                </Text>
              </View>
              <Switch
                value={promptsAndTips}
                onValueChange={(v) => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setPromptsAndTips(v);
                }}
                trackColor={{ false: colors.muted, true: colors.primary }}
                thumbColor={colors.primaryForeground}
              />
            </View>
          </View>
        </View>

        {/* Other */}
        <View style={styles.section}>
          <ThemedText
            style={[styles.sectionTitle, { color: colors.mutedForeground }]}
          >
            Other
          </ThemedText>
          <View
            style={[
              styles.listCard,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <Pressable
              onPress={() =>
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
              }
              style={({ pressed }) => [
                styles.row,
                { borderBottomColor: colors.border },
                pressed && { opacity: 0.7 },
              ]}
            >
              <Ionicons
                name="language-outline"
                size={22}
                color={colors.mutedForeground}
              />
              <Text style={[styles.rowLabel, { color: colors.foreground }]}>
                Language
              </Text>
              <Text
                style={[styles.rowValue, { color: colors.mutedForeground }]}
              >
                English
              </Text>
              <Ionicons
                name="chevron-forward"
                size={18}
                color={colors.mutedForeground}
              />
            </Pressable>
            <Pressable
              onPress={() =>
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
              }
              style={({ pressed }) => [
                styles.row,
                styles.rowLast,
                pressed && { opacity: 0.7 },
              ]}
            >
              <Ionicons
                name="document-text-outline"
                size={22}
                color={colors.mutedForeground}
              />
              <Text style={[styles.rowLabel, { color: colors.foreground }]}>
                Default journal
              </Text>
              <Ionicons
                name="chevron-forward"
                size={18}
                color={colors.mutedForeground}
              />
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
  card: {
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 18,
  },
  cardLabel: {
    fontSize: 14,
    marginBottom: 12,
  },
  themeRow: {
    flexDirection: "row",
    gap: 10,
  },
  themeOption: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
  },
  themeOptionLabel: {
    fontSize: 14,
    fontWeight: "600",
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
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  rowLast: { borderBottomWidth: 0 },
  rowLabel: { flex: 1, fontSize: 16 },
  rowValue: { fontSize: 14 },
});
