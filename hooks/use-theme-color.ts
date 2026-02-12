/**
 * Resolves a theme color from the active app theme (ThemeProvider).
 * Uses useColorScheme from hooks, which reads from theme context (not system).
 */

import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";

const VALID_THEMES = ["light", "dark"] as const;

export function useThemeColor(
  props: { light?: string; dark?: string },
  colorName: keyof typeof Colors.light & keyof typeof Colors.dark,
) {
  const theme = useColorScheme();
  const safeTheme =
    theme &&
    VALID_THEMES.includes(theme as (typeof VALID_THEMES)[number]) &&
    Colors[theme as "light" | "dark"]
      ? (theme as "light" | "dark")
      : "light";
  const colorFromProps = props[safeTheme];

  if (colorFromProps) {
    return colorFromProps;
  }
  return Colors[safeTheme][colorName];
}
