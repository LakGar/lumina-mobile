import { SignOutButton } from "@/components/sign-out-button";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Colors, radius, Shadows } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { SignedIn } from "@clerk/clerk-expo";
import Entypo from "@expo/vector-icons/Entypo";
import Ionicons from "@expo/vector-icons/Ionicons";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const HEADER_HEIGHT = 100;
const PADDING_H = 20;
const SCROLL_PADDING_BOTTOM = 120;

function MenuRow({
  icon,
  label,
  onPress,
  colors,
  last,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  colors: (typeof Colors)["light"];
  last?: boolean;
}) {
  return (
    <Pressable
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
      style={({ pressed }) => [
        styles.menuRow,
        { backgroundColor: colors.card, borderRadius: radius.lg },
        pressed && { opacity: 0.7 },
      ]}
    >
      <Ionicons name={icon} size={18} color={colors.mutedForeground} />
      <Text style={[styles.menuRowLabel, { color: colors.foreground }]}>
        {label}
      </Text>
      <Ionicons
        name="chevron-forward"
        size={18}
        color={colors.mutedForeground}
      />
    </Pressable>
  );
}

export default function MoreScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const membershipGradient =
    colorScheme === "dark"
      ? ([colors.primary] as const)
      : ([colors.primary] as const);

  return (
    <ThemedView style={styles.container}>
      <SignedIn>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[
            styles.scrollContent,
            {
              paddingBottom: insets.bottom + 24,
              paddingTop: insets.top + 24,
            },
          ]}
          showsVerticalScrollIndicator={true}
        >
          {/* Membership / Upgrade card */}
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              // TODO: navigate to membership/upgrade
            }}
            style={({ pressed }) => [
              styles.membershipCard,
              Shadows.sm,
              pressed && { opacity: 0.92 },
            ]}
          >
            <View
              style={[
                StyleSheet.absoluteFillObject,
                { backgroundColor: colors.primary },
              ]}
            />
            <View>
              <Image
                source={require("@/assets/images/refer.jpg")}
                contentFit="cover"
                style={styles.membershipCardImage}
              />
              <LinearGradient
                colors={["transparent", "transparent", colors.primary]}
                style={styles.membershipCardImageOverlay}
              />
            </View>

            <View style={styles.membershipCardInner}>
              <View style={styles.membershipCardText}>
                <Text style={styles.membershipCardTitle}>
                  UPGRADE YOUR MEMEBRSHIP
                </Text>
                <Text style={styles.membershipCardSubtitle}>
                  Upgrade to unlock all features
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color="#fff" />
            </View>
          </Pressable>

          {/* Refer and earn */}
          <View style={styles.section}>
            <ThemedText
              style={[styles.sectionTitle, { color: colors.mutedForeground }]}
            >
              Refer and earn
            </ThemedText>
            <View
              style={[
                styles.referCard,
                { borderColor: colors.border },
                Shadows.xs,
              ]}
            >
              <LinearGradient
                colors={
                  colorScheme === "dark"
                    ? [
                        "rgb(144, 0, 254)",
                        "rgba(236, 132, 13, 0.98)",
                        "rgb(172, 56, 204)",
                        "rgb(73, 165, 222)",
                        "rgba(35, 228, 35, 0.86)",
                        "rgba(0, 157, 255, 0.94)",
                        "rgba(253, 0, 46, 0.92)",
                      ]
                    : [
                        "rgba(145, 41, 225, 0.35)",
                        "rgba(236, 233, 13, 0.25)",
                        "rgba(172, 56, 204, 0.15)",
                        "rgba(73, 165, 222, 0.15)",
                        "rgba(35, 228, 35, 0.15)",
                        "rgba(0, 157, 255, 0.15)",
                        "rgba(253, 0, 46, 0.15)",
                      ]
                }
                style={StyleSheet.absoluteFillObject}
                start={{ x: 0, y: 1 }}
                end={{ x: 1, y: 0 }}
              />
              <View style={styles.freeTrialCard}>
                <Ionicons
                  name="gift-outline"
                  size={24}
                  color={colors.foreground}
                />
                <View>
                  <Text
                    style={[
                      styles.membershipCardTitle,
                      { color: colors.foreground },
                    ]}
                  >
                    GET 2 MONTHS FREE - LIMITED TIME OFFER
                  </Text>
                  <Text
                    style={[
                      styles.membershipCardSubtitle,
                      { color: colors.mutedForeground },
                    ]}
                  >
                    Refer a friend. They get 1 month free and get 2 weeks free.
                  </Text>
                </View>
              </View>
            </View>
            <View
              style={[
                styles.referCard,
                { borderColor: colors.border, padding: 2, marginTop: 12 },
                Shadows.xs,
              ]}
            >
              <LinearGradient
                colors={
                  colorScheme === "dark"
                    ? [
                        "rgb(144, 0, 254)",
                        "rgba(236, 132, 13, 0.98)",
                        "rgb(172, 56, 204)",
                        "rgb(73, 165, 222)",
                        "rgba(35, 228, 35, 0.86)",
                        "rgba(0, 157, 255, 0.94)",
                        "rgba(253, 0, 46, 0.92)",
                      ]
                    : [
                        "rgba(145, 41, 225, 0.35)",
                        "rgba(236, 233, 13, 0.25)",
                        "rgba(172, 56, 204, 0.15)",
                        "rgba(73, 165, 222, 0.15)",
                        "rgba(35, 228, 35, 0.15)",
                        "rgba(0, 157, 255, 0.15)",
                        "rgba(253, 0, 46, 0.15)",
                      ]
                }
                style={StyleSheet.absoluteFillObject}
                start={{ x: 0, y: 1 }}
                end={{ x: 1, y: 0 }}
              />
              <View
                style={[
                  styles.freeTrialCard,
                  {
                    backgroundColor: colors.background,
                    borderRadius: radius.lg,
                  },
                ]}
              >
                <Entypo name="slideshare" size={24} color={colors.foreground} />
                <View>
                  <Text
                    style={[
                      styles.membershipCardTitle,
                      { color: colors.foreground },
                    ]}
                  >
                    GIVE A FREE WEEK TRIAL
                  </Text>
                  <Text
                    style={[
                      styles.membershipCardSubtitle,
                      { color: colors.mutedForeground },
                    ]}
                  >
                    Share the love and help your friends get started on their
                    journey to a healthier life.
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Shop and gift */}
          <View style={styles.section}>
            <ThemedText
              style={[styles.sectionTitle, { color: colors.mutedForeground }]}
            >
              Shop and gift
            </ThemedText>
            <View
              style={[
                styles.menuBlock,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              <MenuRow
                icon="gift-outline"
                label="GIFT A MEMBERSHIP TO SOMEONE"
                onPress={() => router.push("/(home)/gift-membership")}
                colors={colors}
                last
              />
            </View>
          </View>

          {/* Account and settings */}
          <View style={styles.section}>
            <ThemedText
              style={[styles.sectionTitle, { color: colors.mutedForeground }]}
            >
              Account and settings
            </ThemedText>
            <View style={[styles.menuBlock]}>
              <MenuRow
                icon="person-outline"
                label="MY ACCOUNT"
                onPress={() => router.push("/(home)/my-account")}
                colors={colors}
              />
              <MenuRow
                icon="settings-outline"
                label="APP SETTINGS"
                onPress={() => router.push("/(home)/app-settings")}
                colors={colors}
              />
              <MenuRow
                icon="shield-checkmark-outline"
                label="PRIVACY SETTINGS"
                onPress={() => router.push("/(home)/privacy-settings")}
                colors={colors}
                last
              />
            </View>
          </View>

          {/* Support */}
          <View style={styles.section}>
            <ThemedText
              style={[styles.sectionTitle, { color: colors.mutedForeground }]}
            >
              Support
            </ThemedText>
            <View style={[styles.menuBlock]}>
              <MenuRow
                icon="card-outline"
                label="MEMBERSHIP SERVICES"
                onPress={() => {}}
                colors={colors}
              />
              <MenuRow
                icon="book-outline"
                label="TUTORIAL"
                onPress={() => {}}
                colors={colors}
              />
              <MenuRow
                icon="information-circle-outline"
                label="ABOUT"
                onPress={() => {}}
                colors={colors}
                last
              />
            </View>
          </View>

          {/* Logout */}
          <View style={[styles.section, styles.logoutSection]}>
            <SignOutButton />
          </View>
        </ScrollView>
      </SignedIn>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: PADDING_H,
  },

  membershipCard: {
    borderRadius: radius.xl,
    overflow: "hidden",
    marginBottom: 24,
    position: "relative",
    minHeight: 88,
  },
  membershipCardInner: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    position: "relative",
    zIndex: 1,
  },
  membershipCardText: {
    flex: 1,
  },
  membershipCardTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#fff",
  },

  membershipCardImage: {
    width: "100%",
    height: 160,
  },
  membershipCardImageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  membershipCardSubtitle: {
    fontSize: 12,
    color: "rgba(255,255,255,0.9)",
    marginTop: 2,
    width: "60%",
  },
  section: {
    marginBottom: 24,
  },
  freeTrialCard: {
    overflow: "hidden",
    position: "relative",
    flexDirection: "row",
    padding: 13,
    alignItems: "center",
    gap: 12,
    width: "100%",
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  referCard: {
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
    position: "relative",
  },
  referCardInner: {
    padding: 16,
    position: "relative",
    zIndex: 1,
  },
  referBody: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 14,
  },
  shareButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: radius.lg,
  },
  shareButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#fff",
  },
  menuBlock: {
    borderRadius: radius.lg,
    flexDirection: "column",
    gap: 4,
    overflow: "hidden",
  },
  menuRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 12,
  },
  menuRowLabel: {
    flex: 1,
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  logoutSection: {
    marginTop: 8,
    marginBottom: 40,
  },
});
