import { Colors, radius, Shadows } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import Ionicons from "@expo/vector-icons/Ionicons";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import React from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const TAB_BAR_CLEARANCE = 56;

type HomeFloatingActionsProps = {
  /** When true, shows the AI suggestions sticky bar above the create button */
  hasAiSuggestions?: boolean;
  onCreateEntry?: () => void;
  onAiSuggestionPress?: () => void;
};

export function HomeFloatingActions({
  hasAiSuggestions = false,
  onCreateEntry,
  onAiSuggestionPress,
}: HomeFloatingActionsProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const insets = useSafeAreaInsets();
  const bottomPadding = insets.bottom + TAB_BAR_CLEARANCE;

  const handleCreatePress = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (_) {}
    onCreateEntry?.();
  };

  const handleAiPress = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (_) {}
    onAiSuggestionPress?.();
  };

  return (
    <View
      style={[
        styles.wrapper,
        {
          paddingBottom: bottomPadding,
          paddingHorizontal: 20,
        },
      ]}
      pointerEvents="box-none"
    >
      <View style={styles.stack}>
        {hasAiSuggestions && (
          <Pressable
            onPress={handleAiPress}
            style={({ pressed }) => [
              styles.aiBar,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                opacity: pressed ? 0.9 : 1,
              },
              Shadows.sm,
            ]}
            accessibilityRole="button"
            accessibilityLabel="View AI suggestion"
          >
            <Image
              source={require("@/assets/images/ai.jpg")}
              style={styles.aiImage}
              contentFit="cover"
            />
            <View style={styles.aiLabelContainer}>
              <Text
                style={[styles.aiLabel, { color: colors.foreground }]}
                numberOfLines={1}
              >
                Let's keep you on track
              </Text>
              <Text
                style={[
                  styles.aiLabel,
                  { color: colors.mutedForeground, fontSize: 12 },
                ]}
                numberOfLines={1}
              >
                Missed journal? Skip or add your thoughts later.
              </Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={18}
              color={colors.mutedForeground}
            />
          </Pressable>
        )}

        <Pressable
          onPress={handleCreatePress}
          style={({ pressed }) => [
            styles.createButton,
            {
              backgroundColor: colors.primary,
              opacity: pressed ? 0.9 : 1,
            },
            Shadows.md,
          ]}
          accessibilityRole="button"
          accessibilityLabel="Create entry"
        >
          <Ionicons
            name="add-circle-outline"
            size={24}
            color={colors.primaryForeground}
            style={styles.createIcon}
          />
          <Text
            style={[styles.createLabel, { color: colors.primaryForeground }]}
          >
            Create entry
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
  },
  stack: {
    width: "100%",
    maxWidth: 500,
    gap: 10,
  },
  aiBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    ...(Platform.OS === "android" && { elevation: 2 }),
    justifyContent: "space-between",
  },
  aiImage: {
    marginRight: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  aiLabelContainer: {
    flex: 1,
  },
  aiLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
  },
  createButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: radius.lg,
    width: "100%",
    ...(Platform.OS === "android" && { elevation: 3 }),
  },
  createIcon: {
    marginRight: 10,
  },
  createLabel: {
    fontSize: 16,
    fontWeight: "700",
  },
});
