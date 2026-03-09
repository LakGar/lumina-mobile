import { radius } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useThemeColors } from "@/hooks/use-theme-colors";
import { Image } from "expo-image";
import { router } from "expo-router";
import React, { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ThemeSwitchButton } from "./theme-switch-button";
import { ThemedText } from "./themed-text";

const WelcomeScreen = () => {
  const colorScheme = useColorScheme();
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();

  const themedStyles = useMemo(
    () => ({
      button: {
        backgroundColor: colors.primary,
        padding: 14,
        borderRadius: radius.md,
        width: "100%" as const,
        alignItems: "center" as const,
      },
      buttonText: {
        color: colors.primaryForeground,
        fontWeight: "bold" as const,
      },
      altButton: {
        backgroundColor: colors.secondary,
        padding: 14,
        borderRadius: radius.md,
        width: "100%" as const,
        alignItems: "center" as const,
      },
      altButtonText: {
        color: colors.primary,
        fontWeight: "bold" as const,
      },
    }),
    [colors],
  );

  return (
    <View style={styles.container}>
      <Image
        source={require("@/assets/images/auth-bg.png")}
        style={styles.bgImage}
        contentFit="cover"
      />
        <View style={[styles.overlay, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 24 }]}>
        <View style={styles.topRow}>
          <Text style={styles.title}>Lumina</Text>
          <ThemeSwitchButton />
        </View>
        <View style={styles.spacer} />
        <View style={styles.buttonsContainer}>
          <Pressable
            style={themedStyles.button}
            onPress={() => router.push("/(auth)/sign-in")}
          >
            <ThemedText style={themedStyles.buttonText}>Sign in</ThemedText>
          </Pressable>
          <Pressable
            style={themedStyles.altButton}
            onPress={() => router.push("/(auth)/sign-up")}
          >
            <ThemedText style={themedStyles.altButtonText}>Sign up</ThemedText>
          </Pressable>
        </View>
      </View>
    </View>
  );
};

export default WelcomeScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: "100%",
  },
  bgImage: {
    ...StyleSheet.absoluteFillObject,
    width: "100%",
    height: "100%",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "space-between",
    paddingHorizontal: 24,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
  },
  title: {
    fontSize: 28,
    fontWeight: "600",
    color: "#fff",
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  spacer: {
    flex: 1,
  },
  buttonsContainer: {
    gap: 12,
    width: "100%",
  },
});
