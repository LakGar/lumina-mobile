import { View, type ViewProps } from "react-native";

import { useThemeColor } from "@/hooks/use-theme-color";

/**
 * View that uses the active app theme (ThemeProvider) for background color.
 * Override with lightColor/darkColor per instance if needed.
 */
export type ThemedViewProps = ViewProps & {
  lightColor?: string;
  darkColor?: string;
};

export function ThemedView({
  style,
  lightColor,
  darkColor,
  ...otherProps
}: ThemedViewProps) {
  const backgroundColor = useThemeColor(
    { light: lightColor, dark: darkColor },
    "background"
  );

  return <View style={[{ backgroundColor }, style]} {...otherProps} />;
}
