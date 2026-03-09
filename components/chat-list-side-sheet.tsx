import { useColorScheme } from "@/hooks/use-color-scheme";
import { useThemeColors } from "@/hooks/use-theme-colors";
import Ionicons from "@expo/vector-icons/Ionicons";
import * as Haptics from "expo-haptics";
import React from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, { FadeInRight } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export type ChatListItem = {
  id: string;
  name: string;
  /** Preview or last message time for subtitle */
  subtitle?: string;
};

type ChatListSideSheetProps = {
  visible: boolean;
  onClose: () => void;
  chats: ChatListItem[];
  currentChatId: string | null;
  onSelectChat: (id: string) => void;
  onNewChat: () => void;
};

export function ChatListSideSheet({
  visible,
  onClose,
  chats,
  currentChatId,
  onSelectChat,
  onNewChat,
}: ChatListSideSheetProps) {
  const colorScheme = useColorScheme();
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();

  const handleSelect = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSelectChat(id);
    onClose();
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Animated.View
          entering={FadeInRight.duration(220)}
          style={[
            styles.sheet,
            {
              backgroundColor: colors.background,
              paddingTop: insets.top + 16,
              paddingBottom: insets.bottom + 16,
            },
          ]}
          onStartShouldSetResponder={() => true}
        >
          <View style={styles.headerRow}>
            <Text style={[styles.sheetTitle, { color: colors.foreground }]}>
              Chats
            </Text>
            <Pressable
              onPress={onClose}
              style={({ pressed }) => [styles.closeBtn, pressed && styles.pressed]}
              hitSlop={8}
            >
              <Ionicons name="close" size={24} color={colors.foreground} />
            </Pressable>
          </View>

          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onNewChat();
              onClose();
            }}
            style={({ pressed }) => [
              styles.newChatRow,
              { backgroundColor: colors.muted, borderColor: colors.border },
              pressed && styles.pressed,
            ]}
          >
            <Ionicons name="add" size={22} color={colors.primary} />
            <Text style={[styles.newChatLabel, { color: colors.foreground }]}>
              New chat
            </Text>
          </Pressable>

          <View style={styles.list}>
            {chats.length === 0 ? (
              <Text style={[styles.empty, { color: colors.mutedForeground }]}>
                No previous chats
              </Text>
            ) : (
              chats.map((chat) => (
                <Pressable
                  key={chat.id}
                  onPress={() => handleSelect(chat.id)}
                  style={({ pressed }) => [
                    styles.chatRow,
                    {
                      backgroundColor: currentChatId === chat.id ? colors.muted : "transparent",
                      borderBottomColor: colors.border,
                    },
                    pressed && styles.pressed,
                  ]}
                >
                  <View style={[styles.chatIconWrap, { backgroundColor: colors.muted }]}>
                    <Ionicons name="chatbubble-outline" size={20} color={colors.foreground} />
                  </View>
                  <View style={styles.chatText}>
                    <Text
                      style={[styles.chatName, { color: colors.foreground }]}
                      numberOfLines={1}
                    >
                      {chat.name || "Chat"}
                    </Text>
                    {chat.subtitle ? (
                      <Text
                        style={[styles.chatSubtitle, { color: colors.mutedForeground }]}
                        numberOfLines={1}
                      >
                        {chat.subtitle}
                      </Text>
                    ) : null}
                  </View>
                  {currentChatId === chat.id && (
                    <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                  )}
                </Pressable>
              ))
            )}
          </View>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  sheet: {
    width: "82%",
    maxWidth: 320,
    paddingHorizontal: 16,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  sheetTitle: {
    fontSize: 20,
    fontWeight: "700",
  },
  closeBtn: {
    padding: 4,
  },
  pressed: {
    opacity: 0.7,
  },
  newChatRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  newChatLabel: {
    fontSize: 16,
    fontWeight: "600",
  },
  list: {
    flex: 1,
  },
  chatRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  chatIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  chatText: { flex: 1, minWidth: 0 },
  chatName: { fontSize: 16, fontWeight: "500" },
  chatSubtitle: { fontSize: 13, marginTop: 2 },
  empty: {
    paddingVertical: 24,
    textAlign: "center",
  },
});
