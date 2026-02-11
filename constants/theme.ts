/**
 * Design tokens — light/dark themes (trial palette).
 * Hex equivalents of oklch from :root / .dark for React Native.
 */

import { Platform } from "react-native";

// From :root/.dark primary
const tintColorLight = "#b85c2a";
const tintColorDark = "#d4925a";

/** Light theme — :root (oklch → hex) */
const lightColors = {
  background: "#f3f1e8",
  foreground: "#5c5348",
  card: "#f3f1e8",
  cardForeground: "#5c5348",
  popover: "#ffffff",
  popoverForeground: "#5c5348",
  primary: "#b85c2a",
  primaryForeground: "#ffffff",
  secondary: "#c4b89a",
  secondaryForeground: "#ffffff",
  muted: "#d9c9b4",
  mutedForeground: "#7a6b5a",
  accent: "#d9c9b4",
  accentForeground: "#5c5348",
  destructive: "#2d2a26",
  destructiveForeground: "#ffffff",
  border: "#c4b89a",
  input: "#c4b89a",
  ring: "#b85c2a",
  chart1: "#b85c2a",
  chart2: "#7a6b5a",
  chart3: "#c97d4a",
  chart4: "#c4b89a",
  chart5: "#a67c52",
  sidebar: "#e5dcc8",
  sidebarForeground: "#5c5348",
  sidebarPrimary: "#b85c2a",
  sidebarPrimaryForeground: "#ffffff",
  sidebarAccent: "#c97d4a",
  sidebarAccentForeground: "#ffffff",
  sidebarBorder: "#a67c52",
  sidebarRing: "#b85c2a",
  text: "#5c5348",
  tint: tintColorLight,
  icon: "#7a6b5a",
  tabIconDefault: "#7a6b5a",
  tabIconSelected: tintColorLight,
};

/** Dark theme — .dark (oklch → hex) */
const darkColors = {
  background: "#3d3832",
  foreground: "#f3f1e8",
  card: "#4a4540",
  cardForeground: "#f3f1e8",
  popover: "#4a4540",
  popoverForeground: "#f3f1e8",
  primary: "#d4925a",
  primaryForeground: "#3d3832",
  secondary: "#7a6b5a",
  secondaryForeground: "#f3f1e8",
  muted: "#5c5348",
  mutedForeground: "#c9b59a",
  accent: "#c4b89a",
  accentForeground: "#3d3832",
  destructive: "#e85c3a",
  destructiveForeground: "#3d3832",
  border: "#5c5348",
  input: "#5c5348",
  ring: "#d4925a",
  chart1: "#d4925a",
  chart2: "#c4b89a",
  chart3: "#b85c2a",
  chart4: "#7a6b5a",
  chart5: "#a67c52",
  sidebar: "#2d2a26",
  sidebarForeground: "#f3f1e8",
  sidebarPrimary: "#d4925a",
  sidebarPrimaryForeground: "#2d2a26",
  sidebarAccent: "#c4b89a",
  sidebarAccentForeground: "#2d2a26",
  sidebarBorder: "#5c5348",
  sidebarRing: "#d4925a",
  text: "#f3f1e8",
  tint: tintColorDark,
  icon: "#c9b59a",
  tabIconDefault: "#c9b59a",
  tabIconSelected: tintColorDark,
};

export const Colors = {
  light: lightColors,
  dark: darkColors,
};

/** Border radius tokens (--radius: 0.5rem → 8) */
export const radius = {
  sm: 4, // calc(var(--radius) - 4px)
  md: 6, // calc(var(--radius) - 2px)
  lg: 8, // var(--radius)
  xl: 12, // calc(var(--radius) + 4px)
};

/** Spacing token (--spacing: 0.25rem) */
export const spacing = 4;

/** Shadow tokens — warm tint per trial palette (--shadow-color) */
const shadowColor = "#7a6f66";
const shadowOpacity = 0.11;

export const Shadows = {
  "2xs": Platform.select({
    ios: {
      shadowColor,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 3,
    },
    android: { elevation: 1 },
    default: {},
  }),
  xs: Platform.select({
    ios: {
      shadowColor,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 3,
    },
    android: { elevation: 1 },
    default: {},
  }),
  sm: Platform.select({
    ios: {
      shadowColor,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity,
      shadowRadius: 3,
    },
    android: { elevation: 2 },
    default: {},
  }),
  md: Platform.select({
    ios: {
      shadowColor,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity,
      shadowRadius: 4,
    },
    android: { elevation: 3 },
    default: {},
  }),
  lg: Platform.select({
    ios: {
      shadowColor,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity,
      shadowRadius: 6,
    },
    android: { elevation: 4 },
    default: {},
  }),
  xl: Platform.select({
    ios: {
      shadowColor,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity,
      shadowRadius: 10,
    },
    android: { elevation: 6 },
    default: {},
  }),
  "2xl": Platform.select({
    ios: {
      shadowColor,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.25,
      shadowRadius: 3,
    },
    android: { elevation: 8 },
    default: {},
  }),
} as const;

export const Fonts = Platform.select({
  ios: {
    sans: "system-ui",
    serif: "ui-serif",
    rounded: "ui-rounded",
    mono: "ui-monospace",
  },
  default: {
    sans: "normal",
    serif: "serif",
    rounded: "normal",
    mono: "monospace",
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded:
      "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
