import { useTheme } from "@/contexts/theme-context";
import { useColorScheme as useRNColorScheme } from "react-native";

/**
 * Returns the active color scheme for the app.
 * Uses the theme manager (user preference) when available, otherwise falls back to system.
 */
export function useColorScheme(): "light" | "dark" {
  const theme = useTheme();
  const systemScheme = useRNColorScheme();

  if (theme?.resolvedTheme === "dark" || theme?.resolvedTheme === "light") {
    return theme.resolvedTheme;
  }

  return systemScheme === "dark" ? "dark" : "light";
}
