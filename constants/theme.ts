/**
 * Lumina theme — aligned with Lumina landing (premium nostalgic / golden-hour).
 * Typography: Playfair Display (headings), Inter (body).
 */

import { Platform } from "react-native";

// ---------------------------------------------------------------------------
// 1. Colors — Light (Lumina landing)
// ---------------------------------------------------------------------------

const lightColors = {
  background: "#FDFCF9",
  foreground: "#1E1E1E",
  card: "#FFFFFF",
  cardForeground: "#1E1E1E",
  popover: "#FFFFFF",
  popoverForeground: "#1E1E1E",
  primary: "#F97316",
  primaryForeground: "#FDFCF9",
  secondary: "#1E1E1E",
  secondaryForeground: "#FDFCF9",
  muted: "#F5F3EF",
  mutedForeground: "#6B6B6B",
  accent: "#FDBA74",
  accentForeground: "#1E1E1E",
  destructive: "#dc2626",
  destructiveForeground: "#FFFFFF",
  border: "#e5ddd4",
  input: "#e5ddd4",
  ring: "#F97316",
  chart1: "#F97316",
  chart2: "#FDBA74",
  chart3: "#6B6B6B",
  chart4: "#7a9e7e",
  chart5: "#2c2419",
  sidebar: "#F5F3EF",
  sidebarForeground: "#1E1E1E",
  sidebarPrimary: "#F97316",
  sidebarPrimaryForeground: "#FDFCF9",
  sidebarAccent: "#FDBA74",
  sidebarAccentForeground: "#1E1E1E",
  sidebarBorder: "#e5ddd4",
  sidebarRing: "#F97316",
  text: "#1E1E1E",
  textSecondary: "#6B6B6B",
  tint: "#F97316",
  icon: "#6B6B6B",
  tabIconDefault: "#6B6B6B",
  tabIconSelected: "#F97316",
  surfaceAlt: "#F5F3EF",
  surfaceWarm: "#f7f4ef",
  // Legacy / optional (web parity)
  darkBrown: "#2c2419",
  mutedBrown: "#6b5d4f",
  greenAccent: "#7a9e7e",
};

// ---------------------------------------------------------------------------
// 2. Colors — Dark (same hue, dark backgrounds)
// ---------------------------------------------------------------------------

const darkColors = {
  background: "#1E1E1E",
  foreground: "#FDFCF9",
  card: "#2d2a26",
  cardForeground: "#FDFCF9",
  popover: "#2d2a26",
  popoverForeground: "#FDFCF9",
  primary: "#F97316",
  primaryForeground: "#FDFCF9",
  secondary: "#F5F3EF",
  secondaryForeground: "#1E1E1E",
  muted: "#3d3832",
  mutedForeground: "#a8a29e",
  accent: "#FDBA74",
  accentForeground: "#1E1E1E",
  destructive: "#dc2626",
  destructiveForeground: "#FFFFFF",
  border: "#44403c",
  input: "#44403c",
  ring: "#F97316",
  chart1: "#F97316",
  chart2: "#FDBA74",
  chart3: "#a8a29e",
  chart4: "#7a9e7e",
  chart5: "#e5ddd4",
  sidebar: "#1E1E1E",
  sidebarForeground: "#FDFCF9",
  sidebarPrimary: "#F97316",
  sidebarPrimaryForeground: "#FDFCF9",
  sidebarAccent: "#FDBA74",
  sidebarAccentForeground: "#1E1E1E",
  sidebarBorder: "#44403c",
  sidebarRing: "#F97316",
  text: "#FDFCF9",
  textSecondary: "#a8a29e",
  tint: "#F97316",
  icon: "#a8a29e",
  tabIconDefault: "#a8a29e",
  tabIconSelected: "#F97316",
  surfaceAlt: "#2d2a26",
  surfaceWarm: "#2d2a26",
  darkBrown: "#e5ddd4",
  mutedBrown: "#a8a29e",
  greenAccent: "#7a9e7e",
};

export const Colors = {
  light: lightColors,
  dark: darkColors,
};

// ---------------------------------------------------------------------------
// 3. Border radius (spec: sm 4 → full pill)
// ---------------------------------------------------------------------------

export const radius = {
  sm: 4,
  md: 6,
  lg: 8,
  xl: 12,
  "2xl": 16,
  full: 9999,
};

// ---------------------------------------------------------------------------
// 4. Spacing (8px base)
// ---------------------------------------------------------------------------

export const spacing = {
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  8: 32,
  10: 40,
  12: 48,
  16: 64,
} as const;

/** Legacy single unit (4px) for compatibility */
export const spacingUnit = 4;

// ---------------------------------------------------------------------------
// 5. Type scale (px) — xs 12 → 6xl 60
// ---------------------------------------------------------------------------

export const typeScale = {
  xs: 12,
  sm: 14,
  base: 16,
  lg: 18,
  xl: 20,
  "2xl": 24,
  "3xl": 30,
  "4xl": 36,
  "5xl": 48,
  "6xl": 60,
} as const;

/** Letter-spacing: headlines 0.02em, body 0, uppercase 0.05–0.1em */
export const letterSpacing = {
  headline: 0.02,
  body: 0,
  uppercase: 0.08,
} as const;

/** Line height: headings tight ~1.2–1.25, body relaxed ~1.5–1.6 */
export const lineHeight = {
  tight: 1.25,
  relaxed: 1.55,
} as const;

// ---------------------------------------------------------------------------
// 6. Shadows — light, warm-tinted
// ---------------------------------------------------------------------------

const shadowColor = "#1E1E1E";

export const Shadows = {
  card: Platform.select({
    ios: {
      shadowColor,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
    },
    android: { elevation: 2 },
    default: {},
  }),
  button: Platform.select({
    ios: {
      shadowColor,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.04,
      shadowRadius: 2,
    },
    android: { elevation: 1 },
    default: {},
  }),
  modal: Platform.select({
    ios: {
      shadowColor,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 6,
    },
    android: { elevation: 6 },
    default: {},
  }),
  // Legacy aliases
  "2xs": Platform.select({
    ios: {
      shadowColor,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.04,
      shadowRadius: 2,
    },
    android: { elevation: 1 },
    default: {},
  }),
  xs: Platform.select({
    ios: {
      shadowColor,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.04,
      shadowRadius: 2,
    },
    android: { elevation: 1 },
    default: {},
  }),
  sm: Platform.select({
    ios: {
      shadowColor,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 3,
    },
    android: { elevation: 2 },
    default: {},
  }),
  md: Platform.select({
    ios: {
      shadowColor,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 4,
    },
    android: { elevation: 3 },
    default: {},
  }),
  lg: Platform.select({
    ios: {
      shadowColor,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.06,
      shadowRadius: 6,
    },
    android: { elevation: 4 },
    default: {},
  }),
  xl: Platform.select({
    ios: {
      shadowColor,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 6,
    },
    android: { elevation: 6 },
    default: {},
  }),
  "2xl": Platform.select({
    ios: {
      shadowColor,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 8,
    },
    android: { elevation: 8 },
    default: {},
  }),
} as const;

// ---------------------------------------------------------------------------
// 7. Fonts — Playfair Display (headings), Inter (body)
// Loaded via useFonts in app _layout; use these keys in TextStyle fontFamily.
// ---------------------------------------------------------------------------

export const FontFamily = {
  heading: "PlayfairDisplay_500Medium",
  headingSemiBold: "PlayfairDisplay_600SemiBold",
  body: "Inter_400Regular",
  bodyMedium: "Inter_500Medium",
} as const;

export const Fonts = Platform.select({
  ios: {
    heading: FontFamily.heading,
    headingMedium: FontFamily.heading,
    headingSemiBold: FontFamily.headingSemiBold,
    body: FontFamily.body,
    bodyMedium: FontFamily.bodyMedium,
    mono: "Menlo",
  },
  android: {
    heading: FontFamily.heading,
    headingMedium: FontFamily.heading,
    headingSemiBold: FontFamily.headingSemiBold,
    body: FontFamily.body,
    bodyMedium: FontFamily.bodyMedium,
    mono: "monospace",
  },
  default: {
    heading: FontFamily.heading,
    headingMedium: FontFamily.heading,
    headingSemiBold: FontFamily.headingSemiBold,
    body: FontFamily.body,
    bodyMedium: FontFamily.bodyMedium,
    mono: "monospace",
  },
  web: {
    heading: "Playfair Display, Georgia, serif",
    headingMedium: "Playfair Display, Georgia, serif",
    headingSemiBold: "Playfair Display, Georgia, serif",
    body: "Inter, system-ui, -apple-system, sans-serif",
    bodyMedium: "Inter, system-ui, -apple-system, sans-serif",
    mono: "ui-monospace, monospace",
  },
});

// ---------------------------------------------------------------------------
// 8. Text on images — shadow for readability
// ---------------------------------------------------------------------------

export const textShadowOnImage = {
  light: {
    textShadowColor: "rgba(0,0,0,0.3)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  strong: {
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
} as const;
