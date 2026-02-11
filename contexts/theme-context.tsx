import * as SecureStore from "expo-secure-store";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { useColorScheme as useSystemColorScheme } from "react-native";

export type ThemePreference = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

const THEME_STORAGE_KEY = "lumina_theme_preference";

type ThemeContextValue = {
  /** Resolved theme used for UI (always 'light' or 'dark') */
  resolvedTheme: ResolvedTheme;
  /** User's preference (light, dark, or system) */
  preference: ThemePreference;
  setPreference: (preference: ThemePreference) => void;
  /** Toggle between light and dark (ignores system) */
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function useTheme() {
  const context = useContext(ThemeContext);
  return context;
}

type ThemeProviderProps = {
  children: React.ReactNode;
};

export function ThemeProvider({ children }: ThemeProviderProps) {
  const systemTheme = useSystemColorScheme();
  const [preference, setPreferenceState] = useState<ThemePreference>("light");
  const [loaded, setLoaded] = useState(false);

  const resolvedTheme: ResolvedTheme =
    preference === "system"
      ? systemTheme === "dark"
        ? "dark"
        : "light"
      : preference;

  useEffect(() => {
    SecureStore.getItemAsync(THEME_STORAGE_KEY).then((stored) => {
      if (stored === "light" || stored === "dark" || stored === "system") {
        setPreferenceState(stored);
      }
      setLoaded(true);
    });
  }, []);

  const setPreference = useCallback((value: ThemePreference) => {
    setPreferenceState(value);
    SecureStore.setItemAsync(THEME_STORAGE_KEY, value);
  }, []);

  const toggleTheme = useCallback(() => {
    setPreferenceState((prev) => {
      const next = prev === "light" ? "dark" : "light";
      SecureStore.setItemAsync(THEME_STORAGE_KEY, next);
      return next;
    });
  }, []);

  const value: ThemeContextValue = {
    resolvedTheme,
    preference,
    setPreference,
    toggleTheme,
  };

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}
