import { Colors, radius, Shadows } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import Ionicons from "@expo/vector-icons/Ionicons";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import {
  Dimensions,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { ThemedText } from "./themed-text";

const CARD_WIDTH = Dimensions.get("window").width * 0.72;
const CARD_MARGIN = 12;
const CARD_HEIGHT = 280;

const JOURNALING_BLOGS: Array<{
  id: string;
  title: string;
  subtitle: string;
  imageUri: string;
  url: string;
  gradientOverlay: [string, string];
}> = [
  {
    id: "gratitude",
    title: "Gratitude journaling",
    subtitle: "Why and how to start a gratitude practice",
    imageUri:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600",
    url: "https://www.psychologytoday.com/us/basics/gratitude",
    gradientOverlay: ["transparent", "rgba(0,0,0,0.75)"],
  },
  {
    id: "morning-pages",
    title: "Morning pages",
    subtitle: "Clear your mind before the day begins",
    imageUri:
      "https://images.unsplash.com/photo-1455390582262-044cdead277a?w=600",
    url: "https://juliacameronlive.com/basic-tools/morning-pages/",
    gradientOverlay: ["transparent", "rgba(0,0,0,0.8)"],
  },
  {
    id: "bullet",
    title: "Bullet journal",
    subtitle: "Organize goals, habits, and reflections",
    imageUri:
      "https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=600",
    url: "https://bulletjournal.com/pages/learn",
    gradientOverlay: ["transparent", "rgba(0,0,0,0.78)"],
  },
  {
    id: "reflection",
    title: "Reflection prompts",
    subtitle: "Deeper questions for weekly check-ins",
    imageUri:
      "https://images.unsplash.com/photo-1517842645767-c639042777db?w=600",
    url: "https://positivepsychology.com/self-reflection-exercises/",
    gradientOverlay: ["transparent", "rgba(0,0,0,0.76)"],
  },
];

export function ExploreJournalingBlogs() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  const onPress = useCallback((item: (typeof JOURNALING_BLOGS)[0]) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Linking.openURL(item.url);
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="newspaper-outline" size={20} color={colors.primary} />
        <ThemedText
          type="default"
          style={[styles.sectionLabel, { color: colors.mutedForeground }]}
        >
          Journaling guides
        </ThemedText>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {JOURNALING_BLOGS.map((item) => (
          <Pressable
            key={item.id}
            onPress={() => onPress(item)}
            style={({ pressed }) => [
              styles.card,
              Shadows.md,
              pressed && { opacity: 0.92 },
            ]}
          >
            <Image
              source={{ uri: item.imageUri }}
              style={styles.image}
              contentFit="cover"
            />
            <LinearGradient
              colors={item.gradientOverlay}
              style={StyleSheet.absoluteFill}
              start={{ x: 0.5, y: 0.2 }}
              end={{ x: 0.5, y: 1 }}
            />
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle} numberOfLines={1}>
                {item.title}
              </Text>
              <Text style={styles.cardSubtitle} numberOfLines={2}>
                {item.subtitle}
              </Text>
              <View style={styles.readMoreRow}>
                <Text style={[styles.readMoreText, { color: colors.primary }]}>
                  Read on blog
                </Text>
                <Ionicons
                  name="arrow-forward"
                  size={14}
                  color={colors.primary}
                />
              </View>
            </View>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 24,
    paddingBottom: 8,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 20,
    marginBottom: 14,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  scrollContent: {
    paddingHorizontal: 20,
    gap: CARD_MARGIN,
    paddingBottom: 8,
  },
  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: radius.xl,
    overflow: "hidden",
  },
  image: {
    ...StyleSheet.absoluteFillObject,
  },
  cardContent: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    padding: 16,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 13,
    color: "rgba(255,255,255,0.88)",
    marginBottom: 10,
  },
  readMoreRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  readMoreText: {
    fontSize: 13,
    fontWeight: "600",
  },
});
