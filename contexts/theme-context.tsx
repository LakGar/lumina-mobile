import {
  apiColorSchemeToPaletteId,
  type ColorSchemeId,
} from "@/constants/theme";
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
const COLOR_SCHEME_STORAGE_KEY = "lumina_color_scheme";
const COLOR_SCHEME_API_STORAGE_KEY = "lumina_color_scheme_api";

const DEFAULT_COLOR_SCHEME: ColorSchemeId = "lumina";

type ThemeContextValue = {
  /** Resolved theme used for UI (always 'light' or 'dark') */
  resolvedTheme: ResolvedTheme;
  /** User's preference (light, dark, or system) */
  preference: ThemePreference;
  setPreference: (preference: ThemePreference) => void;
  /** Toggle between light and dark (ignores system) */
  toggleTheme: () => void;
  /** Selected color palette id (Lumina, Ocean, etc.) */
  colorSchemeId: ColorSchemeId;
  setColorSchemeId: (id: ColorSchemeId) => void;
  /** API color scheme value (DEFAULT, WARM, COOL, etc.) for settings picker */
  colorSchemeApi: string | null;
  /** Set from API preferences; updates both palette and API value */
  setColorSchemeFromApi: (apiValue: string | null) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function useTheme() {
  const context = useContext(ThemeContext);
  return context;
}

type ThemeProviderProps = {
  children: React.ReactNode;
};

const VALID_COLOR_SCHEME_IDS: ColorSchemeId[] = [
  "lumina",
  "ocean",
  "forest",
  "rose",
  "slate",
  "sunset",
  "lavender",
  "mint",
  "berry",
];

function isValidColorSchemeId(id: string): id is ColorSchemeId {
  return (VALID_COLOR_SCHEME_IDS as string[]).includes(id);
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const systemTheme = useSystemColorScheme();
  const [preference, setPreferenceState] = useState<ThemePreference>("light");
  const [colorSchemeId, setColorSchemeIdState] =
    useState<ColorSchemeId>(DEFAULT_COLOR_SCHEME);
  const [colorSchemeApi, setColorSchemeApiState] = useState<string | null>(null);
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

  useEffect(() => {
    SecureStore.getItemAsync(COLOR_SCHEME_STORAGE_KEY).then((stored) => {
      if (stored && isValidColorSchemeId(stored)) {
        setColorSchemeIdState(stored);
      }
    });
  }, []);

  useEffect(() => {
    SecureStore.getItemAsync(COLOR_SCHEME_API_STORAGE_KEY).then((stored) => {
      if (stored && typeof stored === "string") {
        setColorSchemeApiState(stored);
      }
    });
  }, []);

  const setPreference = useCallback((value: ThemePreference) => {
    setPreferenceState(value);
    SecureStore.setItemAsync(THEME_STORAGE_KEY, value);
  }, []);

  const setColorSchemeId = useCallback((id: ColorSchemeId) => {
    setColorSchemeIdState(id);
    SecureStore.setItemAsync(COLOR_SCHEME_STORAGE_KEY, id);
  }, []);

  const setColorSchemeFromApi = useCallback((apiValue: string | null) => {
    const paletteId = apiColorSchemeToPaletteId(apiValue);
    setColorSchemeIdState(paletteId);
    setColorSchemeApiState(apiValue);
    SecureStore.setItemAsync(COLOR_SCHEME_STORAGE_KEY, paletteId);
    if (apiValue != null && apiValue.trim()) {
      SecureStore.setItemAsync(COLOR_SCHEME_API_STORAGE_KEY, apiValue);
    } else {
      SecureStore.deleteItemAsync(COLOR_SCHEME_API_STORAGE_KEY).catch(() => {});
    }
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
    colorSchemeId,
    setColorSchemeId,
    colorSchemeApi,
    setColorSchemeFromApi,
  };

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}
