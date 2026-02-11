import { Colors, radius } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import Ionicons from "@expo/vector-icons/Ionicons";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export type FeedbackKind = "like" | "dislike";

type ChatFeedbackNoteModalProps = {
  visible: boolean;
  kind: FeedbackKind;
  onClose: () => void;
  onSubmit: (note: string) => void;
};

export function ChatFeedbackNoteModal({
  visible,
  kind,
  onClose,
  onSubmit,
}: ChatFeedbackNoteModalProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const insets = useSafeAreaInsets();
  const [note, setNote] = useState("");

  const handleSubmit = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSubmit(note.trim());
    setNote("");
    onClose();
  };

  const handleSkip = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSubmit("");
    setNote("");
    onClose();
  };

  if (!visible) return null;

  const isLike = kind === "like";

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable
          style={[styles.card, { backgroundColor: colors.popover ?? colors.card }]}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={styles.iconRow}>
            <View
              style={[
                styles.iconWrap,
                { backgroundColor: isLike ? colors.primary + "20" : colors.destructive + "20" },
              ]}
            >
              <Ionicons
                name={isLike ? "thumbs-up" : "thumbs-down"}
                size={24}
                color={isLike ? colors.primary : colors.destructive}
              />
            </View>
          </View>
          <Text style={[styles.title, { color: colors.foreground }]}>
            {isLike ? "Thanks for the feedback!" : "Sorry it wasn't helpful"}
          </Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            Would you like to add a note to help us improve?
          </Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.background,
                color: colors.foreground,
                borderColor: colors.border,
              },
            ]}
            placeholder="Optional note…"
            placeholderTextColor={colors.mutedForeground}
            value={note}
            onChangeText={setNote}
            multiline
            maxLength={500}
          />
          <View style={styles.actions}>
            <Pressable
              onPress={handleSkip}
              style={({ pressed }) => [
                styles.btn,
                styles.btnSecondary,
                { borderColor: colors.border },
                pressed && styles.pressed,
              ]}
            >
              <Text style={[styles.btnTextSecondary, { color: colors.foreground }]}>
                Skip
              </Text>
            </Pressable>
            <Pressable
              onPress={handleSubmit}
              style={({ pressed }) => [
                styles.btn,
                { backgroundColor: colors.primary },
                pressed && styles.pressed,
              ]}
            >
              <Text style={[styles.btnText, { color: colors.primaryForeground }]}>
                Submit
              </Text>
            </Pressable>
          </View>
          <View style={{ height: insets.bottom + 8 }} />
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.4)",
    padding: 24,
  },
  card: {
    width: "100%",
    maxWidth: 340,
    borderRadius: radius.xl,
    padding: 20,
  },
  iconRow: {
    alignItems: "center",
    marginBottom: 12,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    minHeight: 88,
    textAlignVertical: "top",
    marginBottom: 16,
  },
  actions: {
    flexDirection: "row",
    gap: 12,
  },
  btn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  btnSecondary: {
    backgroundColor: "transparent",
    borderWidth: 1,
  },
  btnText: {
    fontSize: 16,
    fontWeight: "600",
  },
  btnTextSecondary: {
    fontSize: 16,
    fontWeight: "600",
  },
  pressed: {
    opacity: 0.85,
  },
});
