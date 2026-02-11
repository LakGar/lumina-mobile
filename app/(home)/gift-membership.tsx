import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Colors, radius, Shadows } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import Ionicons from "@expo/vector-icons/Ionicons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const PADDING_H = 20;

type InviteStatus = "pending" | "accepted";

type InvitedPerson = {
  id: string;
  email: string;
  status: InviteStatus;
  invitedAt: string;
};

// Mock previous invites – replace with API/AsyncStorage
const MOCK_PREVIOUS_INVITES: InvitedPerson[] = [
  {
    id: "1",
    email: "friend@example.com",
    status: "pending",
    invitedAt: "2 days ago",
  },
  {
    id: "2",
    email: "colleague@work.com",
    status: "accepted",
    invitedAt: "1 week ago",
  },
];

function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export default function GiftMembershipScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const insets = useSafeAreaInsets();

  const [email, setEmail] = useState("");
  const [previousInvites, setPreviousInvites] = useState<InvitedPerson[]>(
    MOCK_PREVIOUS_INVITES,
  );
  const [error, setError] = useState<string | null>(null);

  const goBack = () => router.back();

  const handleSendInvite = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const trimmed = email.trim();
    if (!trimmed) {
      setError("Enter an email address");
      return;
    }
    if (!validateEmail(trimmed)) {
      setError("Please enter a valid email");
      return;
    }
    setError(null);
    setPreviousInvites((prev) => [
      {
        id: Date.now().toString(),
        email: trimmed,
        status: "pending",
        invitedAt: "Just now",
      },
      ...prev,
    ]);
    setEmail("");
    // TODO: call API to send invite
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
        <ThemedText style={styles.headerTitle}>Gift membership</ThemedText>
        <View style={styles.headerRight} />
      </View>

      <KeyboardAvoidingView
        style={styles.keyboard}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={0}
      >
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
          keyboardShouldPersistTaps="handled"
        >
          {/* Add email section */}
          <View style={styles.section}>
            <ThemedText
              style={[styles.sectionTitle, { color: colors.mutedForeground }]}
            >
              Send a gift
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
                Enter their email and we’ll send a free trial invite.
              </Text>
              <View style={styles.inputRow}>
                <TextInput
                  value={email}
                  onChangeText={(t) => {
                    setEmail(t);
                    setError(null);
                  }}
                  placeholder="Email address"
                  placeholderTextColor={colors.mutedForeground}
                  style={[
                    styles.input,
                    {
                      backgroundColor: colors.background,
                      borderColor: error ? colors.destructive : colors.border,
                      color: colors.foreground,
                    },
                  ]}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <Pressable
                  onPress={handleSendInvite}
                  style={({ pressed }) => [
                    styles.addButton,
                    { backgroundColor: colors.primary },
                    pressed && { opacity: 0.85 },
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel="Send invite"
                >
                  <Ionicons
                    name="send"
                    size={18}
                    color={colors.primaryForeground}
                  />
                  <Text
                    style={[
                      styles.addButtonText,
                      { color: colors.primaryForeground },
                    ]}
                  >
                    Send
                  </Text>
                </Pressable>
              </View>
              {error ? (
                <Text style={[styles.errorText, { color: colors.destructive }]}>
                  {error}
                </Text>
              ) : null}
            </View>
          </View>

          {/* Previous invites */}
          <View style={styles.section}>
            <ThemedText
              style={[styles.sectionTitle, { color: colors.mutedForeground }]}
            >
              Previously invited
            </ThemedText>
            {previousInvites.length === 0 ? (
              <View
                style={[
                  styles.emptyCard,
                  { backgroundColor: colors.card, borderColor: colors.border },
                ]}
              >
                <Ionicons
                  name="mail-open-outline"
                  size={40}
                  color={colors.mutedForeground}
                />
                <Text
                  style={[styles.emptyText, { color: colors.mutedForeground }]}
                >
                  No one invited yet. Send an invite above.
                </Text>
              </View>
            ) : (
              <View
                style={[
                  styles.listCard,
                  { backgroundColor: colors.card, borderColor: colors.border },
                ]}
              >
                {previousInvites.map((person, index) => (
                  <View
                    key={person.id}
                    style={[
                      styles.inviteRow,
                      {
                        borderBottomWidth:
                          index < previousInvites.length - 1
                            ? StyleSheet.hairlineWidth
                            : 0,
                        borderBottomColor: colors.border,
                      },
                    ]}
                  >
                    <View style={styles.inviteRowContent}>
                      <Text
                        style={[
                          styles.inviteEmail,
                          { color: colors.foreground },
                        ]}
                        numberOfLines={1}
                      >
                        {person.email}
                      </Text>
                      <Text
                        style={[
                          styles.inviteMeta,
                          {
                            color: colors.mutedForeground,
                          },
                        ]}
                      >
                        {person.invitedAt}
                        {" · "}
                        <Text
                          style={
                            person.status === "accepted"
                              ? { color: "#16a34a" }
                              : { color: colors.mutedForeground }
                          }
                        >
                          {person.status === "accepted"
                            ? "Accepted"
                            : "Pending"}
                        </Text>
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.statusBadge,
                        {
                          backgroundColor:
                            person.status === "accepted"
                              ? "rgba(22, 163, 74, 0.15)"
                              : "rgba(122, 107, 90, 0.2)",
                        },
                      ]}
                    >
                      <Ionicons
                        name={
                          person.status === "accepted"
                            ? "checkmark-circle"
                            : "time-outline"
                        }
                        size={18}
                        color={
                          person.status === "accepted"
                            ? "#16a34a"
                            : colors.mutedForeground
                        }
                      />
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        </ScrollView>
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
  backButton: { padding: 4 },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  headerRight: { width: 32 },
  keyboard: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: {},
  section: {
    marginBottom: 28,
  },
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
    lineHeight: 20,
    marginBottom: 14,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  input: {
    flex: 1,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.lg,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: radius.lg,
  },
  addButtonText: {
    fontSize: 15,
    fontWeight: "600",
  },
  errorText: {
    fontSize: 13,
    marginTop: 8,
  },
  listCard: {
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
  },
  emptyCard: {
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 32,
    alignItems: "center",
    gap: 12,
  },
  emptyText: {
    fontSize: 15,
    textAlign: "center",
  },
  inviteRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  inviteRowContent: {
    flex: 1,
    minWidth: 0,
  },
  inviteEmail: {
    fontSize: 16,
    fontWeight: "500",
  },
  inviteMeta: {
    fontSize: 13,
    marginTop: 2,
  },
  statusBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
});
