import { useColorScheme as useRNColorScheme } from "react-native";
import { useTheme } from "@/contexts/theme-context";

/**
 * Returns the active color scheme for the app.
 * Uses the theme manager (user preference) when available, otherwise falls back to system.
 */
export function useColorScheme() {
  const theme = useTheme();
  const systemScheme = useRNColorScheme();

  if (theme) {
    return theme.resolvedTheme;
  }

  return systemScheme ?? "light";
}
