import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import {
  API_COLOR_SCHEME_OPTIONS,
  ColorPalettes,
  radius,
  Shadows,
} from "@/constants/theme";
import type { ColorSchemeId } from "@/constants/theme";
import { useTheme } from "@/contexts/theme-context";
import { useApi } from "@/hooks/use-api";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useThemeColors } from "@/hooks/use-theme-colors";
import Ionicons from "@expo/vector-icons/Ionicons";
import * as Haptics from "expo-haptics";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useRef, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const PADDING_H = 20;

type ThemeOption = "light" | "dark" | "system";

type ReminderFrequency = "daily" | "weekdays" | "weekly";

const REMINDER_TIME_PRESETS = [
  "07:00",
  "08:00",
  "09:00",
  "12:00",
  "18:00",
  "20:00",
  "21:00",
];

const COMMON_TIMEZONES = [
  "UTC",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Toronto",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "Europe/Amsterdam",
  "Asia/Kolkata",
  "Asia/Dubai",
  "Asia/Singapore",
  "Asia/Tokyo",
  "Australia/Sydney",
  "Australia/Melbourne",
];

function getDeviceTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
}

function formatTimezoneLabel(tz: string): string {
  if (tz === "UTC") return "UTC";
  const parts = tz.split("/");
  return parts[parts.length - 1]?.replace(/_/g, " ") ?? tz;
}

function formatFrequencyLabel(f: ReminderFrequency): string {
  switch (f) {
    case "daily":
      return "Daily";
    case "weekdays":
      return "Weekdays";
    case "weekly":
      return "Weekly";
    default:
      return f;
  }
}

export default function AppSettingsScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const themeContext = useTheme();
  const api = useApi();

  const [loading, setLoading] = useState(true);
  const [pushEnabled, setPushEnabled] = useState(true);
  const [emailReminders, setEmailReminders] = useState(true);
  const [promptsAndTips, setPromptsAndTips] = useState(false);
  const [reminderTime, setReminderTime] = useState("09:00");
  const [timezone, setTimezone] = useState(() => getDeviceTimezone());
  const [reminderFrequency, setReminderFrequency] =
    useState<ReminderFrequency>("daily");

  const [timeModalVisible, setTimeModalVisible] = useState(false);
  const [timezoneModalVisible, setTimezoneModalVisible] = useState(false);
  const [frequencyModalVisible, setFrequencyModalVisible] = useState(false);
  const [customTimeInput, setCustomTimeInput] = useState("");

  const preference: ThemeOption = themeContext?.preference ?? "light";

  const loadSettings = useCallback(async () => {
    setLoading(true);
    try {
      const [prefs, notif] = await Promise.all([
        api.fetchPreferences(),
        api.fetchNotification(),
      ]);
      if (prefs.theme && themeContext?.setPreference) {
        themeContext.setPreference(prefs.theme as ThemeOption);
      }
      if (
        prefs.colorScheme != null &&
        typeof prefs.colorScheme === "string" &&
        themeContext?.setColorSchemeFromApi
      ) {
        themeContext.setColorSchemeFromApi(prefs.colorScheme);
      }
      setPushEnabled(notif.dailyReminderEnabled ?? true);
      setEmailReminders(notif.dailyReminderEnabled ?? true);
      setReminderTime(
        notif.dailyReminderTime &&
          /^\d{1,2}:\d{2}$/.test(notif.dailyReminderTime)
          ? notif.dailyReminderTime
          : "09:00",
      );
      setTimezone(
        notif.timezone && notif.timezone.trim()
          ? notif.timezone
          : getDeviceTimezone(),
      );
      const freq = (notif.frequency ?? "daily").toLowerCase();
      setReminderFrequency(
        freq === "weekdays" || freq === "weekly" ? freq : "daily",
      );
    } catch {
      // keep defaults
    } finally {
      setLoading(false);
    }
  }, [api, themeContext]);

  const loadSettingsRef = useRef(loadSettings);
  loadSettingsRef.current = loadSettings;
  useFocusEffect(
    useCallback(() => {
      loadSettingsRef.current();
    }, []),
  );

  const goBack = () => router.back();

  const setTheme = useCallback(
    (value: ThemeOption) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      themeContext?.setPreference(value);
      api.updatePreferences({ theme: value }).catch(() => {});
    },
    [themeContext, api],
  );

  const setPushEnabledAndSync = useCallback(
    (v: boolean) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setPushEnabled(v);
      api.updateNotification({ dailyReminderEnabled: v }).catch(() => {});
    },
    [api],
  );

  const setEmailRemindersAndSync = useCallback(
    (v: boolean) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setEmailReminders(v);
      api.updateNotification({ dailyReminderEnabled: v }).catch(() => {});
    },
    [api],
  );

  const setPromptsAndTipsAndSync = useCallback((v: boolean) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPromptsAndTips(v);
  }, []);

  const syncReminderTime = useCallback(
    (t: string) => {
      setReminderTime(t);
      api.updateNotification({ dailyReminderTime: t }).catch(() => {});
    },
    [api],
  );

  const syncTimezone = useCallback(
    (tz: string) => {
      setTimezone(tz);
      api.updateNotification({ timezone: tz }).catch(() => {});
    },
    [api],
  );

  const syncFrequency = useCallback(
    (f: ReminderFrequency) => {
      setReminderFrequency(f);
      api.updateNotification({ frequency: f }).catch(() => {});
    },
    [api],
  );

  const openTimeModal = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCustomTimeInput(reminderTime);
    setTimeModalVisible(true);
  }, [reminderTime]);

  const applyTime = useCallback(() => {
    const raw = customTimeInput.trim();
    const match = raw.match(/^(\d{1,2}):(\d{2})$/);
    if (match) {
      const h = Math.min(23, Math.max(0, parseInt(match[1]!, 10)));
      const m = Math.min(59, Math.max(0, parseInt(match[2]!, 10)));
      const t = `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
      syncReminderTime(t);
    }
    setTimeModalVisible(false);
  }, [customTimeInput, syncReminderTime]);

  const selectPresetTime = useCallback(
    (t: string) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      syncReminderTime(t);
      setTimeModalVisible(false);
    },
    [syncReminderTime],
  );

  const selectTimezone = useCallback(
    (tz: string) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      syncTimezone(tz);
      setTimezoneModalVisible(false);
    },
    [syncTimezone],
  );

  const selectFrequency = useCallback(
    (f: ReminderFrequency) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      syncFrequency(f);
      setFrequencyModalVisible(false);
    },
    [syncFrequency],
  );

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

      {loading ? (
        <View style={[styles.loadingWrap, { paddingTop: insets.top + 80 }]}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
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
              <Text
                style={[styles.cardLabel, { color: colors.mutedForeground }]}
              >
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

          {/* Color scheme */}
          <View style={styles.section}>
            <ThemedText
              style={[styles.sectionTitle, { color: colors.mutedForeground }]}
            >
              Color scheme
            </ThemedText>
            <View
              style={[
                styles.card,
                { backgroundColor: colors.card, borderColor: colors.border },
                Shadows.xs,
              ]}
            >
              <Text
                style={[styles.cardLabel, { color: colors.mutedForeground }]}
              >
                Color scheme
              </Text>
              <View style={styles.colorSchemeRow}>
                {API_COLOR_SCHEME_OPTIONS.map((opt) => {
                  const palette = ColorPalettes[opt.paletteId];
                  const selected =
                    themeContext?.colorSchemeApi === opt.value ||
                    (themeContext?.colorSchemeApi == null &&
                      themeContext?.colorSchemeId === opt.paletteId);
                  return (
                    <Pressable
                      key={opt.value}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        themeContext?.setColorSchemeFromApi(opt.value);
                        api.updatePreferences({ colorScheme: opt.value }).catch(
                          () => {},
                        );
                      }}
                      style={({ pressed }) => [
                        styles.colorSchemeCircleWrap,
                        pressed && { opacity: 0.8 },
                      ]}
                      accessibilityRole="button"
                      accessibilityLabel={`${opt.label}${selected ? ", selected" : ""}`}
                      accessibilityState={{ selected }}
                    >
                      <View
                        style={[
                          styles.colorSchemeCircle,
                          {
                            backgroundColor: palette.swatch,
                            borderColor: selected
                              ? colors.foreground
                              : colors.border,
                            borderWidth: selected ? 3 : StyleSheet.hairlineWidth,
                          },
                        ]}
                      />
                      <Text
                        style={[
                          styles.colorSchemeLabel,
                          { color: colors.foreground },
                        ]}
                        numberOfLines={1}
                      >
                        {opt.label}
                      </Text>
                    </Pressable>
                  );
                })}
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
                style={[
                  styles.settingRow,
                  { borderBottomColor: colors.border },
                ]}
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
                  onValueChange={setPushEnabledAndSync}
                  trackColor={{ false: colors.muted, true: colors.primary }}
                  thumbColor={colors.primaryForeground}
                />
              </View>

              {pushEnabled && (
                <>
                  <Pressable
                    onPress={openTimeModal}
                    style={({ pressed }) => [
                      styles.settingRow,
                      styles.tappableRow,
                      { borderBottomColor: colors.border },
                      pressed && { opacity: 0.7 },
                    ]}
                  >
                    <Ionicons
                      name="time-outline"
                      size={22}
                      color={colors.mutedForeground}
                    />
                    <View style={styles.settingLabelBlock}>
                      <Text
                        style={[
                          styles.settingLabel,
                          { color: colors.foreground },
                        ]}
                      >
                        Reminder time
                      </Text>
                      <Text
                        style={[
                          styles.settingSublabel,
                          { color: colors.mutedForeground },
                        ]}
                      >
                        When to send the reminder (in your time zone)
                      </Text>
                    </View>
                    <Text
                      style={[
                        styles.rowValue,
                        { color: colors.primary, fontWeight: "600" },
                      ]}
                    >
                      {reminderTime}
                    </Text>
                    <Ionicons
                      name="chevron-forward"
                      size={18}
                      color={colors.mutedForeground}
                    />
                  </Pressable>
                  <Pressable
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setTimezoneModalVisible(true);
                    }}
                    style={({ pressed }) => [
                      styles.settingRow,
                      styles.tappableRow,
                      { borderBottomColor: colors.border },
                      pressed && { opacity: 0.7 },
                    ]}
                  >
                    <Ionicons
                      name="globe-outline"
                      size={22}
                      color={colors.mutedForeground}
                    />
                    <View style={styles.settingLabelBlock}>
                      <Text
                        style={[
                          styles.settingLabel,
                          { color: colors.foreground },
                        ]}
                      >
                        Time zone
                      </Text>
                      <Text
                        style={[
                          styles.settingSublabel,
                          { color: colors.mutedForeground },
                        ]}
                      >
                        For reminder time
                      </Text>
                    </View>
                    <Text
                      style={[
                        styles.rowValue,
                        { color: colors.mutedForeground },
                        styles.timezoneValue,
                      ]}
                      numberOfLines={1}
                    >
                      {formatTimezoneLabel(timezone)}
                    </Text>
                    <Ionicons
                      name="chevron-forward"
                      size={18}
                      color={colors.mutedForeground}
                    />
                  </Pressable>
                  <Pressable
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setFrequencyModalVisible(true);
                    }}
                    style={({ pressed }) => [
                      styles.settingRow,
                      styles.tappableRow,
                      { borderBottomColor: colors.border },
                      pressed && { opacity: 0.7 },
                    ]}
                  >
                    <Ionicons
                      name="repeat-outline"
                      size={22}
                      color={colors.mutedForeground}
                    />
                    <View style={styles.settingLabelBlock}>
                      <Text
                        style={[
                          styles.settingLabel,
                          { color: colors.foreground },
                        ]}
                      >
                        Reminder frequency
                      </Text>
                      <Text
                        style={[
                          styles.settingSublabel,
                          { color: colors.mutedForeground },
                        ]}
                      >
                        Daily, weekdays only, or weekly
                      </Text>
                    </View>
                    <Text
                      style={[
                        styles.rowValue,
                        { color: colors.primary, fontWeight: "600" },
                      ]}
                    >
                      {formatFrequencyLabel(reminderFrequency)}
                    </Text>
                    <Ionicons
                      name="chevron-forward"
                      size={18}
                      color={colors.mutedForeground}
                    />
                  </Pressable>
                </>
              )}

              <View
                style={[
                  styles.settingRow,
                  { borderBottomColor: colors.border },
                ]}
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
                  onValueChange={setEmailRemindersAndSync}
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
                  onValueChange={setPromptsAndTipsAndSync}
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
      )}

      {/* Reminder time modal */}
      <Modal
        visible={timeModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setTimeModalVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setTimeModalVisible(false)}
        >
          <Pressable
            style={[
              styles.modalCard,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
              },
            ]}
            onPress={(e) => e.stopPropagation()}
          >
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>
              Reminder time
            </Text>
            <View style={styles.timePresets}>
              {REMINDER_TIME_PRESETS.map((t) => (
                <Pressable
                  key={t}
                  onPress={() => selectPresetTime(t)}
                  style={({ pressed }) => [
                    styles.timePresetBtn,
                    {
                      backgroundColor:
                        reminderTime === t ? colors.primary : colors.muted,
                      borderColor: colors.border,
                    },
                    pressed && { opacity: 0.85 },
                  ]}
                >
                  <Text
                    style={[
                      styles.timePresetText,
                      {
                        color:
                          reminderTime === t
                            ? colors.primaryForeground
                            : colors.foreground,
                      },
                    ]}
                  >
                    {t}
                  </Text>
                </Pressable>
              ))}
            </View>
            <View style={styles.customTimeRow}>
              <TextInput
                style={[
                  styles.customTimeInput,
                  {
                    color: colors.foreground,
                    borderColor: colors.border,
                    backgroundColor: colors.background,
                  },
                ]}
                placeholder="HH:mm (e.g. 09:30)"
                placeholderTextColor={colors.mutedForeground}
                value={customTimeInput}
                onChangeText={setCustomTimeInput}
                maxLength={5}
              />
              <Pressable
                onPress={applyTime}
                style={({ pressed }) => [
                  styles.modalDoneBtn,
                  { backgroundColor: colors.primary },
                  pressed && { opacity: 0.9 },
                ]}
              >
                <Text
                  style={[
                    styles.modalDoneBtnText,
                    { color: colors.primaryForeground },
                  ]}
                >
                  Done
                </Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Time zone modal */}
      <Modal
        visible={timezoneModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setTimezoneModalVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setTimezoneModalVisible(false)}
        >
          <Pressable
            style={[
              styles.modalCard,
              styles.modalCardScroll,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                maxHeight: "70%",
              },
            ]}
            onPress={(e) => e.stopPropagation()}
          >
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>
              Time zone
            </Text>
            <ScrollView
              style={styles.timezoneScroll}
              showsVerticalScrollIndicator={true}
              keyboardShouldPersistTaps="handled"
            >
              {COMMON_TIMEZONES.map((tz) => (
                <Pressable
                  key={tz}
                  onPress={() => selectTimezone(tz)}
                  style={({ pressed }) => [
                    styles.timezoneOption,
                    {
                      backgroundColor:
                        timezone === tz ? colors.primary : "transparent",
                      borderBottomColor: colors.border,
                    },
                    pressed && { opacity: 0.85 },
                  ]}
                >
                  <Text
                    style={[
                      styles.timezoneOptionText,
                      {
                        color:
                          timezone === tz
                            ? colors.primaryForeground
                            : colors.foreground,
                      },
                    ]}
                  >
                    {formatTimezoneLabel(tz)}
                  </Text>
                  {timezone === tz && (
                    <Ionicons
                      name="checkmark-circle"
                      size={20}
                      color={colors.primaryForeground}
                    />
                  )}
                </Pressable>
              ))}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Reminder frequency modal */}
      <Modal
        visible={frequencyModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setFrequencyModalVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setFrequencyModalVisible(false)}
        >
          <Pressable
            style={[
              styles.modalCard,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
              },
            ]}
            onPress={(e) => e.stopPropagation()}
          >
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>
              Reminder frequency
            </Text>
            <Text
              style={[styles.modalSublabel, { color: colors.mutedForeground }]}
            >
              How often to send the reminder
            </Text>
            {(["daily", "weekdays", "weekly"] as const).map((f) => (
              <Pressable
                key={f}
                onPress={() => selectFrequency(f)}
                style={({ pressed }) => [
                  styles.frequencyOption,
                  {
                    backgroundColor:
                      reminderFrequency === f ? colors.primary : colors.muted,
                    borderColor: colors.border,
                  },
                  pressed && { opacity: 0.85 },
                ]}
              >
                <Text
                  style={[
                    styles.frequencyOptionText,
                    {
                      color:
                        reminderFrequency === f
                          ? colors.primaryForeground
                          : colors.foreground,
                    },
                  ]}
                >
                  {formatFrequencyLabel(f)}
                </Text>
                {reminderFrequency === f && (
                  <Ionicons
                    name="checkmark-circle"
                    size={20}
                    color={colors.primaryForeground}
                  />
                )}
              </Pressable>
            ))}
          </Pressable>
        </Pressable>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingWrap: {
    flex: 1,
    alignItems: "center",
  },
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
  colorSchemeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
  },
  colorSchemeCircleWrap: {
    alignItems: "center",
    width: 56,
  },
  colorSchemeCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  colorSchemeLabel: {
    fontSize: 11,
    marginTop: 6,
    textAlign: "center",
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
  tappableRow: {},
  settingLabelBlock: { flex: 1, minWidth: 0 },
  settingLabel: { fontSize: 16, fontWeight: "500" },
  settingSublabel: { fontSize: 13, marginTop: 2 },
  timezoneValue: { maxWidth: 120 },
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
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: PADDING_H,
  },
  modalCard: {
    width: "100%",
    maxWidth: 400,
    borderRadius: radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 20,
  },
  modalCardScroll: { paddingBottom: 8 },
  modalTitle: { fontSize: 18, fontWeight: "700", marginBottom: 4 },
  modalSublabel: { fontSize: 14, marginBottom: 16 },
  timePresets: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16,
  },
  timePresetBtn: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
  },
  timePresetText: { fontSize: 15, fontWeight: "600" },
  customTimeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  customTimeInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  modalDoneBtn: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: radius.lg,
  },
  modalDoneBtnText: { fontSize: 16, fontWeight: "600" },
  timezoneScroll: { maxHeight: 280, marginTop: 8 },
  timezoneOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  timezoneOptionText: { fontSize: 16 },
  frequencyOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    marginTop: 8,
  },
  frequencyOptionText: { fontSize: 16, fontWeight: "500" },
});
