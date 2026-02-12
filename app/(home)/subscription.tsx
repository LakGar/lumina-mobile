import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Colors, radius, Shadows } from "@/constants/theme";
import { useApi } from "@/hooks/use-api";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { ApiError } from "@/lib/api";
import { getSafeExternalUrl } from "@/lib/safe-url";
import Ionicons from "@expo/vector-icons/Ionicons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function SubscriptionScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const insets = useSafeAreaInsets();
  const api = useApi();

  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);

  const goBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  const handleUpgrade = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setCheckoutLoading(true);
    try {
      const { url } = await api.createCheckoutSession();
      const safeUrl = getSafeExternalUrl(url);
      if (safeUrl) {
        await WebBrowser.openBrowserAsync(safeUrl);
      } else if (url) {
        Alert.alert("Error", "Checkout URL was not safe to open.");
      } else {
        Alert.alert("Error", "No checkout URL was returned.");
      }
    } catch (e) {
      const msg =
        e instanceof ApiError && e.status === 404
          ? "Upgrade is not available yet. Please try again later."
          : e instanceof Error
            ? e.message
            : "Could not start checkout. Please try again.";
      Alert.alert("Error", msg);
    } finally {
      setCheckoutLoading(false);
    }
  };

  const handleManageBilling = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPortalLoading(true);
    try {
      const { url } = await api.createPortalSession();
      const safeUrl = getSafeExternalUrl(url);
      if (safeUrl) {
        await WebBrowser.openBrowserAsync(safeUrl);
      } else if (url) {
        Alert.alert("Error", "Billing portal URL was not safe to open.");
      } else {
        Alert.alert("Error", "No billing portal URL was returned.");
      }
    } catch (e) {
      const msg =
        e instanceof ApiError && e.status === 404
          ? "Billing portal is not available yet. Please try again later."
          : e instanceof Error
            ? e.message
            : "Could not open billing. Please try again.";
      Alert.alert("Error", msg);
    } finally {
      setPortalLoading(false);
    }
  };

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top + 8 }]}>
      <View style={styles.header}>
        <Pressable
          onPress={goBack}
          hitSlop={12}
          style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
          accessibilityRole="button"
          accessibilityLabel="Back"
        >
          <Ionicons name="arrow-back" size={24} color={colors.foreground} />
        </Pressable>
        <ThemedText type="subtitle" style={styles.title}>
          Upgrade
        </ThemedText>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingHorizontal: 24,
            paddingBottom: insets.bottom + 32,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <View
            style={[
              styles.iconWrap,
              { backgroundColor: colors.primary + "20" },
            ]}
          >
            <Ionicons name="ribbon" size={48} color={colors.primary} />
          </View>
          <ThemedText style={styles.heroTitle}>Lumina Premium</ThemedText>
          <ThemedText
            style={[styles.heroSubtitle, { color: colors.mutedForeground }]}
          >
            Unlock your full journaling potential with a Lumina subscription.
          </ThemedText>
        </View>

        <View
          style={[
            styles.card,
            { backgroundColor: colors.card, borderColor: colors.border },
            Shadows.xs,
          ]}
        >
          <ThemedText
            style={[styles.benefitsTitle, { color: colors.mutedForeground }]}
          >
            What you get
          </ThemedText>
          <BenefitRow
            icon="infinite-outline"
            label="Unlimited journals and entries"
            colors={colors}
          />
          <BenefitRow
            icon="sparkles-outline"
            label="AI reflections and prompts"
            colors={colors}
          />
          <BenefitRow
            icon="stats-chart-outline"
            label="Lumina level and insights"
            colors={colors}
          />
          <BenefitRow
            icon="cloud-done-outline"
            label="Sync across devices"
            colors={colors}
          />
        </View>

        <Pressable
          onPress={handleUpgrade}
          disabled={checkoutLoading || portalLoading}
          style={({ pressed }) => [
            styles.primaryButton,
            { backgroundColor: colors.primary },
            Shadows.sm,
            (pressed || checkoutLoading || portalLoading) && { opacity: 0.85 },
          ]}
        >
          {checkoutLoading ? (
            <ActivityIndicator size="small" color={colors.primaryForeground} />
          ) : (
            <>
              <Ionicons
                name="arrow-up-circle"
                size={22}
                color={colors.primaryForeground}
              />
              <Text
                style={[
                  styles.primaryButtonText,
                  { color: colors.primaryForeground },
                ]}
              >
                Upgrade to Premium
              </Text>
            </>
          )}
        </Pressable>

        <Pressable
          onPress={handleManageBilling}
          disabled={checkoutLoading || portalLoading}
          style={({ pressed }) => [
            styles.secondaryButton,
            { borderColor: colors.border },
            (pressed || checkoutLoading || portalLoading) && { opacity: 0.7 },
          ]}
        >
          {portalLoading ? (
            <ActivityIndicator size="small" color={colors.foreground} />
          ) : (
            <>
              <Ionicons
                name="card-outline"
                size={20}
                color={colors.mutedForeground}
              />
              <Text
                style={[
                  styles.secondaryButtonText,
                  { color: colors.foreground },
                ]}
              >
                Manage subscription & billing
              </Text>
            </>
          )}
        </Pressable>
      </ScrollView>
    </ThemedView>
  );
}

function BenefitRow({
  icon,
  label,
  colors,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  colors: Record<string, string>;
}) {
  return (
    <View style={styles.benefitRow}>
      <Ionicons
        name={icon}
        size={20}
        color={colors.primary}
        style={styles.benefitIcon}
      />
      <Text style={[styles.benefitLabel, { color: colors.foreground }]}>
        {label}
      </Text>
    </View>
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
  title: { fontSize: 18, fontWeight: "700" },
  scroll: { flex: 1 },
  scrollContent: { paddingTop: 16 },
  hero: {
    alignItems: "center",
    marginBottom: 28,
  },
  iconWrap: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: "800",
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 15,
    textAlign: "center",
    lineHeight: 22,
    paddingHorizontal: 8,
  },
  card: {
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 20,
    marginBottom: 24,
  },
  benefitsTitle: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 14,
  },
  benefitRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  benefitIcon: { marginRight: 12 },
  benefitLabel: { fontSize: 16, flex: 1 },
  primaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 16,
    borderRadius: radius.lg,
    marginBottom: 12,
  },
  primaryButtonText: { fontSize: 17, fontWeight: "700" },
  secondaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
  },
  secondaryButtonText: { fontSize: 15, fontWeight: "600" },
});
