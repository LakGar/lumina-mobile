import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useThemeColors } from "@/hooks/use-theme-colors";
import Ionicons from "@expo/vector-icons/Ionicons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React from "react";
import { Linking, Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const SUPPORT_EMAIL = "support@lumina.app";
const SUPPORT_URL = "https://lumina.app/support";

export default function MembershipServicesScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();

  const goBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  const openSupportUrl = () => {
    Linking.openURL(SUPPORT_URL).catch(() => {});
  };

  const openEmail = () => {
    Linking.openURL(`mailto:${SUPPORT_EMAIL}`).catch(() => {});
  };

  const goToAppSettings = () => {
    router.push("/(home)/app-settings");
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
          Membership & support
        </ThemedText>
        <View style={{ width: 24 }} />
      </View>
      <View style={styles.body}>
        <ThemedText
          style={[styles.subtitle, { color: colors.mutedForeground }]}
        >
          Manage your subscription, get help, or contact us.
        </ThemedText>
        <Pressable
          onPress={goToAppSettings}
          style={({ pressed }) => [
            styles.option,
            { backgroundColor: colors.card, borderColor: colors.border },
            pressed && { opacity: 0.85 },
          ]}
        >
          <Ionicons name="settings-outline" size={22} color={colors.primary} />
          <ThemedText style={[styles.optionText, { color: colors.foreground }]}>
            App settings
          </ThemedText>
          <Ionicons
            name="chevron-forward"
            size={20}
            color={colors.mutedForeground}
          />
        </Pressable>
        <Pressable
          onPress={openSupportUrl}
          style={({ pressed }) => [
            styles.option,
            { backgroundColor: colors.card, borderColor: colors.border },
            pressed && { opacity: 0.85 },
          ]}
        >
          <Ionicons
            name="help-circle-outline"
            size={22}
            color={colors.primary}
          />
          <ThemedText style={[styles.optionText, { color: colors.foreground }]}>
            Help center
          </ThemedText>
          <Ionicons
            name="open-outline"
            size={18}
            color={colors.mutedForeground}
          />
        </Pressable>
        <Pressable
          onPress={openEmail}
          style={({ pressed }) => [
            styles.option,
            { backgroundColor: colors.card, borderColor: colors.border },
            pressed && { opacity: 0.85 },
          ]}
        >
          <Ionicons name="mail-outline" size={22} color={colors.primary} />
          <View style={styles.optionLabelWrap}>
            <ThemedText
              style={[styles.optionText, { color: colors.foreground }]}
            >
              Contact support
            </ThemedText>
            <ThemedText
              style={[styles.optionSubtext, { color: colors.mutedForeground }]}
              numberOfLines={1}
            >
              {SUPPORT_EMAIL}
            </ThemedText>
          </View>
          <Ionicons
            name="chevron-forward"
            size={20}
            color={colors.mutedForeground}
          />
        </Pressable>
      </View>
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
  body: { padding: 20, gap: 12 },
  subtitle: { fontSize: 14, marginBottom: 16 },
  option: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  optionLabelWrap: { flex: 1 },
  optionText: { flex: 1, fontSize: 16, fontWeight: "500" },
  optionSubtext: { fontSize: 12, marginTop: 2 },
});
