import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import Ionicons from "@expo/vector-icons/Ionicons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React from "react";
import { Linking, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const APP_VERSION = "1.0.0";

export default function AboutScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const insets = useSafeAreaInsets();

  const goBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  const openPrivacy = () => {
    // Replace with your privacy policy URL
    Linking.openURL("https://example.com/privacy").catch(() => {});
  };

  const openTerms = () => {
    // Replace with your terms of service URL
    Linking.openURL("https://example.com/terms").catch(() => {});
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
          About
        </ThemedText>
        <View style={{ width: 24 }} />
      </View>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator
      >
        <ThemedText style={[styles.appName, { color: colors.foreground }]}>
          Lumina
        </ThemedText>
        <ThemedText style={[styles.version, { color: colors.mutedForeground }]}>
          Version {APP_VERSION}
        </ThemedText>
        <ThemedText style={[styles.tagline, { color: colors.mutedForeground }]}>
          Your personal journaling companion.
        </ThemedText>
        <View style={styles.links}>
          <Pressable
            onPress={openPrivacy}
            style={({ pressed }) => [
              styles.linkRow,
              { borderColor: colors.border },
              pressed && { opacity: 0.7 },
            ]}
          >
            <ThemedText style={[styles.linkText, { color: colors.primary }]}>
              Privacy policy
            </ThemedText>
            <Ionicons name="open-outline" size={18} color={colors.primary} />
          </Pressable>
          <Pressable
            onPress={openTerms}
            style={({ pressed }) => [
              styles.linkRow,
              { borderColor: colors.border },
              pressed && { opacity: 0.7 },
            ]}
          >
            <ThemedText style={[styles.linkText, { color: colors.primary }]}>
              Terms of service
            </ThemedText>
            <Ionicons name="open-outline" size={18} color={colors.primary} />
          </Pressable>
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
  scrollContent: { padding: 24, paddingBottom: 40 },
  appName: {
    fontSize: 24,
    fontWeight: "700",
    textAlign: "center",
    marginTop: 20,
  },
  version: { fontSize: 14, textAlign: "center", marginTop: 4 },
  tagline: { fontSize: 15, textAlign: "center", marginTop: 12 },
  links: { marginTop: 32, gap: 8 },
  linkRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 12,
  },
  linkText: { fontSize: 15, fontWeight: "500" },
});
