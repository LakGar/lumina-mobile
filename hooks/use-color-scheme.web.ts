import { useEffect, useState } from "react";
import { useColorScheme as useRNColorScheme } from "react-native";
import { useTheme } from "@/contexts/theme-context";

/**
 * Web: support static rendering by resolving theme after hydration.
 * Uses the theme manager (user preference) when available.
 */
export function useColorScheme() {
  const [hasHydrated, setHasHydrated] = useState(false);
  const theme = useTheme();
  const systemScheme = useRNColorScheme();

  useEffect(() => {
    setHasHydrated(true);
  }, []);

  if (!hasHydrated) {
    return "light";
  }

  if (theme) {
    return theme.resolvedTheme;
  }

  return systemScheme ?? "light";
}
