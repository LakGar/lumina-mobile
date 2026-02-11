import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import Ionicons from "@expo/vector-icons/Ionicons";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const HEADER_TOP_PADDING = 12;

export type ChatHeaderOption =
  | "share"
  | "archive"
  | "rename"
  | "add_journal"
  | "delete";

export type ChatHeaderProps = {
  /** Display title: custom name or "Chat" when unset */
  title: string;
  onOpenChatsList: () => void;
  onOption: (option: ChatHeaderOption) => void;
};

const OPTIONS: {
  key: ChatHeaderOption;
  label: string;
  icon:
    | "share-outline"
    | "archive-outline"
    | "pencil-outline"
    | "book-outline"
    | "trash-outline";
}[] = [
  { key: "share", label: "Share", icon: "share-outline" },
  { key: "archive", label: "Archive", icon: "archive-outline" },
  { key: "rename", label: "Rename", icon: "pencil-outline" },
  { key: "add_journal", label: "Add a journal", icon: "book-outline" },
  { key: "delete", label: "Delete", icon: "trash-outline" },
];

export default function ChatHeader({
  title,
  onOpenChatsList,
  onOption,
}: ChatHeaderProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const insets = useSafeAreaInsets();
  const paddingTop = insets.top + HEADER_TOP_PADDING;
  const [optionsVisible, setOptionsVisible] = useState(false);

  const openOptions = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setOptionsVisible(true);
  };

  const handleOption = (option: ChatHeaderOption) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setOptionsVisible(false);
    onOption(option);
  };

  return (
    <>
      <View
        style={[
          styles.container,
          {
            paddingTop,
          },
        ]}
      >
        <View style={styles.row}>
          <Pressable
            onPress={onOpenChatsList}
            style={({ pressed }) => [styles.iconBtn, pressed && styles.pressed]}
            hitSlop={8}
            accessibilityLabel="Previous chats"
          >
            <Ionicons name="list" size={24} color={colors.foreground} />
          </Pressable>
          <View style={styles.center}>
            <Text
              style={[styles.title, { color: colors.foreground }]}
              numberOfLines={1}
            >
              {title || "Chat"}
            </Text>
          </View>
          <Pressable
            onPress={openOptions}
            style={({ pressed }) => [styles.iconBtn, pressed && styles.pressed]}
            hitSlop={8}
            accessibilityLabel="Chat options"
          >
            <Ionicons
              name="ellipsis-horizontal"
              size={22}
              color={colors.foreground}
            />
          </Pressable>
        </View>
      </View>

      <Modal
        visible={optionsVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setOptionsVisible(false)}
      >
        <Pressable
          style={styles.overlay}
          onPress={() => setOptionsVisible(false)}
        >
          <View
            style={[
              styles.menu,
              { backgroundColor: colors.popover ?? colors.card },
            ]}
            onStartShouldSetResponder={() => true}
          >
            {OPTIONS.map(({ key, label, icon }) => (
              <Pressable
                key={key}
                onPress={() => handleOption(key)}
                style={({ pressed }) => [
                  styles.menuRow,
                  { borderBottomColor: colors.border },
                  pressed && styles.pressed,
                ]}
              >
                <Ionicons name={icon} size={20} color={colors.foreground} />
                <Text style={[styles.menuLabel, { color: colors.foreground }]}>
                  {label}
                </Text>
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: 12,
    paddingHorizontal: 16,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  iconBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  pressed: {
    opacity: 0.6,
  },
  center: {
    flex: 1,
    minWidth: 0,
    paddingHorizontal: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  menu: {
    minWidth: 220,
    borderRadius: 12,
    overflow: "hidden",
  },
  menuRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  menuLabel: {
    fontSize: 16,
  },
});
