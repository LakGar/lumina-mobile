import React from "react";
import { StyleSheet, Text } from "react-native";

type Segment = { type: "normal" | "bold" | "italic"; text: string };

function parseRichText(body: string): Segment[] {
  if (!body) return [];
  const segments: Segment[] = [];
  const byBold = body.split("**");
  for (let i = 0; i < byBold.length; i++) {
    if (i % 2 === 1) {
      segments.push({ type: "bold", text: byBold[i] });
    } else {
      const byItalic = byBold[i].split("*");
      for (let j = 0; j < byItalic.length; j++) {
        if (j % 2 === 1) {
          segments.push({ type: "italic", text: byItalic[j] });
        } else if (byItalic[j]) {
          segments.push({ type: "normal", text: byItalic[j] });
        }
      }
    }
  }
  return segments;
}

type RichTextBodyProps = {
  body: string;
  style?: { color?: string; fontSize?: number; lineHeight?: number };
};

export function RichTextBody({ body, style }: RichTextBodyProps) {
  const segments = parseRichText(body);
  const color = style?.color ?? "#000";
  const fontSize = style?.fontSize ?? 16;
  const lineHeight = style?.lineHeight ?? 24;

  return (
    <Text style={[styles.container, { color, fontSize, lineHeight }]}>
      {segments.map((seg, index) => {
        if (seg.type === "bold") {
          return (
            <Text key={index} style={[styles.bold, { color }]}>
              {seg.text}
            </Text>
          );
        }
        if (seg.type === "italic") {
          return (
            <Text key={index} style={[styles.italic, { color }]}>
              {seg.text}
            </Text>
          );
        }
        return <Text key={index}>{seg.text}</Text>;
      })}
    </Text>
  );
}

const styles = StyleSheet.create({
  container: {
    fontSize: 16,
    lineHeight: 24,
  },
  bold: { fontWeight: "700" },
  italic: { fontStyle: "italic" },
});
