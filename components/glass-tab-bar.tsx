import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { GlassView, isLiquidGlassAvailable } from "expo-glass-effect";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const TAB_ROUTES = ["index", "explore", "journals", "more"] as const;
const TAB_LABELS: Record<string, string> = {
  index: "Home",
  explore: "Explore",
  journals: "Journals",
  more: "More",
};
const TAB_ICONS: Record<string, keyof typeof MaterialIcons.glyphMap> = {
  index: "home",
  explore: "explore",
  journals: "menu-book",
  more: "menu",
};

export function GlassTabBar({
  state,
  navigation,
  descriptors,
}: BottomTabBarProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const useGlass = Platform.OS === "ios" && isLiquidGlassAvailable();

  const onAIPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push("/(home)/(tabs)/ai-chat");
  };

  return (
    <View
      style={[
        styles.outer,
        {
          paddingBottom: insets.bottom,
          backgroundColor: useGlass
            ? "transparent"
            : colorScheme === "dark"
              ? "rgba(0,0,0,0.75)"
              : "rgba(255,255,255,0.85)",
        },
      ]}
    >
      {useGlass && (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          <GlassView
            style={StyleSheet.absoluteFill}
            glassEffectStyle="regular"
            tintColor={
              colorScheme === "dark"
                ? "rgba(0,0,0,0.5)"
                : "rgba(255,255,255,0.7)"
            }
          />
        </View>
      )}
      <View style={styles.inner}>
        {TAB_ROUTES.slice(0, 2).map((routeName) => {
          const route = state.routes.find((r) => r.name === routeName);
          if (!route) return null;
          const routeIndex = state.routes.findIndex(
            (r) => r.name === routeName,
          );
          const isFocused = state.index === routeIndex;
          const descriptor = descriptors[route.key];
          const options = descriptor?.options ?? {};
          const label =
            options.tabBarLabel ?? TAB_LABELS[routeName] ?? routeName;
          const iconName = TAB_ICONS[routeName] ?? "circle";

          const onPress = () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            const event = navigation.emit({
              type: "tabPress",
              target: route.key,
              canPreventDefault: true,
            });
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name, route.params);
            }
          };

          return (
            <Pressable
              key={route.key}
              onPress={onPress}
              style={({ pressed }) => [styles.tab, pressed && styles.pressed]}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={typeof label === "string" ? label : undefined}
            >
              <MaterialIcons
                name={iconName}
                size={26}
                color={isFocused ? colors.primary : colors.mutedForeground}
              />
              <Text
                style={[
                  styles.label,
                  {
                    color: isFocused ? colors.primary : colors.mutedForeground,
                  },
                ]}
                numberOfLines={1}
              >
                {typeof label === "string" ? label : route.name}
              </Text>
            </Pressable>
          );
        })}

        <Pressable
          onPress={onAIPress}
          style={({ pressed }) => [styles.aiButton, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel="Open AI Chat"
        >
          <View
            style={[styles.aiButtonInner, { backgroundColor: colors.primary }]}
          >
            <MaterialIcons
              name="smart-toy"
              size={28}
              color={colors.primaryForeground}
            />
          </View>
          <Text style={[styles.aiLabel, { color: colors.mutedForeground }]}>
            AI
          </Text>
        </Pressable>

        {TAB_ROUTES.slice(2, 4).map((routeName) => {
          const route = state.routes.find((r) => r.name === routeName);
          if (!route) return null;
          const routeIndex = state.routes.findIndex(
            (r) => r.name === routeName,
          );
          const isFocused = state.index === routeIndex;
          const descriptor = descriptors[route.key];
          const options = descriptor?.options ?? {};
          const label =
            options.tabBarLabel ?? TAB_LABELS[routeName] ?? routeName;
          const iconName = TAB_ICONS[routeName] ?? "circle";

          const onPress = () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            const event = navigation.emit({
              type: "tabPress",
              target: route.key,
              canPreventDefault: true,
            });
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name, route.params);
            }
          };

          return (
            <Pressable
              key={route.key}
              onPress={onPress}
              style={({ pressed }) => [styles.tab, pressed && styles.pressed]}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={typeof label === "string" ? label : undefined}
            >
              <MaterialIcons
                name={iconName}
                size={26}
                color={isFocused ? colors.primary : colors.mutedForeground}
              />
              <Text
                style={[
                  styles.label,
                  {
                    color: isFocused ? colors.primary : colors.mutedForeground,
                  },
                ]}
                numberOfLines={1}
              >
                {typeof label === "string" ? label : route.name}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(255,255,255,0.1)",
  },
  inner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingTop: 8,
    paddingHorizontal: 8,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 4,
  },
  pressed: {
    opacity: 0.7,
  },
  label: {
    fontSize: 11,
    fontWeight: "500",
    marginTop: 2,
  },
  aiButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 4,
  },
  aiButtonInner: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 2,
  },
  aiLabel: {
    fontSize: 11,
    fontWeight: "500",
  },
});
