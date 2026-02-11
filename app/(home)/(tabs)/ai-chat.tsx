import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useState } from "react";
import { Dimensions, Pressable, StyleSheet, Text, View } from "react-native";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

export default function AIChatScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const [fullScreen, setFullScreen] = useState(false);

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.background,
          height: fullScreen ? SCREEN_HEIGHT : "85%",
        },
      ]}
    >
      <StatusBar style={colorScheme === "dark" ? "light" : "dark"} />
      <View style={[styles.handleBar, { backgroundColor: colors.border }]} />
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [
            styles.headerButton,
            pressed && styles.pressed,
          ]}
          hitSlop={12}
        >
          <MaterialIcons name="close" size={24} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.title, { color: colors.foreground }]}>
          AI Chat
        </Text>
        <Pressable
          onPress={() => setFullScreen((v) => !v)}
          style={({ pressed }) => [
            styles.headerButton,
            pressed && styles.pressed,
          ]}
          hitSlop={12}
        >
          <MaterialIcons
            name={fullScreen ? "fullscreen-exit" : "fullscreen"}
            size={24}
            color={colors.foreground}
          />
        </Pressable>
      </View>
      <View style={styles.content}>
        <Text style={[styles.placeholder, { color: colors.mutedForeground }]}>
          Start a conversation with AI...
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: "hidden",
  },
  handleBar: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    marginTop: 12,
    marginBottom: 8,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  pressed: {
    opacity: 0.7,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  placeholder: {
    fontSize: 16,
  },
});
