/**
 * Resolves a theme color from the active app theme (ThemeProvider).
 * Uses the selected color palette (Lumina, Ocean, etc.) and light/dark mode.
 */

import type { ColorSet } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useThemeColors } from "@/hooks/use-theme-colors";

export function useThemeColor(
  props: { light?: string; dark?: string },
  colorName: keyof ColorSet,
) {
  const theme = useColorScheme();
  const colors = useThemeColors();
  const colorFromProps = theme === "dark" ? props.dark : props.light;

  if (colorFromProps) {
    return colorFromProps;
  }
  return colors[colorName];
}
