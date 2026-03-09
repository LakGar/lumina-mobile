import { hexToRgba, radius, Shadows } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useThemeColors } from "@/hooks/use-theme-colors";
import Ionicons from "@expo/vector-icons/Ionicons";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import React, { useCallback } from "react";
import { Pressable, Share, StyleSheet, Text, View } from "react-native";

const QUOTES = [
  "Small steps still move you forward.",
  "Your story is worth writing.",
  "Reflection is how we make meaning.",
  "One sentence today is enough.",
  "Notice what felt good.",
  "You don't have to see the whole staircase—just take the first step.",
  "The best time to plant a tree was 20 years ago. The second best is now.",
];

function getQuoteOfDay() {
  const day = new Date().getDate();
  return QUOTES[day % QUOTES.length];
}

const QUOTE_IMAGE_URI =
  "https://images.unsplash.com/photo-1516979187457-637abb4f9353?w=800";

export function ExploreQuoteOfTheDay() {
  const colorScheme = useColorScheme();
  const colors = useThemeColors();
  const quote = getQuoteOfDay();

  const onPress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Share.share({
      message: `"${quote}" — Lumina`,
      title: "Quote of the day",
    });
  }, [quote]);

  return (
    <View style={styles.container}>
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.card,
          Shadows.md,
          pressed && { opacity: 0.96 },
        ]}
      >
        <Image
          source={{ uri: QUOTE_IMAGE_URI }}
          style={StyleSheet.absoluteFillObject}
          contentFit="cover"
        />
        <LinearGradient
          colors={["rgba(0,0,0,0.35)", "rgba(0,0,0,0.7)"]}
          style={StyleSheet.absoluteFillObject}
        />
        <LinearGradient
          colors={[
            hexToRgba(colors.primary, 0.06),
            "transparent",
            hexToRgba(colors.accent, 0.08),
          ]}
          style={StyleSheet.absoluteFillObject}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
        <View style={styles.content}>
          <View style={styles.badgeRow}>
            <Ionicons name="heart" size={14} color="rgba(255,255,255,0.95)" />
            <Text style={styles.badge}>Most liked quote today</Text>
          </View>
          <Text style={styles.quote} numberOfLines={3}>
            "{quote}"
          </Text>
        </View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 4,
  },
  card: {
    borderRadius: radius.xl,
    overflow: "hidden",
    height: 140,
  },
  content: {
    flex: 1,
    justifyContent: "flex-end",
    padding: 16,
  },
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 8,
  },
  badge: {
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    color: "rgba(255,255,255,0.95)",
  },
  quote: {
    fontSize: 17,
    fontStyle: "italic",
    lineHeight: 24,
    color: "#fff",
  },
});
