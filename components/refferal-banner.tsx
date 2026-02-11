import { Colors, radius, Shadows } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import Ionicons from "@expo/vector-icons/Ionicons";
import React from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";

export default function RefferalBanner() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.card,
          {
            backgroundColor: colors.card,
            borderColor: colors.border,
          },
          Shadows.sm,
        ]}
      >
        <Pressable
          style={({ pressed }) => [
            styles.closeButton,
            {
              opacity: pressed ? 0.7 : 1,
              backgroundColor: colors.mutedForeground,
            },
          ]}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Dismiss"
        >
          <Ionicons name="close" size={18} color={colors.muted} />
        </Pressable>

        <View style={styles.giftIconWrap}>
          <Ionicons name="gift" size={48} color={colors.primary} />
        </View>

        <Text style={[styles.title, { color: colors.foreground }]}>
          Give a gift to your friend
        </Text>
        <Text style={[styles.description, { color: colors.mutedForeground }]}>
          Share the love and help your friends get started on their journey to a
          healthier life.
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Refer a friend"
        >
          <Text style={[styles.buttonText, { color: colors.primary }]}>
            REFFER A FRIEND
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginTop: 12,
  },
  card: {
    borderRadius: radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 20,
    position: "relative",
    overflow: "hidden",
  },
  closeButton: {
    position: "absolute",
    top: 12,
    right: 12,
    width: 30,
    height: 30,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
  },
  giftIconWrap: {
    position: "absolute",
    bottom: 16,
    right: 20,
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 6,
  },
  description: {
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 16,
    width: "70%",
  },
  button: {
    alignSelf: "flex-start",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: radius.lg,
    ...(Platform.OS === "android" && { elevation: 0 }),
  },
  buttonText: {
    fontSize: 10,
    fontWeight: "600",
  },
});
