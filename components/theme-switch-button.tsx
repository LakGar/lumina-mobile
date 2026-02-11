import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import * as Haptics from "expo-haptics";
import { Pressable, StyleSheet, View } from "react-native";
import { useTheme } from "@/contexts/theme-context";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";

const ICON_SIZE = 24;

export function ThemeSwitchButton() {
  const theme = useTheme();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];

  if (!theme) {
    return null;
  }

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    theme.toggleTheme();
  };

  const isDark = theme.resolvedTheme === "dark";

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [
        styles.touchable,
        pressed && styles.pressed,
      ]}
      accessibilityRole="button"
      accessibilityLabel={isDark ? "Switch to light theme" : "Switch to dark theme"}
    >
      <View style={[styles.iconWrap, { backgroundColor: colors.secondary }]}>
        <MaterialIcons
          name={isDark ? "light-mode" : "dark-mode"}
          size={ICON_SIZE}
          color={colors.foreground}
        />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  touchable: {
    padding: 4,
  },
  pressed: {
    opacity: 0.7,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
});
