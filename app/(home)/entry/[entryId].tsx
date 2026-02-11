import { ThemedView } from "@/components/themed-view";
import { LEXICAL_EDITOR_HTML } from "@/constants/lexical-editor-html";
import { getEntryById, setEntryOverride } from "@/constants/mock-journals";
import { Colors, radius } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import Ionicons from "@expo/vector-icons/Ionicons";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
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
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";

const PADDING_H = 16;
const AUTO_SAVE_DEBOUNCE_MS = 1000;

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

/** If body is plain text (legacy), wrap for Quill. Otherwise use as HTML. */
function bodyForEditor(body: string | undefined): string {
  if (!body || !body.trim()) return "<p><br></p>";
  if (body.trimStart().startsWith("<")) return body;
  return (
    "<p>" +
    body
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\n/g, "</p><p>") +
    "</p>"
  );
}

/** Strip HTML for plain-text editing fallback */
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
  const { entryId } = useLocalSearchParams<{
    entryId: string;
    journalId?: string;
  }>();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const insets = useSafeAreaInsets();

  const entry = entryId ? getEntryById(entryId) : undefined;

  const [title, setTitle] = useState(entry?.title ?? "");
  const [body, setBody] = useState(entry?.body ?? "");
  const [mood, setMood] = useState(entry?.mood ?? "");
  const [tags, setTags] = useState<string[]>(entry?.tags ?? []);
  const [images, setImages] = useState<string[]>(entry?.images ?? []);
  const [saveStatus, setSaveStatus] = useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");
  const [editorFocused, setEditorFocused] = useState(false);
  const [editorReady, setEditorReady] = useState(false);
  const [detailsVisible, setDetailsVisible] = useState(false);
  const [tagInputValue, setTagInputValue] = useState("");

  const webViewRef = useRef<WebView>(null);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const initialContentSet = useRef(false);

  useEffect(() => {
    if (entry) {
      setTitle(entry.title ?? "");
      setBody(entry.body ?? "");
      setMood(entry.mood ?? "");
      setTags(entry.tags ?? []);
      setImages(entry.images ?? []);
    }
  }, [entry?.id]);

  const performSave = useCallback(() => {
    if (!entryId) return;
    setSaveStatus("saving");
    setEntryOverride(entryId, {
      title: title.trim() || undefined,
      body: body.trim() || undefined,
      mood: mood.trim() || undefined,
      tags: tags.length > 0 ? tags : undefined,
      images: images.length > 0 ? images : undefined,
      updatedAt: new Date().toISOString(),
    });
    setSaveStatus("saved");
    const t = setTimeout(() => setSaveStatus("idle"), 2000);
    return () => clearTimeout(t);
  }, [entryId, title, body, mood, tags, images]);

  const scheduleSave = useCallback(() => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      saveTimeoutRef.current = null;
      performSave();
    }, AUTO_SAVE_DEBOUNCE_MS);
  }, [performSave]);

  useEffect(() => {
    scheduleSave();
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = null;
      }
    };
  }, [title, body, mood, tags, images, scheduleSave]);

  useEffect(() => {
    return () => {
      performSave();
    };
  }, [performSave]);

  const goBack = useCallback(() => {
    performSave();
    router.back();
  }, [performSave, router]);

  const handleWebViewMessage = useCallback(
    (event: { nativeEvent: { data: string } }) => {
      try {
        const msg = JSON.parse(event.nativeEvent.data);
        if (msg.type === "ready") {
          setEditorReady(true);
          const initial = bodyForEditor(body);
          const payload = JSON.stringify(initial);
          webViewRef.current?.injectJavaScript(
            `(function(){ try { window.__editorCommand('setContent', ${payload}); } catch(e){} })(); true;`,
          );
          initialContentSet.current = true;
        } else if (msg.type === "focus") setEditorFocused(true);
        else if (msg.type === "blur") setEditorFocused(false);
        else if (msg.type === "content" && msg.html !== undefined) {
          setBody(msg.html);
          scheduleSave();
        }
      } catch (_) {}
    },
    [body, scheduleSave],
  );

  const runEditorCommand = useCallback((cmd: string, value?: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const arg = value !== undefined ? `, ${JSON.stringify(value)}` : "";
    webViewRef.current?.injectJavaScript(
      `(function(){ try { window.__editorCommand('${cmd}'${arg}); } catch(e){} })(); true;`,
    );
  }, []);

  const addTag = useCallback(() => {
    const t = tagInputValue.trim().replace(/^#/, "");
    if (t && !tags.includes(t)) {
      setTags((prev) => [...prev, t]);
      setTagInputValue("");
      scheduleSave();
    }
  }, [tagInputValue, tags, scheduleSave]);

  const removeTag = useCallback(
    (tag: string) => {
      setTags((prev) => prev.filter((t) => t !== tag));
      scheduleSave();
    },
    [scheduleSave],
  );

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
      runEditorCommand("insertImage", uri);
      setImages((prev) => (prev.includes(uri) ? prev : [...prev, uri]));
      scheduleSave();
    }
  }, [runEditorCommand, scheduleSave]);

  if (!entryId || !entry) {
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
              paddingBottom: insets.bottom + (editorFocused ? 120 : 24),
            },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <TextInput
            style={[styles.titleInput, { color: colors.foreground }]}
            placeholder="Title"
            placeholderTextColor={colors.mutedForeground}
            value={title}
            onChangeText={(t) => {
              setTitle(t);
              scheduleSave();
            }}
            maxLength={200}
            returnKeyType="next"
            onSubmitEditing={() => runEditorCommand("focus")}
            blurOnSubmit={false}
          />

          {/* Body editor right below title so it's at the top of the entry area */}
          <Text style={[styles.bodyLabel, { color: colors.mutedForeground }]}>
            Body
          </Text>
          <View
            style={[
              styles.webViewContainer,
              {
                backgroundColor: colors.popover ?? colors.card,
                borderColor: colors.border,
              },
            ]}
          >
            <WebView
              ref={webViewRef}
              source={{ html: LEXICAL_EDITOR_HTML }}
              originWhitelist={["*"]}
              style={[
                styles.webViewBody,
                { backgroundColor: colors.popover ?? colors.card },
              ]}
              scrollEnabled={true}
              onMessage={handleWebViewMessage}
              javaScriptEnabled={true}
              domStorageEnabled={true}
              keyboardDisplayRequiresUserAction={false}
              onLoadEnd={() => {
                if (!initialContentSet.current) {
                  const initial = bodyForEditor(body);
                  const payload = JSON.stringify(initial);
                  webViewRef.current?.injectJavaScript(
                    `(function(){ try { window.__editorCommand('setContent', ${payload}); } catch(e){} })(); true;`,
                  );
                  initialContentSet.current = true;
                }
              }}
            />
          </View>

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
                      scheduleSave();
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
        </ScrollView>

        {editorFocused ? (
          <View
            style={[
              styles.formatBarWrapper,
              {
                borderTopColor: colors.border,
                paddingBottom: insets.bottom + 8,
              },
            ]}
          >
            <BlurView
              intensity={70}
              tint={colorScheme === "dark" ? "dark" : "light"}
              style={StyleSheet.absoluteFill}
            />
            <View
              style={[styles.formatBar, { backgroundColor: "transparent" }]}
              pointerEvents="box-none"
            >
              <Pressable
                onPress={() => runEditorCommand("bold")}
                style={({ pressed }) => [
                  styles.formatBtn,
                  pressed && { opacity: 0.7 },
                ]}
                accessibilityLabel="Bold"
              >
                <Text
                  style={[
                    styles.formatIcon,
                    { color: colors.foreground, fontWeight: "700" },
                  ]}
                >
                  B
                </Text>
              </Pressable>
              <Pressable
                onPress={() => runEditorCommand("italic")}
                style={({ pressed }) => [
                  styles.formatBtn,
                  pressed && { opacity: 0.7 },
                ]}
                accessibilityLabel="Italic"
              >
                <Text
                  style={[
                    styles.formatIcon,
                    {
                      color: colors.foreground,
                      fontStyle: "italic",
                      fontWeight: "600",
                    },
                  ]}
                >
                  I
                </Text>
              </Pressable>
              <Pressable
                onPress={() => runEditorCommand("underline")}
                style={({ pressed }) => [
                  styles.formatBtn,
                  pressed && { opacity: 0.7 },
                ]}
                accessibilityLabel="Underline"
              >
                <Text
                  style={[
                    styles.formatIcon,
                    {
                      color: colors.foreground,
                      textDecorationLine: "underline",
                    },
                  ]}
                >
                  U
                </Text>
              </Pressable>
              <View
                style={[
                  styles.formatBarDivider,
                  { backgroundColor: colors.border },
                ]}
              />
              <Pressable
                onPress={() => runEditorCommand("bulletList")}
                style={({ pressed }) => [
                  styles.formatBtn,
                  pressed && { opacity: 0.7 },
                ]}
                accessibilityLabel="Bullet list"
              >
                <Text style={[styles.formatIcon, { color: colors.foreground }]}>
                  •
                </Text>
              </Pressable>
              <Pressable
                onPress={() => runEditorCommand("orderedList")}
                style={({ pressed }) => [
                  styles.formatBtn,
                  pressed && { opacity: 0.7 },
                ]}
                accessibilityLabel="Numbered list"
              >
                <Text style={[styles.formatIcon, { color: colors.foreground }]}>
                  1.
                </Text>
              </Pressable>
              <Pressable
                onPress={() => runEditorCommand("checklist")}
                style={({ pressed }) => [
                  styles.formatBtn,
                  pressed && { opacity: 0.7 },
                ]}
                accessibilityLabel="Checklist"
              >
                <Text style={[styles.formatIcon, { color: colors.foreground }]}>
                  ☐
                </Text>
              </Pressable>
              <View
                style={[
                  styles.formatBarDivider,
                  { backgroundColor: colors.border },
                ]}
              />
              <Pressable
                onPress={() => runEditorCommand("undo")}
                style={({ pressed }) => [
                  styles.formatBtn,
                  pressed && { opacity: 0.7 },
                ]}
                accessibilityLabel="Undo"
              >
                <Ionicons
                  name="arrow-undo"
                  size={20}
                  color={colors.foreground}
                />
              </Pressable>
              <Pressable
                onPress={() => runEditorCommand("redo")}
                style={({ pressed }) => [
                  styles.formatBtn,
                  pressed && { opacity: 0.7 },
                ]}
                accessibilityLabel="Redo"
              >
                <Ionicons
                  name="arrow-redo"
                  size={20}
                  color={colors.foreground}
                />
              </Pressable>
              <View
                style={[
                  styles.formatBarDivider,
                  { backgroundColor: colors.border },
                ]}
              />
              <Pressable
                onPress={pickImage}
                style={({ pressed }) => [
                  styles.formatBtn,
                  pressed && { opacity: 0.7 },
                ]}
                accessibilityLabel="Add photo"
              >
                <Ionicons
                  name="image-outline"
                  size={22}
                  color={colors.foreground}
                />
              </Pressable>
            </View>
          </View>
        ) : null}
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
                        scheduleSave();
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
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
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
  titleInput: {
    fontSize: 28,
    fontWeight: "600",
    paddingVertical: 4,
    paddingHorizontal: 0,
    marginBottom: 4,
  },
  bodyLabel: {
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  webViewContainer: {
    height: 280,
    marginBottom: 8,
    borderRadius: radius.md,
    borderWidth: 1,
    overflow: "hidden",
  },
  webViewBody: {
    height: 280,
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
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingTop: 12,
    marginTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  metaRowText: { flex: 1, fontSize: 14 },
  formatBarWrapper: {
    overflow: "hidden",
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  formatBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    gap: 4,
  },
  formatBtn: { padding: 8 },
  formatIcon: { fontSize: 18 },
  formatBarDivider: { width: 1, height: 20, marginHorizontal: 4 },
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
});
