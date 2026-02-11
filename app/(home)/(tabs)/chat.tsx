import {
  ChatAddContextSheet,
  type ContextAttachment,
} from "@/components/chat-add-context-sheet";
import {
  ChatFeedbackNoteModal,
  type FeedbackKind,
} from "@/components/chat-feedback-note-modal";
import ChatHeader, { type ChatHeaderOption } from "@/components/chat-header";
import {
  ChatListSideSheet,
  type ChatListItem,
} from "@/components/chat-list-side-sheet";
import { getEntryListTitle } from "@/constants/mock-journals";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import Ionicons from "@expo/vector-icons/Ionicons";
import * as Haptics from "expo-haptics";
import React, { useCallback, useRef, useState } from "react";
import {
  Alert,
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  LayoutAnimation,
  Platform,
  Pressable,
  Modal as RNModal,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import Animated, {
  FadeIn,
  FadeInDown,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type MessageRole = "user" | "assistant";

type Message = {
  id: string;
  role: MessageRole;
  content: string;
  isStreaming?: boolean;
};

type ChatState = {
  id: string;
  name: string;
  messages: Message[];
};

const MOCK_REPLIES = [
  "That's a great question. Here's what I think…",
  "I'd be happy to help with that.",
  "Interesting! Let me share a few ideas.",
  "Thanks for sharing. Here's a thoughtful response.",
];

const EXAMPLE_PROMPTS = [
  "Reflect on my day",
  "Suggest a journaling prompt",
  "Help me set an intention",
  "Summarize my week",
];

function TypingDots() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const d1 = useSharedValue(0);
  const d2 = useSharedValue(0);
  const d3 = useSharedValue(0);

  React.useEffect(() => {
    d1.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 280 }),
        withTiming(0, { duration: 280 }),
      ),
      -1,
      false,
    );
    d2.value = withRepeat(
      withSequence(
        withTiming(0, { duration: 0 }),
        withTiming(1, { duration: 280 }),
        withTiming(0, { duration: 280 }),
      ),
      -1,
      false,
    );
    d3.value = withRepeat(
      withSequence(
        withTiming(0, { duration: 0 }),
        withTiming(0, { duration: 200 }),
        withTiming(1, { duration: 280 }),
        withTiming(0, { duration: 280 }),
      ),
      -1,
      false,
    );
  }, [d1, d2, d3]);

  const dot1Style = useAnimatedStyle(() => ({
    opacity: 0.4 + d1.value * 0.6,
    transform: [{ scale: 0.85 + d1.value * 0.15 }],
  }));
  const dot2Style = useAnimatedStyle(() => ({
    opacity: 0.4 + d2.value * 0.6,
    transform: [{ scale: 0.85 + d2.value * 0.15 }],
  }));
  const dot3Style = useAnimatedStyle(() => ({
    opacity: 0.4 + d3.value * 0.6,
    transform: [{ scale: 0.85 + d3.value * 0.15 }],
  }));

  return (
    <View style={styles.typingRow}>
      <View style={[styles.typingBubble, { backgroundColor: colors.muted }]}>
        <Animated.View
          style={[
            styles.typingDot,
            { backgroundColor: colors.foreground },
            dot1Style,
          ]}
        />
        <Animated.View
          style={[
            styles.typingDot,
            { backgroundColor: colors.foreground },
            dot2Style,
          ]}
        />
        <Animated.View
          style={[
            styles.typingDot,
            { backgroundColor: colors.foreground },
            dot3Style,
          ]}
        />
      </View>
    </View>
  );
}

function MessageBubble({
  message,
  colors,
  onRegenerate,
  onLike,
  onDislike,
}: {
  message: Message;
  colors: (typeof Colors)["light"];
  onRegenerate?: (messageId: string) => void;
  onLike?: (messageId: string) => void;
  onDislike?: (messageId: string) => void;
}) {
  const isUser = message.role === "user";
  return (
    <Animated.View
      entering={FadeInDown.duration(240).springify().damping(20)}
      style={[
        styles.bubbleWrap,
        isUser ? styles.bubbleWrapUser : styles.bubbleWrapAssistant,
      ]}
    >
      <View
        style={[
          styles.bubble,
          isUser
            ? {
                backgroundColor: colors.primary,
                borderBottomRightRadius: 4,
              }
            : {
                backgroundColor: colors.muted,
                borderBottomLeftRadius: 4,
              },
        ]}
      >
        <Text
          style={[
            styles.bubbleText,
            { color: isUser ? colors.primaryForeground : colors.foreground },
          ]}
        >
          {message.content}
        </Text>
      </View>
      {!isUser && (onRegenerate || onLike || onDislike) && (
        <View style={styles.bubbleActions}>
          {onRegenerate && (
            <Pressable
              onPress={() => onRegenerate(message.id)}
              style={({ pressed }) => [
                styles.bubbleActionBtn,
                pressed && styles.pressed,
              ]}
              hitSlop={6}
            >
              <Ionicons
                name="refresh-outline"
                size={16}
                color={colors.mutedForeground}
              />
              <Text
                style={[
                  styles.bubbleActionLabel,
                  { color: colors.mutedForeground },
                ]}
              >
                Regenerate
              </Text>
            </Pressable>
          )}
          {onLike && (
            <Pressable
              onPress={() => onLike(message.id)}
              style={({ pressed }) => [
                styles.bubbleActionBtn,
                pressed && styles.pressed,
              ]}
              hitSlop={6}
            >
              <Ionicons
                name="thumbs-up-outline"
                size={16}
                color={colors.mutedForeground}
              />
            </Pressable>
          )}
          {onDislike && (
            <Pressable
              onPress={() => onDislike(message.id)}
              style={({ pressed }) => [
                styles.bubbleActionBtn,
                pressed && styles.pressed,
              ]}
              hitSlop={6}
            >
              <Ionicons
                name="thumbs-down-outline"
                size={16}
                color={colors.mutedForeground}
              />
            </Pressable>
          )}
        </View>
      )}
    </Animated.View>
  );
}

function createNewChat(): ChatState {
  return {
    id: `chat-${Date.now()}`,
    name: "",
    messages: [],
  };
}

export default function ChatScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const insets = useSafeAreaInsets();
  const listRef = useRef<FlatList>(null);

  const [chats, setChats] = useState<ChatState[]>(() => [createNewChat()]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(
    () => chats[0]?.id ?? null,
  );
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [addContextVisible, setAddContextVisible] = useState(false);
  const [chatsSheetVisible, setChatsSheetVisible] = useState(false);
  const [feedbackVisible, setFeedbackVisible] = useState(false);
  const [feedbackKind, setFeedbackKind] = useState<FeedbackKind>("like");
  const [feedbackMessageId, setFeedbackMessageId] = useState<string | null>(
    null,
  );
  const [contextAttachments, setContextAttachments] = useState<
    ContextAttachment[]
  >([]);
  const [renameModalVisible, setRenameModalVisible] = useState(false);
  const [renameValue, setRenameValue] = useState("");
  const [showPromptsAfterFirstMessage, setShowPromptsAfterFirstMessage] =
    useState(true);

  const inputRowPaddingBottom = useSharedValue(insets.bottom + 12);
  const promptsOpacity = useSharedValue(1);

  React.useEffect(() => {
    const showEvent =
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent =
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";
    const showSub = Keyboard.addListener(showEvent, () => {
      inputRowPaddingBottom.value = withTiming(10, { duration: 280 });
    });
    const hideSub = Keyboard.addListener(hideEvent, () => {
      inputRowPaddingBottom.value = withTiming(insets.bottom + 12, {
        duration: 250,
      });
    });
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, [insets.bottom, inputRowPaddingBottom]);

  const currentChat = chats.find((c) => c.id === currentChatId);
  const messages = currentChat?.messages ?? [];
  const chatTitle = (currentChat?.name?.trim() || "Chat") as string;

  const hidePromptsAndLayout = useCallback(() => {
    if (Platform.OS === "android") {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    }
    setShowPromptsAfterFirstMessage(false);
  }, []);

  React.useEffect(() => {
    if (messages.length > 0 && showPromptsAfterFirstMessage) {
      promptsOpacity.value = withTiming(0, { duration: 260 }, (finished) => {
        if (finished) runOnJS(hidePromptsAndLayout)();
      });
    } else if (messages.length === 0) {
      setShowPromptsAfterFirstMessage(true);
      promptsOpacity.value = withTiming(1, { duration: 0 });
    }
  }, [
    messages.length,
    showPromptsAfterFirstMessage,
    promptsOpacity,
    hidePromptsAndLayout,
  ]);

  const chatListItems: ChatListItem[] = chats.map((c) => ({
    id: c.id,
    name: c.name?.trim() || "Chat",
    subtitle:
      c.messages.length > 0
        ? c.messages[c.messages.length - 1]?.content?.slice(0, 40) + "…"
        : undefined,
  }));

  const setCurrentChatMessages = useCallback(
    (updater: (prev: Message[]) => Message[]) => {
      setChats((prev) =>
        prev.map((c) =>
          c.id === currentChatId ? { ...c, messages: updater(c.messages) } : c,
        ),
      );
    },
    [currentChatId],
  );

  const setCurrentChatName = useCallback(
    (name: string) => {
      setChats((prev) =>
        prev.map((c) => (c.id === currentChatId ? { ...c, name } : c)),
      );
    },
    [currentChatId],
  );

  const sendMessage = useCallback(
    (textOverride?: string) => {
      const text = (textOverride ?? input).trim();
      if (!text || isLoading) return;
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch (_) {}
      if (!textOverride) setInput("");
      const userMsg: Message = {
        id: `u-${Date.now()}`,
        role: "user",
        content: text,
      };
      setCurrentChatMessages((prev) => [...prev, userMsg]);
      setIsLoading(true);

      const replyId = `a-${Date.now()}`;
      const replyText =
        MOCK_REPLIES[Math.floor(Math.random() * MOCK_REPLIES.length)] +
        " " +
        text.slice(0, 20) +
        (text.length > 20 ? "…" : "");
      setTimeout(
        () => {
          if (Platform.OS === "android")
            LayoutAnimation.configureNext(
              LayoutAnimation.Presets.easeInEaseOut,
            );
          setIsLoading(false);
          setCurrentChatMessages((prev) => [
            ...prev,
            { id: replyId, role: "assistant", content: replyText },
          ]);
          setTimeout(
            () => listRef.current?.scrollToEnd({ animated: true }),
            80,
          );
        },
        1000 + Math.random() * 600,
      );
    },
    [input, isLoading, setCurrentChatMessages],
  );

  const regenerateResponse = useCallback(
    (messageId: string) => {
      const idx = messages.findIndex(
        (m) => m.id === messageId && m.role === "assistant",
      );
      if (idx < 0) return;
      const userMsg = messages[idx - 1];
      if (!userMsg || userMsg.role !== "user") return;
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setCurrentChatMessages((prev) => prev.filter((m) => m.id !== messageId));
      setIsLoading(true);
      const replyId = `a-${Date.now()}`;
      const replyText =
        MOCK_REPLIES[Math.floor(Math.random() * MOCK_REPLIES.length)] +
        " (regenerated) " +
        userMsg.content.slice(0, 15) +
        (userMsg.content.length > 15 ? "…" : "");
      setTimeout(() => {
        setIsLoading(false);
        setCurrentChatMessages((prev) => [
          ...prev,
          { id: replyId, role: "assistant", content: replyText },
        ]);
        setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 80);
      }, 1000);
    },
    [messages, setCurrentChatMessages],
  );

  const handleLike = useCallback((messageId: string) => {
    setFeedbackMessageId(messageId);
    setFeedbackKind("like");
    setFeedbackVisible(true);
  }, []);

  const handleDislike = useCallback((messageId: string) => {
    setFeedbackMessageId(messageId);
    setFeedbackKind("dislike");
    setFeedbackVisible(true);
  }, []);

  const handleFeedbackSubmit = useCallback((note: string) => {
    // In a real app: send feedback + note to backend
    setFeedbackMessageId(null);
  }, []);

  const handleHeaderOption = useCallback(
    (option: ChatHeaderOption) => {
      switch (option) {
        case "share":
          if (currentChat && messages.length > 0) {
            const text = messages
              .map((m) => (m.role === "user" ? "Me: " : "AI: ") + m.content)
              .join("\n\n");
            Share.share({ message: text, title: chatTitle });
          }
          break;
        case "archive":
          // Placeholder
          break;
        case "rename":
          setRenameValue(currentChat?.name ?? "");
          setRenameModalVisible(true);
          break;
        case "add_journal":
          setAddContextVisible(true);
          break;
        case "delete":
          if (chats.length <= 1) {
            setCurrentChatMessages(() => []);
            setCurrentChatName("");
          } else if (currentChatId) {
            const idToDelete = currentChatId;
            Alert.alert("Delete chat", "This conversation will be removed.", [
              { text: "Cancel", style: "cancel" },
              {
                text: "Delete",
                style: "destructive",
                onPress: () => {
                  setChats((prev) => {
                    const next = prev.find((c) => c.id !== idToDelete);
                    setCurrentChatId(next?.id ?? null);
                    return prev.filter((c) => c.id !== idToDelete);
                  });
                },
              },
            ]);
          }
          break;
      }
    },
    [
      currentChat,
      currentChatId,
      messages,
      chatTitle,
      chats.length,
      setCurrentChatMessages,
      setCurrentChatName,
    ],
  );

  const handleNewChat = useCallback(() => {
    const newChat = createNewChat();
    setChats((prev) => [...prev, newChat]);
    setCurrentChatId(newChat.id);
    setInput("");
  }, []);

  const handleSelectChat = useCallback((id: string) => {
    setCurrentChatId(id);
  }, []);

  const handleAddContext = useCallback((attachment: ContextAttachment) => {
    if (Platform.OS === "android") {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    }
    setContextAttachments((prev) => [...prev, attachment]);
  }, []);

  const removeAttachment = useCallback((index: number) => {
    if (Platform.OS === "android") {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    }
    setContextAttachments((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const canSend = input.trim().length > 0 && !isLoading;

  const inputRowAnimatedStyle = useAnimatedStyle(() => ({
    paddingBottom: inputRowPaddingBottom.value,
  }));

  const promptsAnimatedStyle = useAnimatedStyle(() => ({
    opacity: promptsOpacity.value,
  }));

  const listContent = [
    ...messages,
    ...(isLoading
      ? [{ id: "__typing__", role: "assistant" as const, content: "" }]
      : []),
  ];

  const renderItem = useCallback(
    ({
      item,
    }: {
      item:
        | (Message & { id: string })
        | { id: string; role: "assistant"; content: string };
    }) =>
      item.id === "__typing__" ? (
        <TypingDots />
      ) : (
        <MessageBubble
          message={item as Message}
          colors={colors}
          onRegenerate={regenerateResponse}
          onLike={handleLike}
          onDislike={handleDislike}
        />
      ),
    [colors, regenerateResponse, handleLike, handleDislike],
  );

  const showPrompts = messages.length === 0 || showPromptsAfterFirstMessage;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.headerWrap, { backgroundColor: colors.background }]}>
        <ChatHeader
          title={chatTitle}
          onOpenChatsList={() => setChatsSheetVisible(true)}
          onOption={handleHeaderOption}
        />
      </View>

      <KeyboardAvoidingView
        style={styles.keyboard}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? -12 : 0}
      >
        <FlatList
          ref={listRef}
          data={listContent}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: 16, paddingTop: 16 },
          ]}
          ListEmptyComponent={
            <Animated.View
              entering={FadeIn.duration(350)}
              style={styles.emptyWrap}
            >
              <View
                style={[
                  styles.emptyIconWrap,
                  { backgroundColor: colors.muted },
                ]}
              >
                <Ionicons
                  name="chatbubbles-outline"
                  size={40}
                  color={colors.mutedForeground}
                />
              </View>
              <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
                Start a conversation
              </Text>
              <Text
                style={[
                  styles.emptySubtitle,
                  { color: colors.mutedForeground },
                ]}
              >
                Send a message or tap a prompt below.
              </Text>
            </Animated.View>
          }
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          onContentSizeChange={() =>
            listRef.current?.scrollToEnd({ animated: true })
          }
        />

        {/* Context — width-first pills, no icons */}
        {contextAttachments.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.contextChipsWrap}
            style={[styles.contextChipsScroll]}
          >
            {contextAttachments.map((att, i) => (
              <Animated.View
                key={i}
                entering={FadeIn.duration(220)}
                style={[styles.contextChip, { backgroundColor: colors.muted }]}
              >
                <Text
                  style={[styles.contextChipText, { color: colors.foreground }]}
                  numberOfLines={1}
                >
                  {att.type === "journal"
                    ? att.journal.title
                    : getEntryListTitle(att.entry)}
                </Text>
                <Pressable
                  onPress={() => removeAttachment(i)}
                  hitSlop={6}
                  style={({ pressed }) => pressed && styles.pressed}
                >
                  <Text
                    style={[
                      styles.contextChipRemove,
                      { color: colors.mutedForeground },
                    ]}
                  >
                    ×
                  </Text>
                </Pressable>
              </Animated.View>
            ))}
          </ScrollView>
        )}

        {/* Example prompts — width-first, text only, fade out after first message */}
        {showPrompts && (
          <Animated.View style={[styles.promptsOuter, promptsAnimatedStyle]}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.promptsWrap}
              style={styles.promptsScroll}
            >
              {EXAMPLE_PROMPTS.map((prompt) => (
                <Pressable
                  key={prompt}
                  onPress={() => sendMessage(prompt)}
                  style={({ pressed }) => [
                    styles.promptChip,
                    { backgroundColor: colors.muted },
                    pressed && styles.promptChipPressed,
                  ]}
                >
                  <Text
                    style={[
                      styles.promptChipText,
                      { color: colors.foreground },
                    ]}
                    numberOfLines={1}
                  >
                    {prompt}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </Animated.View>
        )}

        {/* Input row */}
        <Animated.View
          style={[
            styles.inputRow,
            {
              paddingTop: 12,
              paddingHorizontal: 16,
            },
            inputRowAnimatedStyle,
          ]}
        >
          <Pressable
            onPress={() => setAddContextVisible(true)}
            style={({ pressed }) => [
              styles.addContextBtn,
              { backgroundColor: colors.muted },
              pressed && styles.pressed,
            ]}
            hitSlop={6}
          >
            <Text
              style={[styles.addContextLabel, { color: colors.foreground }]}
            >
              +
            </Text>
          </Pressable>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.muted,
                color: colors.foreground,
              },
            ]}
            placeholder="Message…"
            placeholderTextColor={colors.mutedForeground}
            value={input}
            onChangeText={setInput}
            multiline
            maxLength={2000}
            returnKeyType="send"
            onSubmitEditing={() => sendMessage()}
            editable={!isLoading}
          />
          <Pressable
            onPress={() => sendMessage()}
            disabled={!canSend}
            style={({ pressed }) => [
              styles.sendBtn,
              { backgroundColor: canSend ? colors.primary : colors.muted },
              pressed && canSend && styles.sendBtnPressed,
            ]}
            hitSlop={8}
          >
            <Ionicons
              name="arrow-up"
              size={22}
              color={
                canSend ? colors.primaryForeground : colors.mutedForeground
              }
            />
          </Pressable>
        </Animated.View>
      </KeyboardAvoidingView>

      <ChatAddContextSheet
        visible={addContextVisible}
        onClose={() => setAddContextVisible(false)}
        onAddContext={handleAddContext}
      />

      <ChatListSideSheet
        visible={chatsSheetVisible}
        onClose={() => setChatsSheetVisible(false)}
        chats={chatListItems}
        currentChatId={currentChatId}
        onSelectChat={handleSelectChat}
        onNewChat={handleNewChat}
      />

      <ChatFeedbackNoteModal
        visible={feedbackVisible}
        kind={feedbackKind}
        onClose={() => {
          setFeedbackVisible(false);
          setFeedbackMessageId(null);
        }}
        onSubmit={handleFeedbackSubmit}
      />

      {/* Rename modal */}
      {renameModalVisible && (
        <RenameModal
          colors={colors}
          value={renameValue}
          onChangeText={setRenameValue}
          onSave={() => {
            setCurrentChatName(renameValue.trim());
            setRenameModalVisible(false);
            setRenameValue("");
          }}
          onClose={() => {
            setRenameModalVisible(false);
            setRenameValue("");
          }}
        />
      )}
    </View>
  );
}

function RenameModal({
  colors,
  value,
  onChangeText,
  onSave,
  onClose,
}: {
  colors: (typeof Colors)["light"];
  value: string;
  onChangeText: (t: string) => void;
  onSave: () => void;
  onClose: () => void;
}) {
  const insets = useSafeAreaInsets();
  return (
    <RNModal visible transparent animationType="fade">
      <Pressable style={renameStyles.overlay} onPress={onClose}>
        <Pressable
          style={[
            renameStyles.card,
            { backgroundColor: colors.popover ?? colors.card },
          ]}
          onPress={(e) => e.stopPropagation()}
        >
          <Text style={[renameStyles.title, { color: colors.foreground }]}>
            Rename chat
          </Text>
          <TextInput
            style={[
              renameStyles.input,
              {
                backgroundColor: colors.background,
                color: colors.foreground,
                borderColor: colors.border,
              },
            ]}
            placeholder="Chat name"
            placeholderTextColor={colors.mutedForeground}
            value={value}
            onChangeText={onChangeText}
            autoFocus
          />
          <View style={renameStyles.actions}>
            <Pressable onPress={onClose} style={renameStyles.cancelBtn}>
              <Text style={{ color: colors.foreground }}>Cancel</Text>
            </Pressable>
            <Pressable
              onPress={onSave}
              style={[
                renameStyles.saveBtn,
                { backgroundColor: colors.primary },
              ]}
            >
              <Text style={{ color: colors.primaryForeground }}>Save</Text>
            </Pressable>
          </View>
          <View style={{ height: insets.bottom + 8 }} />
        </Pressable>
      </Pressable>
    </RNModal>
  );
}

const renameStyles = StyleSheet.create({
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
    borderRadius: 12,
    padding: 20,
  },
  title: { fontSize: 18, fontWeight: "700", marginBottom: 12 },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
  },
  actions: { flexDirection: "row", gap: 12 },
  cancelBtn: { flex: 1, paddingVertical: 14, alignItems: "center" },
  saveBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingBottom: 42,
  },
  headerWrap: {},
  keyboard: {
    flex: 1,
  },
  listContent: {
    flexGrow: 1,
    paddingHorizontal: 16,
  },
  emptyWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    minHeight: 220,
  },
  emptyIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "600",
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
    opacity: 0.9,
  },
  bubbleWrap: {
    maxWidth: "88%",
    marginBottom: 12,
  },
  bubbleWrapUser: { alignSelf: "flex-end" },
  bubbleWrapAssistant: { alignSelf: "flex-start" },
  bubble: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 18,
  },
  bubbleText: { fontSize: 16, lineHeight: 22 },
  bubbleActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 6,
  },
  bubbleActionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  bubbleActionLabel: { fontSize: 13 },
  pressed: { opacity: 0.7 },
  typingRow: { marginBottom: 12, alignSelf: "flex-start" },
  typingBubble: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 18,
    borderBottomLeftRadius: 4,
    gap: 6,
  },
  typingDot: { width: 8, height: 8, borderRadius: 4 },
  contextChipsScroll: {
    maxHeight: 30,
  },
  contextChipsWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    maxHeight: 30,
  },
  contextChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 6,
    paddingLeft: 12,
    paddingRight: 8,
    borderRadius: 20,
  },
  contextChipText: {
    fontSize: 13,
    fontWeight: "500",
    flex: 1,
  },
  contextChipRemove: {
    fontSize: 18,
    fontWeight: "300",
    lineHeight: 20,
  },
  promptsOuter: {},
  promptsScroll: {},
  promptsWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  promptChip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    minWidth: 100,
  },
  promptChipPressed: { opacity: 0.75 },
  promptChipText: { fontSize: 14, fontWeight: "500" },
  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 10,
  },
  addContextBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  addContextLabel: {
    fontSize: 24,
    fontWeight: "300",
    lineHeight: 28,
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    borderRadius: 22,
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 12,
    fontSize: 16,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  sendBtnPressed: { opacity: 0.85 },
});
