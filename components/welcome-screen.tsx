import { Colors, radius } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Image } from "expo-image";
import { router } from "expo-router";
import React, { useMemo } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { ThemeSwitchButton } from "./theme-switch-button";
import { ThemedText } from "./themed-text";
import { ThemedView } from "./themed-view";

const WelcomeScreen = () => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  const themedStyles = useMemo(
    () => ({
      container: {
        backgroundColor: colors.background,
        flex: 1,
        justifyContent: "space-between" as const,
        alignItems: "center" as const,
        padding: 20,
        paddingTop: 60,
        width: "100%" as const,
      },
      button: {
        backgroundColor: colors.primary,
        padding: 10,
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
        padding: 10,
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
    <ThemedView style={themedStyles.container}>
      <View style={StyleSheet.absoluteFill} pointerEvents="none"></View>
      <ThemedText style={styles.title}>Lumina</ThemedText>
      <ThemeSwitchButton />
      <View style={styles.imgContainer}>
        <Image
          source={require("@/assets/images/welcome.png")}
          style={styles.img}
        />
      </View>
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
    </ThemedView>
  );
};

export default WelcomeScreen;

const styles = StyleSheet.create({
  orb: {
    position: "absolute",
    borderRadius: 9999,
    overflow: "hidden",
  },

  title: {
    fontSize: 24,
    fontWeight: "semibold",
    flex: 1,
    width: "100%",
  },
  buttonsContainer: {
    gap: 10,
    width: "100%",
  },
  imgContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  img: {
    width: 300,
    height: 300,
    resizeMode: "contain",
  },
});
