import {
  getEntriesForJournal,
  getEntryListTitle,
  type Journal,
  type JournalEntry,
} from "@/constants/mock-journals";
import { MOCK_JOURNALS } from "@/constants/mock-journals";
import { Colors, radius } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import Ionicons from "@expo/vector-icons/Ionicons";
import * as Haptics from "expo-haptics";
import React, { useMemo, useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export type ContextAttachment =
  | { type: "journal"; journal: Journal }
  | { type: "entry"; journal: Journal; entry: JournalEntry };

type Step = "pick_type" | "pick_journal" | "pick_entry";

type ChatAddContextSheetProps = {
  visible: boolean;
  onClose: () => void;
  onAddContext: (attachment: ContextAttachment) => void;
};

export function ChatAddContextSheet({
  visible,
  onClose,
  onAddContext,
}: ChatAddContextSheetProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState<Step>("pick_type");
  const [addType, setAddType] = useState<"journal" | "entry">("journal");
  const [pickedJournal, setPickedJournal] = useState<Journal | null>(null);

  const entries = useMemo(() => {
    if (!pickedJournal) return [];
    return getEntriesForJournal(pickedJournal.id);
  }, [pickedJournal]);

  const handlePickType = (type: "journal" | "entry") => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setAddType(type);
    setStep("pick_journal");
  };

  const handlePickJournal = (journal: Journal) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (addType === "journal") {
      onAddContext({ type: "journal", journal });
      resetAndClose();
    } else {
      setPickedJournal(journal);
      setStep("pick_entry");
    }
  };

  const handlePickEntry = (entry: JournalEntry) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (pickedJournal) {
      onAddContext({ type: "entry", journal: pickedJournal, entry });
      resetAndClose();
    }
  };

  const resetAndClose = () => {
    setStep("pick_type");
    setAddType("journal");
    setPickedJournal(null);
    onClose();
  };

  const goBack = () => {
    if (step === "pick_entry" && pickedJournal) {
      setPickedJournal(null);
      setStep("pick_journal");
    } else {
      setStep("pick_type");
      setPickedJournal(null);
    }
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={resetAndClose}
    >
      <Pressable style={styles.overlay} onPress={resetAndClose}>
        <Pressable
          style={[styles.sheet, { backgroundColor: colors.background }]}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={[styles.handle, { backgroundColor: colors.border }]} />
          <View style={styles.headerRow}>
            {(step !== "pick_type") && (
              <Pressable
                onPress={goBack}
                style={({ pressed }) => [styles.backBtn, pressed && styles.pressed]}
                hitSlop={8}
              >
                <Ionicons name="chevron-back" size={24} color={colors.foreground} />
              </Pressable>
            )}
            <Text style={[styles.sheetTitle, { color: colors.foreground }]}>
              {step === "pick_type" && "Add context"}
              {step === "pick_journal" && "Choose journal"}
              {step === "pick_entry" && pickedJournal && `Entry from ${pickedJournal.title}`}
            </Text>
          </View>

          {step === "pick_type" && (
            <View style={styles.actions}>
              <Pressable
                onPress={() => handlePickType("journal")}
                style={({ pressed }) => [
                  styles.actionRow,
                  { borderBottomColor: colors.border },
                  pressed && styles.pressed,
                ]}
              >
                <View style={[styles.actionIconWrap, { backgroundColor: colors.muted }]}>
                  <Ionicons name="book-outline" size={22} color={colors.foreground} />
                </View>
                <View style={styles.actionText}>
                  <Text style={[styles.actionLabel, { color: colors.foreground }]}>
                    Journal
                  </Text>
                  <Text style={[styles.actionSublabel, { color: colors.mutedForeground }]}>
                    Add a whole journal as context
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.mutedForeground} />
              </Pressable>
              <Pressable
                onPress={() => handlePickType("entry")}
                style={({ pressed }) => [
                  styles.actionRow,
                  { borderBottomColor: colors.border },
                  pressed && styles.pressed,
                ]}
              >
                <View style={[styles.actionIconWrap, { backgroundColor: colors.muted }]}>
                  <Ionicons name="document-text-outline" size={22} color={colors.foreground} />
                </View>
                <View style={styles.actionText}>
                  <Text style={[styles.actionLabel, { color: colors.foreground }]}>
                    Entry
                  </Text>
                  <Text style={[styles.actionSublabel, { color: colors.mutedForeground }]}>
                    Add a specific entry as context
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.mutedForeground} />
              </Pressable>
            </View>
          )}

          {step === "pick_journal" && (
            <ScrollView
              style={styles.list}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
            >
              {MOCK_JOURNALS.map((journal) => (
                <Pressable
                  key={journal.id}
                  onPress={() => handlePickJournal(journal)}
                  style={({ pressed }) => [
                    styles.listRow,
                    { borderBottomColor: colors.border },
                    pressed && styles.pressed,
                  ]}
                >
                  <View style={[styles.actionIconWrap, { backgroundColor: colors.muted }]}>
                    <Ionicons name="journal-outline" size={20} color={colors.primary} />
                  </View>
                  <Text style={[styles.actionLabel, { color: colors.foreground }]} numberOfLines={1}>
                    {journal.title}
                  </Text>
                  <Ionicons name="add-circle-outline" size={22} color={colors.primary} />
                </Pressable>
              ))}
            </ScrollView>
          )}

          {step === "pick_entry" && pickedJournal && (
            <ScrollView
              style={styles.list}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
            >
              {entries.length === 0 ? (
                <Text style={[styles.emptyList, { color: colors.mutedForeground }]}>
                  No entries in this journal.
                </Text>
              ) : (
                entries.map((entry) => (
                  <Pressable
                    key={entry.id}
                    onPress={() => handlePickEntry(entry)}
                    style={({ pressed }) => [
                      styles.listRow,
                      { borderBottomColor: colors.border },
                      pressed && styles.pressed,
                    ]}
                  >
                    <View style={[styles.actionIconWrap, { backgroundColor: colors.muted }]}>
                      <Ionicons name="document-text-outline" size={20} color={colors.foreground} />
                    </View>
                    <Text style={[styles.actionLabel, { color: colors.foreground }]} numberOfLines={1}>
                      {getEntryListTitle(entry)}
                    </Text>
                    <Ionicons name="add-circle-outline" size={22} color={colors.primary} />
                  </Pressable>
                ))
              )}
            </ScrollView>
          )}

          <View style={{ height: insets.bottom + 16 }} />
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  sheet: {
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingTop: 12,
    paddingHorizontal: 16,
    maxHeight: "80%",
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 12,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  backBtn: {
    padding: 4,
    marginRight: 8,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  actions: {},
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  actionIconWrap: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  actionText: { flex: 1, minWidth: 0 },
  actionLabel: { fontSize: 16, fontWeight: "600" },
  actionSublabel: { fontSize: 13, marginTop: 2 },
  pressed: { opacity: 0.7 },
  list: { maxHeight: 320 },
  listContent: { paddingBottom: 8 },
  listRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  emptyList: {
    paddingVertical: 24,
    textAlign: "center",
  },
});
