/**
 * Returns the current palette (light or dark) for the selected color scheme.
 * Use this instead of Colors[useColorScheme()] so the user's chosen palette is applied.
 */

import { ColorPalettes } from "@/constants/theme";
import type { ColorSchemeId } from "@/constants/theme";
import { useTheme } from "@/contexts/theme-context";
import { useColorScheme } from "@/hooks/use-color-scheme";

export function useThemeColors() {
  const theme = useTheme();
  const resolved = useColorScheme();
  const id: ColorSchemeId = theme?.colorSchemeId ?? "lumina";
  const palette = ColorPalettes[id];
  return palette ? palette[resolved] : ColorPalettes.lumina[resolved];
}
