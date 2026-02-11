import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Colors, radius, Shadows } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useUser } from "@clerk/clerk-expo";
import Ionicons from "@expo/vector-icons/Ionicons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React from "react";
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const PADDING_H = 20;

export default function MyAccountScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const insets = useSafeAreaInsets();
  const { user } = useUser();

  const displayName =
    user?.fullName ??
    ([user?.firstName, user?.lastName].filter(Boolean).join(" ") || "Account");
  const primaryEmail = user?.primaryEmailAddress?.emailAddress ?? "";

  const goBack = () => router.back();

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
        <ThemedText style={styles.headerTitle}>My account</ThemedText>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingHorizontal: PADDING_H,
            paddingTop: 28,
            paddingBottom: insets.bottom + 32,
          },
        ]}
        showsVerticalScrollIndicator={true}
      >
        {/* Profile section */}
        <View style={styles.section}>
          <ThemedText
            style={[styles.sectionTitle, { color: colors.mutedForeground }]}
          >
            Profile
          </ThemedText>
          <View
            style={[
              styles.profileCard,
              { backgroundColor: colors.card, borderColor: colors.border },
              Shadows.xs,
            ]}
          >
            <View style={styles.profileRow}>
              {user?.imageUrl ? (
                <Image
                  source={{ uri: user.imageUrl }}
                  style={[styles.avatar, { backgroundColor: colors.muted }]}
                />
              ) : (
                <View
                  style={[
                    styles.avatar,
                    styles.avatarPlaceholder,
                    { backgroundColor: colors.primary },
                  ]}
                >
                  <Text
                    style={[
                      styles.avatarInitials,
                      { color: colors.primaryForeground },
                    ]}
                    numberOfLines={1}
                  >
                    {displayName
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .slice(0, 2)
                      .toUpperCase() || "?"}
                  </Text>
                </View>
              )}
              <View style={styles.profileInfo}>
                <Text
                  style={[styles.displayName, { color: colors.foreground }]}
                  numberOfLines={1}
                >
                  {displayName}
                </Text>
                {primaryEmail ? (
                  <Text
                    style={[styles.email, { color: colors.mutedForeground }]}
                    numberOfLines={1}
                  >
                    {primaryEmail}
                  </Text>
                ) : null}
              </View>
              <Pressable
                onPress={() =>
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
                }
                style={({ pressed }) => [
                  styles.editButton,
                  { borderColor: colors.border },
                  pressed && { opacity: 0.7 },
                ]}
              >
                <Ionicons name="pencil" size={18} color={colors.foreground} />
                <Text
                  style={[styles.editButtonText, { color: colors.foreground }]}
                >
                  Edit
                </Text>
              </Pressable>
            </View>
          </View>
        </View>

        {/* Account actions placeholder */}
        <View style={styles.section}>
          <ThemedText
            style={[styles.sectionTitle, { color: colors.mutedForeground }]}
          >
            Account
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
                name="mail-outline"
                size={22}
                color={colors.mutedForeground}
              />
              <Text style={[styles.rowLabel, { color: colors.foreground }]}>
                Email addresses
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
                name="lock-closed-outline"
                size={22}
                color={colors.mutedForeground}
              />
              <Text style={[styles.rowLabel, { color: colors.foreground }]}>
                Password & security
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
  profileCard: {
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 18,
  },
  profileRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  avatarPlaceholder: {
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitials: {
    fontSize: 22,
    fontWeight: "700",
  },
  profileInfo: {
    flex: 1,
    marginLeft: 16,
    minWidth: 0,
  },
  displayName: {
    fontSize: 18,
    fontWeight: "700",
  },
  email: {
    fontSize: 14,
    marginTop: 2,
  },
  editButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  listCard: {
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
  },
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
});
