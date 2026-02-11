import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import Ionicons from "@expo/vector-icons/Ionicons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

const QUOTES = [
  "Small steps still move you forward.",
  "Your story is worth writing.",
  "Reflection is how we make meaning.",
  "One sentence today is enough.",
  "Notice what felt good.",
];

function getQuoteOfDay() {
  const day = new Date().getDate();
  return QUOTES[day % QUOTES.length];
}

export function ExploreQuote() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const quote = getQuoteOfDay();

  return (
    <View style={styles.wrapper}>
      <Ionicons
        name="chatbox-ellipses-outline"
        size={18}
        color={colors.mutedForeground}
        style={styles.icon}
      />
      <Text
        style={[styles.quote, { color: colors.mutedForeground }]}
        numberOfLines={2}
      >
        {quote}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
    gap: 10,
  },
  icon: {
    opacity: 0.8,
  },
  quote: {
    flex: 1,
    fontSize: 14,
    fontStyle: "italic",
    lineHeight: 20,
  },
});
