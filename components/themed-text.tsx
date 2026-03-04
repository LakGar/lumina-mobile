import { Fonts, typeScale, lineHeight } from "@/constants/theme";
import { useThemeColor } from "@/hooks/use-theme-color";
import { StyleSheet, Text, type TextProps } from "react-native";

/**
 * Text that uses the active app theme (Lumina: Playfair Display headings, Inter body).
 * Override with lightColor/darkColor per instance if needed.
 */
export type ThemedTextProps = TextProps & {
  lightColor?: string;
  darkColor?: string;
  type?: "default" | "title" | "defaultSemiBold" | "subtitle" | "link";
};

export function ThemedText({
  style,
  lightColor,
  darkColor,
  type = "default",
  ...rest
}: ThemedTextProps) {
  const textColor = useThemeColor({ light: lightColor, dark: darkColor }, "text");
  const linkColor = useThemeColor({}, "tint");
  const color = type === "link" ? linkColor : textColor;

  return (
    <Text
      style={[
        { color },
        type === "default" ? styles.default : undefined,
        type === "title" ? styles.title : undefined,
        type === "defaultSemiBold" ? styles.defaultSemiBold : undefined,
        type === "subtitle" ? styles.subtitle : undefined,
        type === "link" ? styles.link : undefined,
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  default: {
    fontFamily: Fonts?.body ?? undefined,
    fontSize: typeScale.base,
    lineHeight: typeScale.base * lineHeight.relaxed,
  },
  defaultSemiBold: {
    fontFamily: Fonts?.bodyMedium ?? undefined,
    fontSize: typeScale.base,
    lineHeight: typeScale.base * lineHeight.relaxed,
    fontWeight: "600",
  },
  title: {
    fontFamily: Fonts?.heading ?? undefined,
    fontSize: typeScale["3xl"],
    lineHeight: typeScale["3xl"] * lineHeight.tight,
    fontWeight: "500",
  },
  subtitle: {
    fontFamily: Fonts?.heading ?? undefined,
    fontSize: typeScale.xl,
    lineHeight: typeScale.xl * lineHeight.tight,
    fontWeight: "500",
  },
  link: {
    fontFamily: Fonts?.body ?? undefined,
    fontSize: typeScale.base,
    lineHeight: 30,
  },
});
