import { radius } from "@/constants/theme";
import { useSubscription } from "@/contexts/subscription-context";
import { useApi } from "@/hooks/use-api";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useThemeColors } from "@/hooks/use-theme-colors";
import type { Journal } from "@/lib/api";
import { ApiError, isPlanLimitError } from "@/lib/api";
import { showPlanLimitUpgrade } from "@/utils/plan-limit";
import Ionicons from "@expo/vector-icons/Ionicons";
import * as Haptics from "expo-haptics";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useRef, useState } from "react";
import {
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const TAB_BAR_CLEARANCE = 80;

type MessageRole = "user" | "assistant";
type ChatMessage = { id: string; role: MessageRole; content: string };

export default function AIChatScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const api = useApi();
  const { isPro } = useSubscription() ?? { isPro: false };
  const apiRef = useRef(api);
  apiRef.current = api;

  const [journals, setJournals] = useState<Journal[]>([]);
  const [journalsLoading, setJournalsLoading] = useState(true);
  const [selectedJournal, setSelectedJournal] = useState<Journal | null>(null);
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  React.useEffect(() => {
    const showEvent =
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent =
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";
    const showSub = Keyboard.addListener(showEvent, () =>
      setKeyboardVisible(true),
    );
    const hideSub = Keyboard.addListener(hideEvent, () =>
      setKeyboardVisible(false),
    );
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      setJournalsLoading(true);
      apiRef.current
        .fetchJournals()
        .then((list) => {
          if (!cancelled) setJournals(list);
        })
        .catch(() => {
          if (!cancelled) setJournals([]);
        })
        .finally(() => {
          if (!cancelled) setJournalsLoading(false);
        });
      return () => {
        cancelled = true;
      };
    }, []),
  );

  const selectJournal = useCallback((journal: Journal) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedJournal(journal);
    setSessionId(null);
    setMessages([]);
    setChatError(null);
  }, []);

  const goBackToPicker = useCallback(() => {
    setSelectedJournal(null);
    setSessionId(null);
    setMessages([]);
    setChatError(null);
  }, []);

  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || !selectedJournal || sending) return;
    if (!isPro) {
      showPlanLimitUpgrade(router);
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setInput("");
    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: "user",
      content: text,
    };
    setMessages((prev) => [...prev, userMsg]);
    setSending(true);
    setChatError(null);
    try {
      const { reply, sessionId: nextSessionId } =
        await apiRef.current.sendJournalChat(
          selectedJournal.id,
          text,
          sessionId,
        );
      setSessionId(nextSessionId);
      const assistantMsg: ChatMessage = {
        id: `a-${Date.now()}`,
        role: "assistant",
        content: reply,
      };
      setMessages((prev) => [...prev, assistantMsg]);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    } catch (e) {
      if (isPlanLimitError(e)) {
        showPlanLimitUpgrade(router);
        return;
      }
      const msg =
        e instanceof ApiError && e.status === 502
          ? "AI is temporarily unavailable"
          : e instanceof ApiError && e.status === 404
            ? "Journal not found"
            : "Something went wrong";
      setChatError(msg);
      setMessages((prev) => [
        ...prev,
        { id: `e-${Date.now()}`, role: "assistant", content: msg },
      ]);
    } finally {
      setSending(false);
    }
  }, [input, isPro, router, selectedJournal, sessionId, sending]);

  if (journalsLoading && journals.length === 0) {
    return (
      <View
        style={[
          styles.center,
          { backgroundColor: colors.background, paddingTop: insets.top },
        ]}
      >
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingLabel, { color: colors.mutedForeground }]}>
          Loading journals…
        </Text>
      </View>
    );
  }

  if (!selectedJournal) {
    return (
      <View
        style={[
          styles.container,
          { backgroundColor: colors.background, paddingTop: insets.top },
        ]}
      >
        <View style={styles.pickerHeader}>
          <Text style={[styles.pickerTitle, { color: colors.foreground }]}>
            Reflect with AI
          </Text>
          <Text
            style={[styles.pickerSubtitle, { color: colors.mutedForeground }]}
          >
            Choose a journal. The AI will use its recent entries as context.
          </Text>
        </View>
        <ScrollView
          style={styles.journalList}
          contentContainerStyle={[
            styles.journalListContent,
            { paddingBottom: insets.bottom + TAB_BAR_CLEARANCE + 24 },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {journals.length === 0 ? (
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              No journals yet. Create one from the Journals tab.
            </Text>
          ) : (
            journals.map((journal, i) => (
              <Animated.View
                key={journal.id}
                entering={FadeInDown.duration(280)
                  .springify()
                  .damping(18)
                  .delay(i * 40)}
              >
                <Pressable
                  onPress={() => selectJournal(journal)}
                  style={({ pressed }) => [
                    styles.journalCard,
                    {
                      backgroundColor: colors.card,
                      borderColor: colors.border,
                    },
                    pressed && { opacity: 0.85 },
                  ]}
                >
                  <Ionicons
                    name="book-outline"
                    size={22}
                    color={colors.primary}
                  />
                  <View style={styles.journalCardBody}>
                    <Text
                      style={[
                        styles.journalCardTitle,
                        { color: colors.foreground },
                      ]}
                      numberOfLines={1}
                    >
                      {journal.title}
                    </Text>
                    <Text
                      style={[
                        styles.journalCardMeta,
                        { color: colors.mutedForeground },
                      ]}
                    >
                      {journal.entryCount ?? 0} entries
                    </Text>
                  </View>
                  <Ionicons
                    name="chevron-forward"
                    size={20}
                    color={colors.mutedForeground}
                  />
                </Pressable>
              </Animated.View>
            ))
          )}
        </ScrollView>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.chatContainer, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
    >
      <View
        style={[
          styles.chatHeader,
          { paddingTop: insets.top + 8, borderBottomColor: colors.border },
        ]}
      >
        <Pressable
          onPress={goBackToPicker}
          style={({ pressed }) => [
            styles.chatBackBtn,
            pressed && { opacity: 0.7 },
          ]}
          hitSlop={12}
        >
          <Ionicons name="chevron-back" size={24} color={colors.foreground} />
        </Pressable>
        <Text
          style={[styles.chatHeaderTitle, { color: colors.foreground }]}
          numberOfLines={1}
        >
          {selectedJournal.title}
        </Text>
        <View style={styles.chatHeaderRight} />
      </View>

      <ScrollView
        ref={scrollRef}
        style={styles.messagesScroll}
        contentContainerStyle={[
          styles.messagesContent,
          { paddingBottom: 16, paddingTop: 12 },
        ]}
        onContentSizeChange={() =>
          scrollRef.current?.scrollToEnd({ animated: true })
        }
        showsVerticalScrollIndicator={false}
      >
        {messages.length === 0 && (
          <Animated.View
            entering={FadeIn.duration(320)}
            style={styles.welcomeBlock}
          >
            <Ionicons
              name="chatbubbles-outline"
              size={40}
              color={colors.muted}
            />
            <Text style={[styles.welcomeTitle, { color: colors.foreground }]}>
              Ask about your entries
            </Text>
            <Text
              style={[
                styles.welcomeSubtitle,
                { color: colors.mutedForeground },
              ]}
            >
              e.g. “What patterns do you see this week?” or “Suggest a prompt.”
            </Text>
          </Animated.View>
        )}
        {messages.map((msg) => (
          <View
            key={msg.id}
            style={[
              styles.bubbleWrap,
              msg.role === "user"
                ? styles.bubbleWrapUser
                : styles.bubbleWrapAssistant,
            ]}
          >
            <View
              style={[
                styles.bubble,
                msg.role === "user"
                  ? { backgroundColor: colors.primary }
                  : {
                      backgroundColor: colors.card,
                      borderColor: colors.border,
                    },
              ]}
            >
              <Text
                style={[
                  styles.bubbleText,
                  {
                    color:
                      msg.role === "user"
                        ? colors.primaryForeground
                        : colors.foreground,
                  },
                ]}
              >
                {msg.content}
              </Text>
            </View>
          </View>
        ))}
        {sending && (
          <View style={[styles.bubbleWrap, styles.bubbleWrapAssistant]}>
            <View
              style={[
                styles.bubble,
                styles.typingBubble,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              <ActivityIndicator size="small" color={colors.primary} />
              <Text
                style={[styles.typingText, { color: colors.mutedForeground }]}
              >
                Thinking…
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      {chatError && (
        <View
          style={[
            styles.errorBar,
            { backgroundColor: colors.destructive + "20" },
          ]}
        >
          <Text
            style={[styles.errorBarText, { color: colors.destructive }]}
            numberOfLines={1}
          >
            {chatError}
          </Text>
          <Pressable
            onPress={() => setChatError(null)}
            style={({ pressed }) => pressed && { opacity: 0.8 }}
          >
            <Text style={[styles.errorBarRetry, { color: colors.destructive }]}>
              Dismiss
            </Text>
          </Pressable>
        </View>
      )}

      <View
        style={[
          styles.inputRow,
          {
            paddingBottom: keyboardVisible
              ? 12
              : insets.bottom + TAB_BAR_CLEARANCE - 20,
            borderTopColor: colors.border,
          },
        ]}
      >
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              color: colors.foreground,
            },
          ]}
          placeholder="Message…"
          placeholderTextColor={colors.mutedForeground}
          value={input}
          onChangeText={setInput}
          multiline
          maxLength={2000}
          editable={!sending}
          onSubmitEditing={sendMessage}
        />
        <Pressable
          onPress={sendMessage}
          disabled={!input.trim() || sending}
          style={({ pressed }) => [
            styles.sendBtn,
            { backgroundColor: colors.primary },
            (!input.trim() || sending || pressed) && { opacity: 0.6 },
          ]}
        >
          <Ionicons name="send" size={20} color={colors.primaryForeground} />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingLabel: { marginTop: 12, fontSize: 15 },
  container: { flex: 1 },
  pickerHeader: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 16 },
  pickerTitle: { fontSize: 22, fontWeight: "800" },
  pickerSubtitle: { fontSize: 14, marginTop: 6, lineHeight: 20 },
  journalList: { flex: 1 },
  journalListContent: { paddingHorizontal: 20, gap: 10 },
  emptyText: { fontSize: 15, textAlign: "center", paddingVertical: 32 },
  journalCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: 10,
  },
  journalCardBody: { flex: 1, marginLeft: 12, minWidth: 0 },
  journalCardTitle: { fontSize: 17, fontWeight: "600" },
  journalCardMeta: { fontSize: 13, marginTop: 2 },
  chatContainer: { flex: 1 },
  chatHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingBottom: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  chatBackBtn: { padding: 4, marginRight: 4 },
  chatHeaderTitle: { flex: 1, fontSize: 17, fontWeight: "700" },
  chatHeaderRight: { width: 36 },
  messagesScroll: { flex: 1 },
  messagesContent: { paddingHorizontal: 16 },
  welcomeBlock: { alignItems: "center", paddingVertical: 32 },
  welcomeTitle: { fontSize: 18, fontWeight: "700", marginTop: 12 },
  welcomeSubtitle: {
    fontSize: 14,
    marginTop: 6,
    textAlign: "center",
    paddingHorizontal: 24,
  },
  bubbleWrap: { marginBottom: 10 },
  bubbleWrapUser: { alignItems: "flex-end" },
  bubbleWrapAssistant: { alignItems: "flex-start" },
  bubble: {
    maxWidth: "85%",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
  },
  bubbleText: { fontSize: 16, lineHeight: 22 },
  typingBubble: { flexDirection: "row", alignItems: "center", gap: 8 },
  typingText: { fontSize: 14 },
  errorBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  errorBarText: { flex: 1, fontSize: 13 },
  errorBarRetry: { fontSize: 13, fontWeight: "600" },
  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: radius.xl,
    borderWidth: 1,
    fontSize: 16,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
});
