import { ThemedView } from "@/components/themed-view";
import { Colors, radius } from "@/constants/theme";
import { useApi } from "@/hooks/use-api";
import { useColorScheme } from "@/hooks/use-color-scheme";
import type { JournalEntry } from "@/lib/api";
import { ApiError } from "@/lib/api";
import { isValidEntryId } from "@/lib/validate-ids";
import Ionicons from "@expo/vector-icons/Ionicons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  AppState,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import Animated, {
  FadeIn,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const PADDING_H = 16;
const DRAFT_PERSIST_DEBOUNCE_MS = 800;
const DRAFT_KEY_PREFIX = "@lumina/entry-draft/";

const MOOD_OPTIONS = [
  "calm",
  "energized",
  "focused",
  "grateful",
  "grounded",
  "neutral",
  "satisfied",
  "tired",
];

/** Strip HTML to plain text when loading legacy rich-text entries */
function bodyPlainFromHtml(html: string | undefined): string {
  if (!html || !html.trim()) return "";
  if (!html.trimStart().startsWith("<")) return html;
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\s+/g, "\n");
}

export default function EntryDetailScreen() {
  const { entryId: rawEntryId, journalId: rawJournalId } =
    useLocalSearchParams<{
      entryId: string;
      journalId?: string;
    }>();
  const entryId = isValidEntryId(rawEntryId) ? rawEntryId!.trim() : null;
  const journalId = rawJournalId?.trim() || null;
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const insets = useSafeAreaInsets();
  const api = useApi();

  const [entry, setEntry] = useState<JournalEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [mood, setMood] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [images, setImages] = useState<string[]>([]);
  const [saveStatus, setSaveStatus] = useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");
  const [detailsVisible, setDetailsVisible] = useState(false);
  const [tagInputValue, setTagInputValue] = useState("");
  const [aiSummaryText, setAiSummaryText] = useState<string | null>(null);
  const [aiQualityScore, setAiQualityScore] = useState<number | null>(null);
  const [aiMoodLabel, setAiMoodLabel] = useState<string | null>(null);
  const [aiTags, setAiTags] = useState<string[]>([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [goDeeperLoading, setGoDeeperLoading] = useState(false);
  const [goDeeperQuestions, setGoDeeperQuestions] = useState<string[]>([]);
  const [goDeeperVisible, setGoDeeperVisible] = useState(false);
  const bodyInputRef = useRef<TextInput>(null);
  const draftTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const titleRef = useRef("");
  const bodyRef = useRef("");
  const moodRef = useRef("");
  const tagsRef = useRef<string[]>([]);
  const savingRef = useRef(false);

  const loadingRef = useRef(false);
  const loadEntry = useCallback(async () => {
    if (!entryId) return;
    if (loadingRef.current) return;
    loadingRef.current = true;
    setLoading(true);
    try {
      const e = await api.fetchEntry(entryId);
      if (e) {
        setEntry(e);
        setTitle(e.title ?? "");
        const rawBody = e.body ?? "";
        const text = rawBody.trimStart().startsWith("<")
          ? bodyPlainFromHtml(rawBody)
          : rawBody;
        const trimmed = text.trim();
        const displayBody = trimmed === "." ? "" : trimmed || "";
        setBody(displayBody);
        setMood(e.mood ?? "");
        setTags(e.tags ?? []);
        setImages(e.images ?? []);
        titleRef.current = e.title ?? "";
        bodyRef.current = displayBody;
        moodRef.current = e.mood ?? "";
        tagsRef.current = e.tags ?? [];
        const draftKey = DRAFT_KEY_PREFIX + entryId;
        const draftJson = await AsyncStorage.getItem(draftKey);
        if (draftJson) {
          try {
            const draft = JSON.parse(draftJson) as {
              title?: string;
              body?: string;
              mood?: string;
              tags?: string[];
            };
            if (
              draft.title !== undefined ||
              draft.body !== undefined ||
              draft.mood !== undefined ||
              (draft.tags && draft.tags.length > 0)
            ) {
              const t = draft.title ?? "";
              const b = draft.body ?? "";
              const m = draft.mood ?? "";
              const tg = draft.tags ?? [];
              setTitle(t);
              setBody(b);
              setMood(m);
              setTags(tg);
              titleRef.current = t;
              bodyRef.current = b;
              moodRef.current = m;
              tagsRef.current = tg;
            }
          } catch {
            // ignore invalid draft
          }
        }
      } else {
        setEntry(null);
      }
    } catch {
      setEntry(null);
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  }, [entryId, api]);

  const loadEntryRef = useRef(loadEntry);
  loadEntryRef.current = loadEntry;
  useFocusEffect(
    useCallback(() => {
      loadEntryRef.current();
    }, []),
  );

  titleRef.current = title;
  bodyRef.current = body;
  moodRef.current = mood;
  tagsRef.current = tags;

  const performSave = useCallback(async () => {
    if (!entryId || savingRef.current) return;
    savingRef.current = true;
    setSaveStatus("saving");
    const content = bodyRef.current.trim() || " ";
    const moodVal = moodRef.current.trim() || undefined;
    const tagsVal = tagsRef.current.length > 0 ? tagsRef.current : undefined;
    try {
      await api.updateEntry(entryId, {
        content,
        mood: moodVal,
        tags: tagsVal,
      });
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2000);
      await AsyncStorage.removeItem(DRAFT_KEY_PREFIX + entryId);
    } catch {
      setSaveStatus("error");
    } finally {
      savingRef.current = false;
    }
  }, [entryId, api]);

  useEffect(() => {
    if (draftTimeoutRef.current) clearTimeout(draftTimeoutRef.current);
    draftTimeoutRef.current = setTimeout(() => {
      draftTimeoutRef.current = null;
      if (!entryId) return;
      AsyncStorage.setItem(
        DRAFT_KEY_PREFIX + entryId,
        JSON.stringify({
          title: titleRef.current,
          body: bodyRef.current,
          mood: moodRef.current,
          tags: tagsRef.current,
        }),
      ).catch(() => {});
    }, DRAFT_PERSIST_DEBOUNCE_MS);
    return () => {
      if (draftTimeoutRef.current) {
        clearTimeout(draftTimeoutRef.current);
        draftTimeoutRef.current = null;
      }
    };
  }, [entryId, title, body, mood, tags]);

  useEffect(() => {
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "background" && entryId) {
        performSave();
      }
    });
    return () => sub.remove();
  }, [entryId, performSave]);

  const goBack = useCallback(async () => {
    await performSave();
    router.back();
  }, [performSave, router]);

  const addTag = useCallback(() => {
    const t = tagInputValue.trim().replace(/^#/, "");
    if (t && !tags.includes(t)) {
      setTags((prev) => [...prev, t]);
      setTagInputValue("");
    }
  }, [tagInputValue, tags]);

  const removeTag = useCallback((tag: string) => {
    setTags((prev) => prev.filter((t) => t !== tag));
  }, []);

  const handleRegenerateAi = useCallback(async () => {
    if (!entryId || aiLoading) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setAiError(null);
    setAiLoading(true);
    try {
      await performSave();
      const result = await api.regenerateEntryAi(entryId);
      setAiSummaryText(result.summaryText);
      setAiQualityScore(result.qualityScore);
      setAiMoodLabel(result.moodLabel);
      setAiTags(result.tagsAi.map((t) => t.tag));
      if (result.moodLabel) setMood(result.moodLabel);
      if (result.entry.tags?.length) setTags(result.entry.tags ?? []);
    } catch (e) {
      const msg =
        e instanceof ApiError && e.status === 502
          ? "AI is temporarily unavailable"
          : e instanceof ApiError && e.status === 404
            ? "Entry not found"
            : "Something went wrong";
      setAiError(msg);
    } finally {
      setAiLoading(false);
    }
  }, [entryId, api, aiLoading, performSave]);

  const handleGoDeeper = useCallback(async () => {
    if (!entryId || goDeeperLoading) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setGoDeeperLoading(true);
    setGoDeeperQuestions([]);
    try {
      await performSave();
      const { questions } = await api.goDeeper(entryId, body.trim() || null);
      setGoDeeperQuestions(questions);
      setGoDeeperVisible(true);
    } catch (e) {
      const msg =
        e instanceof ApiError && e.status === 502
          ? "AI is temporarily unavailable"
          : e instanceof ApiError && e.status === 404
            ? "Entry not found"
            : "Something went wrong";
      setGoDeeperVisible(true);
      setGoDeeperQuestions([msg]);
    } finally {
      setGoDeeperLoading(false);
    }
  }, [entryId, api, body, goDeeperLoading, performSave]);

  const pickQuestion = useCallback(
    (question: string) => {
      if (
        question.startsWith("AI is") ||
        question.startsWith("Entry") ||
        question.startsWith("Something")
      )
        return;
      const sep = body.trim() ? "\n\n" : "";
      setBody((prev) => prev.trim() + sep + question);
      setGoDeeperVisible(false);
      bodyInputRef.current?.focus();
    },
    [body],
  );

  const skeletonOpacity = useSharedValue(0.4);
  useEffect(() => {
    if (!aiLoading) return;
    skeletonOpacity.value = withRepeat(
      withSequence(
        withTiming(0.7, { duration: 600 }),
        withTiming(0.35, { duration: 600 }),
      ),
      -1,
      true,
    );
    return () => {
      skeletonOpacity.value = withTiming(0.4, { duration: 200 });
    };
  }, [aiLoading, skeletonOpacity]);
  const skeletonStyle = useAnimatedStyle(() => ({
    opacity: skeletonOpacity.value,
  }));

  const pickImage = useCallback(async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsMultipleSelection: false,
      quality: 0.8,
    });
    if (!result.canceled && result.assets?.[0]?.uri) {
      const uri = result.assets[0].uri;
      setImages((prev) => (prev.includes(uri) ? prev : [...prev, uri]));
    }
  }, []);

  if (!entryId) {
    return (
      <ThemedView style={styles.container}>
        <Text style={styles.notFound}>Entry not found.</Text>
        <Pressable onPress={() => router.back()}>
          <Text style={{ color: colors.primary }}>Go back</Text>
        </Pressable>
      </ThemedView>
    );
  }

  if (loading && !entry) {
    return (
      <ThemedView style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>
          Loading…
        </Text>
      </ThemedView>
    );
  }

  if (!entry) {
    return (
      <ThemedView style={styles.container}>
        <Text style={styles.notFound}>Entry not found.</Text>
        <Pressable onPress={() => router.back()}>
          <Text style={{ color: colors.primary }}>Go back</Text>
        </Pressable>
      </ThemedView>
    );
  }

  const detailsSummary =
    [
      mood && `🙂 ${mood}`,
      tags.length > 0 && tags.map((t) => `#${t}`).join(" "),
    ]
      .filter(Boolean)
      .join(" · ") || "Add mood & tags";

  return (
    <ThemedView style={styles.container}>
      <View
        style={[
          styles.header,
          {
            paddingTop: insets.top + 8,
            paddingBottom: 10,
            paddingHorizontal: PADDING_H,
            backgroundColor: colors.background,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <Pressable
          onPress={goBack}
          style={({ pressed }) => [
            styles.backButton,
            pressed && { opacity: 0.7 },
          ]}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="chevron-back" size={24} color={colors.foreground} />
        </Pressable>
        <View style={styles.headerCenter}>
          {(saveStatus === "saving" || saveStatus === "saved") && (
            <Text
              style={[styles.saveStatusText, { color: colors.mutedForeground }]}
              numberOfLines={1}
            >
              {saveStatus === "saving" ? "Saving…" : "Saved"}
            </Text>
          )}
        </View>
        <View style={styles.headerRight}>
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setDetailsVisible(true);
            }}
            style={({ pressed }) => [
              styles.detailsButton,
              pressed && { opacity: 0.7 },
            ]}
            accessibilityLabel="Details"
          >
            <Ionicons
              name="information-circle-outline"
              size={24}
              color={colors.foreground}
            />
          </Pressable>
        </View>
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[
            styles.scrollContent,
            {
              paddingHorizontal: PADDING_H,
              paddingTop: 12,
              paddingBottom: insets.bottom + 24,
            },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View
            entering={FadeInDown.duration(320).springify().damping(18)}
            style={styles.notesBlock}
          >
            <TextInput
              style={[styles.titleInput, { color: colors.foreground }]}
              placeholder="Title"
              placeholderTextColor={colors.mutedForeground}
              value={title}
              onChangeText={setTitle}
              maxLength={200}
              returnKeyType="next"
              onSubmitEditing={() => bodyInputRef.current?.focus()}
              blurOnSubmit={false}
            />
            <TextInput
              ref={bodyInputRef}
              style={[
                styles.bodyInput,
                {
                  color: colors.foreground,
                  backgroundColor: colors.popover ?? colors.card,
                  borderColor: colors.border,
                },
              ]}
              placeholder="Write your thoughts…"
              placeholderTextColor={colors.mutedForeground}
              value={body}
              onChangeText={setBody}
              multiline
              textAlignVertical="top"
              scrollEnabled={false}
            />
          </Animated.View>

          <Animated.View
            entering={FadeInDown.duration(280)
              .springify()
              .damping(18)
              .delay(80)}
          >
            <Pressable
              onPress={pickImage}
              style={({ pressed }) => [
                styles.addPhotoRow,
                pressed && { opacity: 0.7 },
              ]}
            >
              <Ionicons
                name="image-outline"
                size={18}
                color={colors.mutedForeground}
              />
              <Text
                style={[styles.addPhotoText, { color: colors.mutedForeground }]}
              >
                Add photo
              </Text>
            </Pressable>

            {images.length > 0 ? (
              <View style={styles.inlineImages}>
                {images.map((uri, idx) => (
                  <View key={uri + idx} style={styles.inlineImageWrap}>
                    <Image
                      source={{ uri }}
                      style={styles.inlineImage}
                      contentFit="cover"
                    />
                    <Pressable
                      onPress={() => {
                        setImages((p) => p.filter((_, i) => i !== idx));
                      }}
                      style={styles.inlineImageRemove}
                      hitSlop={8}
                    >
                      <Ionicons
                        name="close-circle"
                        size={22}
                        color={colors.destructive}
                      />
                    </Pressable>
                  </View>
                ))}
              </View>
            ) : null}

            <Pressable
              onPress={() => setDetailsVisible(true)}
              style={({ pressed }) => [
                styles.metaRow,
                { borderTopColor: colors.border },
                pressed && { opacity: 0.8 },
              ]}
            >
              <Ionicons
                name="pricetag-outline"
                size={16}
                color={colors.mutedForeground}
              />
              <Text
                style={[styles.metaRowText, { color: colors.mutedForeground }]}
                numberOfLines={1}
              >
                {detailsSummary}
              </Text>
              <Ionicons
                name="chevron-forward"
                size={16}
                color={colors.mutedForeground}
              />
            </Pressable>

            {/* AI Reflection: Generate AI + Go deeper */}
            <Animated.View
              entering={FadeInDown.duration(300)
                .springify()
                .damping(18)
                .delay(120)}
              style={[styles.aiBlock, { borderTopColor: colors.border }]}
            >
              <View style={styles.aiBlockHeader}>
                <Ionicons name="sparkles" size={18} color={colors.primary} />
                <Text
                  style={[styles.aiBlockTitle, { color: colors.foreground }]}
                >
                  Reflection
                </Text>
              </View>
              {aiLoading && (
                <Animated.View style={[styles.aiSkeleton, skeletonStyle]}>
                  <View
                    style={[
                      styles.aiSkeletonLine,
                      { backgroundColor: colors.muted },
                    ]}
                  />
                  <View
                    style={[
                      styles.aiSkeletonLine,
                      styles.aiSkeletonLineShort,
                      { backgroundColor: colors.muted },
                    ]}
                  />
                  <Text
                    style={[
                      styles.aiSkeletonText,
                      { color: colors.mutedForeground },
                    ]}
                  >
                    Analyzing reflection…
                  </Text>
                </Animated.View>
              )}
              {!aiLoading && aiError && (
                <View style={styles.aiErrorRow}>
                  <Text
                    style={[styles.aiErrorText, { color: colors.destructive }]}
                  >
                    {aiError}
                  </Text>
                  <Pressable
                    onPress={handleRegenerateAi}
                    style={({ pressed }) => [
                      styles.aiRetryBtn,
                      { backgroundColor: colors.primary },
                      pressed && { opacity: 0.85 },
                    ]}
                  >
                    <Text
                      style={[
                        styles.aiRetryBtnText,
                        { color: colors.primaryForeground },
                      ]}
                    >
                      Retry
                    </Text>
                  </Pressable>
                </View>
              )}
              {!aiLoading &&
                !aiError &&
                (aiSummaryText ||
                  aiQualityScore != null ||
                  aiMoodLabel ||
                  aiTags.length > 0) && (
                  <Animated.View entering={FadeIn.duration(280)}>
                    {aiSummaryText ? (
                      <Text
                        style={[styles.aiSummary, { color: colors.foreground }]}
                      >
                        {aiSummaryText}
                      </Text>
                    ) : null}
                    {aiMoodLabel || aiTags.length > 0 ? (
                      <View style={styles.aiPillsRow}>
                        {aiMoodLabel ? (
                          <View
                            style={[
                              styles.aiPill,
                              { backgroundColor: colors.primary + "22" },
                            ]}
                          >
                            <Text
                              style={[
                                styles.aiPillText,
                                { color: colors.primary },
                              ]}
                            >
                              {aiMoodLabel}
                            </Text>
                          </View>
                        ) : null}
                        {aiTags.slice(0, 5).map((t) => (
                          <View
                            key={t}
                            style={[
                              styles.aiPill,
                              { backgroundColor: colors.muted },
                            ]}
                          >
                            <Text
                              style={[
                                styles.aiPillText,
                                { color: colors.foreground },
                              ]}
                            >
                              #{t}
                            </Text>
                          </View>
                        ))}
                      </View>
                    ) : null}
                    {aiQualityScore != null && (
                      <Text
                        style={[
                          styles.aiScore,
                          { color: colors.mutedForeground },
                        ]}
                      >
                        Reflection score: {aiQualityScore}/100
                      </Text>
                    )}
                  </Animated.View>
                )}
              <View style={styles.aiActionsRow}>
                <Pressable
                  onPress={handleRegenerateAi}
                  disabled={aiLoading}
                  style={({ pressed }) => [
                    styles.aiActionBtn,
                    { backgroundColor: colors.primary },
                    (aiLoading || pressed) && { opacity: 0.8 },
                  ]}
                >
                  {aiLoading ? (
                    <Text
                      style={[
                        styles.aiActionBtnText,
                        { color: colors.primaryForeground },
                      ]}
                    >
                      Analyzing…
                    </Text>
                  ) : (
                    <>
                      <Ionicons
                        name="sparkles-outline"
                        size={16}
                        color={colors.primaryForeground}
                      />
                      <Text
                        style={[
                          styles.aiActionBtnText,
                          { color: colors.primaryForeground },
                        ]}
                      >
                        {aiSummaryText ? "Refresh AI" : "Generate AI"}
                      </Text>
                    </>
                  )}
                </Pressable>
                <Pressable
                  onPress={handleGoDeeper}
                  disabled={goDeeperLoading || aiLoading}
                  style={({ pressed }) => [
                    styles.aiActionBtn,
                    {
                      backgroundColor: colors.card,
                      borderWidth: 1,
                      borderColor: colors.border,
                    },
                    (goDeeperLoading || aiLoading || pressed) && {
                      opacity: 0.8,
                    },
                  ]}
                >
                  {goDeeperLoading ? (
                    <Text
                      style={[
                        styles.aiActionBtnText,
                        { color: colors.foreground },
                      ]}
                    >
                      Getting prompts…
                    </Text>
                  ) : (
                    <>
                      <Ionicons
                        name="chatbubble-ellipses-outline"
                        size={16}
                        color={colors.foreground}
                      />
                      <Text
                        style={[
                          styles.aiActionBtnText,
                          { color: colors.foreground },
                        ]}
                      >
                        Go deeper
                      </Text>
                    </>
                  )}
                </Pressable>
              </View>
            </Animated.View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal
        visible={detailsVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setDetailsVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setDetailsVisible(false)}
        >
          <Pressable
            style={[
              styles.detailsSheet,
              { backgroundColor: colors.background },
            ]}
            onPress={(e) => e.stopPropagation()}
          >
            <View
              style={[styles.detailsHandle, { backgroundColor: colors.border }]}
            />
            <View style={styles.detailsContent}>
              <View style={styles.detailsRow}>
                <Ionicons
                  name="happy-outline"
                  size={20}
                  color={colors.mutedForeground}
                />
                <Text
                  style={[
                    styles.detailsRowLabel,
                    { color: colors.mutedForeground },
                  ]}
                >
                  Mood
                </Text>
                <View style={styles.detailsRowOptions}>
                  {MOOD_OPTIONS.map((m) => (
                    <Pressable
                      key={m}
                      onPress={() => {
                        setMood(mood === m ? "" : m);
                      }}
                      style={({ pressed }) => [
                        styles.detailsPill,
                        {
                          backgroundColor:
                            mood === m ? colors.primary : colors.muted,
                          borderColor: colors.border,
                        },
                        pressed && { opacity: 0.8 },
                      ]}
                    >
                      <Text
                        style={[
                          styles.detailsPillText,
                          {
                            color:
                              mood === m
                                ? colors.primaryForeground
                                : colors.foreground,
                          },
                        ]}
                      >
                        {m}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
              <View style={styles.detailsRow}>
                <Ionicons
                  name="pricetag-outline"
                  size={20}
                  color={colors.mutedForeground}
                />
                <Text
                  style={[
                    styles.detailsRowLabel,
                    { color: colors.mutedForeground },
                  ]}
                >
                  Tags
                </Text>
                <View style={styles.detailsRowTags}>
                  {tags.map((tag) => (
                    <Pressable
                      key={tag}
                      onPress={() => removeTag(tag)}
                      style={({ pressed }) => [
                        styles.detailsTag,
                        {
                          backgroundColor: colors.muted,
                          borderColor: colors.border,
                        },
                        pressed && { opacity: 0.8 },
                      ]}
                    >
                      <Text
                        style={[
                          styles.detailsTagText,
                          { color: colors.foreground },
                        ]}
                      >
                        #{tag}
                      </Text>
                      <Ionicons
                        name="close"
                        size={14}
                        color={colors.foreground}
                      />
                    </Pressable>
                  ))}
                  <View style={styles.detailsTagInputRow}>
                    <TextInput
                      style={[
                        styles.detailsTagInput,
                        {
                          color: colors.foreground,
                          borderColor: colors.border,
                          backgroundColor: colors.card,
                        },
                      ]}
                      placeholder="Add tag"
                      placeholderTextColor={colors.mutedForeground}
                      value={tagInputValue}
                      onChangeText={setTagInputValue}
                      onSubmitEditing={addTag}
                      returnKeyType="done"
                      maxLength={30}
                    />
                    <Pressable
                      onPress={addTag}
                      style={({ pressed }) => [
                        styles.detailsAddTagBtn,
                        { backgroundColor: colors.primary },
                        pressed && { opacity: 0.9 },
                      ]}
                    >
                      <Text
                        style={[
                          styles.detailsAddTagBtnText,
                          { color: colors.primaryForeground },
                        ]}
                      >
                        Add
                      </Text>
                    </Pressable>
                  </View>
                </View>
              </View>
            </View>
            <View style={{ height: insets.bottom + 16 }} />
          </Pressable>
        </Pressable>
      </Modal>

      {/* Go deeper: questions list */}
      <Modal
        visible={goDeeperVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setGoDeeperVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setGoDeeperVisible(false)}
        >
          <Pressable
            style={[
              styles.detailsSheet,
              { backgroundColor: colors.background },
            ]}
            onPress={(e) => e.stopPropagation()}
          >
            <View
              style={[styles.detailsHandle, { backgroundColor: colors.border }]}
            />
            <Text style={[styles.goDeeperTitle, { color: colors.foreground }]}>
              Go deeper
            </Text>
            <Text
              style={[
                styles.goDeeperSubtitle,
                { color: colors.mutedForeground },
              ]}
            >
              Tap a question to add it to your entry
            </Text>
            <ScrollView
              style={styles.goDeeperList}
              showsVerticalScrollIndicator={false}
            >
              {goDeeperQuestions.map((q, i) => (
                <Pressable
                  key={i}
                  onPress={() => pickQuestion(q)}
                  style={({ pressed }) => [
                    styles.goDeeperItem,
                    {
                      backgroundColor: colors.card,
                      borderColor: colors.border,
                    },
                    pressed && { opacity: 0.85 },
                  ]}
                >
                  <Ionicons
                    name="chatbubble-outline"
                    size={18}
                    color={colors.primary}
                  />
                  <Text
                    style={[
                      styles.goDeeperItemText,
                      { color: colors.foreground },
                    ]}
                  >
                    {q}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
            <Pressable
              onPress={() => setGoDeeperVisible(false)}
              style={({ pressed }) => [
                styles.goDeeperCloseBtn,
                { borderColor: colors.border },
                pressed && { opacity: 0.8 },
              ]}
            >
              <Text
                style={[
                  styles.goDeeperCloseBtnText,
                  { color: colors.foreground },
                ]}
              >
                Close
              </Text>
            </Pressable>
            <View style={{ height: insets.bottom + 16 }} />
          </Pressable>
        </Pressable>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { justifyContent: "center", alignItems: "center" },
  loadingText: { marginTop: 12 },
  notFound: { padding: 20 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backButton: { padding: 4, marginRight: 4 },
  headerCenter: {
    flex: 1,
    minWidth: 0,
    justifyContent: "center",
    alignItems: "center",
  },
  saveStatusText: { fontSize: 12 },
  headerRight: { flexDirection: "row", alignItems: "center", gap: 12 },
  detailsButton: { padding: 4 },
  keyboardAvoid: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: {},
  notesBlock: {
    marginBottom: 8,
  },
  titleInput: {
    fontSize: 26,
    fontWeight: "700",
    paddingVertical: 6,
    paddingHorizontal: 0,
    marginBottom: 12,
    letterSpacing: 0.2,
  },
  bodyInput: {
    minHeight: 200,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: radius.md,
    borderWidth: 1,
    fontSize: 17,
    lineHeight: 24,
  },
  inlineImages: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12,
  },
  inlineImageWrap: { position: "relative" },
  inlineImage: { width: 100, height: 100, borderRadius: radius.md },
  inlineImageRemove: { position: "absolute", top: -4, right: -4 },
  addPhotoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 10,
    marginBottom: 4,
  },
  addPhotoText: { fontSize: 15 },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingTop: 12,
    marginTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  metaRowText: { flex: 1, fontSize: 14 },
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0, 0, 0, 0)",
  },
  detailsSheet: {
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingTop: 12,
    maxHeight: "70%",
  },
  detailsHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 16,
  },
  detailsContent: { paddingHorizontal: PADDING_H, gap: 20 },
  detailsRow: { gap: 10 },
  detailsRowLabel: { fontSize: 13, fontWeight: "600" },
  detailsRowOptions: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  detailsPill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
  },
  detailsPillText: {
    fontSize: 14,
    fontWeight: "500",
    textTransform: "capitalize",
  },
  detailsRowTags: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 8,
  },
  detailsTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingLeft: 10,
    paddingVertical: 6,
    paddingRight: 6,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
  },
  detailsTagText: { fontSize: 14 },
  detailsTagInputRow: { flexDirection: "row", gap: 8, alignItems: "center" },
  detailsTagInput: {
    minWidth: 100,
    fontSize: 15,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
  },
  detailsAddTagBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.lg,
  },
  detailsAddTagBtnText: { fontSize: 14, fontWeight: "600" },
  aiBlock: {
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  aiBlockHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  aiBlockTitle: { fontSize: 16, fontWeight: "700" },
  aiSkeleton: { paddingVertical: 12, gap: 8 },
  aiSkeletonLine: {
    height: 14,
    borderRadius: 4,
    width: "90%",
  },
  aiSkeletonLineShort: { width: "60%" },
  aiSkeletonText: { fontSize: 13, marginTop: 4 },
  aiErrorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },
  aiErrorText: { flex: 1, fontSize: 14 },
  aiRetryBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.lg,
  },
  aiRetryBtnText: { fontSize: 14, fontWeight: "600" },
  aiSummary: { fontSize: 15, lineHeight: 22, marginBottom: 10 },
  aiPillsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 8,
  },
  aiPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.md,
  },
  aiPillText: { fontSize: 13, fontWeight: "500" },
  aiScore: { fontSize: 13, marginBottom: 12 },
  aiActionsRow: { flexDirection: "row", gap: 10, marginTop: 4 },
  aiActionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: radius.lg,
  },
  aiActionBtnText: { fontSize: 14, fontWeight: "600" },
  goDeeperTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 4,
    paddingHorizontal: PADDING_H,
  },
  goDeeperSubtitle: {
    fontSize: 13,
    marginBottom: 16,
    paddingHorizontal: PADDING_H,
  },
  goDeeperList: { maxHeight: 320, paddingHorizontal: PADDING_H },
  goDeeperItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: radius.lg,
    borderWidth: 1,
    marginBottom: 8,
  },
  goDeeperItemText: { flex: 1, fontSize: 15, lineHeight: 22 },
  goDeeperCloseBtn: {
    marginTop: 16,
    marginHorizontal: PADDING_H,
    paddingVertical: 12,
    borderRadius: radius.lg,
    borderWidth: 1,
    alignItems: "center",
  },
  goDeeperCloseBtnText: { fontSize: 16, fontWeight: "600" },
});
