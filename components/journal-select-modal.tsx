import { Colors, radius, Shadows } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import type { Journal } from "@/lib/api";
import Ionicons from "@expo/vector-icons/Ionicons";
import * as Haptics from "expo-haptics";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { ThemedText } from "./themed-text";

export type JournalSelectModalProps = {
  visible: boolean;
  onClose: () => void;
  onSelectJournal: (journalId: string) => void;
  onCreateNewJournal: () => void;
  fetchJournals: () => Promise<Journal[]>;
};

export function JournalSelectModal({
  visible,
  onClose,
  onSelectJournal,
  onCreateNewJournal,
  fetchJournals,
}: JournalSelectModalProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const [journals, setJournals] = useState<Journal[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await fetchJournals();
      setJournals(list);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load journals");
    } finally {
      setLoading(false);
    }
  }, [fetchJournals]);

  useEffect(() => {
    if (visible) load();
  }, [visible, load]);

  const handleSelect = useCallback(
    (journalId: string) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onClose();
      onSelectJournal(journalId);
    },
    [onClose, onSelectJournal],
  );

  const handleCreateNew = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onClose();
    onCreateNewJournal();
  }, [onClose, onCreateNewJournal]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable
        style={[styles.backdrop, { backgroundColor: "rgba(0,0,0,0.5)" }]}
        onPress={onClose}
      >
        <Pressable
          style={[styles.sheet, { backgroundColor: colors.background }]}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={styles.header}>
            <ThemedText
              type="subtitle"
              style={[styles.title, { color: colors.foreground }]}
            >
              Select a journal
            </ThemedText>
            <Pressable
              onPress={onClose}
              hitSlop={12}
              style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
            >
              <Ionicons name="close" size={24} color={colors.foreground} />
            </Pressable>
          </View>

          {loading ? (
            <View style={styles.centered}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text
                style={[styles.loadingText, { color: colors.mutedForeground }]}
              >
                Loading journals…
              </Text>
            </View>
          ) : error ? (
            <View style={styles.centered}>
              <Text style={[styles.errorText, { color: colors.destructive }]}>
                {error}
              </Text>
              <Pressable
                onPress={load}
                style={[styles.retryBtn, { backgroundColor: colors.primary }]}
              >
                <Text
                  style={[
                    styles.retryBtnText,
                    { color: colors.primaryForeground },
                  ]}
                >
                  Retry
                </Text>
              </Pressable>
            </View>
          ) : journals.length === 0 ? (
            <View style={styles.centered}>
              <Ionicons
                name="journal-outline"
                size={48}
                color={colors.mutedForeground}
              />
              <ThemedText
                style={[styles.emptyText, { color: colors.mutedForeground }]}
              >
                No journals yet
              </ThemedText>
              <Pressable
                onPress={handleCreateNew}
                style={[
                  styles.createBtn,
                  { backgroundColor: colors.primary },
                  Shadows.sm,
                ]}
              >
                <Ionicons
                  name="add"
                  size={20}
                  color={colors.primaryForeground}
                />
                <Text
                  style={[
                    styles.createBtnText,
                    { color: colors.primaryForeground },
                  ]}
                >
                  Create journal
                </Text>
              </Pressable>
            </View>
          ) : (
            <>
              <View style={styles.list}>
                {journals.map((j) => (
                  <Pressable
                    key={j.id}
                    onPress={() => handleSelect(j.id)}
                    style={({ pressed }) => [
                      styles.row,
                      {
                        backgroundColor: colors.card,
                        borderColor: colors.border,
                      },
                      pressed && { opacity: 0.85 },
                      Shadows.xs,
                    ]}
                  >
                    <Ionicons
                      name="book-outline"
                      size={22}
                      color={colors.primary}
                    />
                    <Text
                      style={[styles.rowLabel, { color: colors.foreground }]}
                      numberOfLines={1}
                    >
                      {j.title}
                    </Text>
                    <Ionicons
                      name="chevron-forward"
                      size={18}
                      color={colors.mutedForeground}
                    />
                  </Pressable>
                ))}
              </View>
              <Pressable
                onPress={handleCreateNew}
                style={({ pressed }) => [
                  styles.footerBtn,
                  { borderColor: colors.border },
                  pressed && { opacity: 0.85 },
                ]}
              >
                <Ionicons
                  name="add-circle-outline"
                  size={20}
                  color={colors.primary}
                />
                <Text style={[styles.footerBtnText, { color: colors.primary }]}>
                  Create new journal
                </Text>
              </Pressable>
            </>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: "flex-end",
  },
  sheet: {
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    maxHeight: "80%",
    paddingBottom: 32,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(0,0,0,0.08)",
  },
  title: {
    fontSize: 18,
  },
  centered: {
    paddingVertical: 32,
    alignItems: "center",
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
  },
  errorText: {
    fontSize: 14,
    textAlign: "center",
  },
  retryBtn: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: radius.lg,
  },
  retryBtnText: {
    fontSize: 15,
    fontWeight: "600",
  },
  emptyText: {
    fontSize: 15,
  },
  createBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: radius.lg,
  },
  createBtnText: {
    fontSize: 16,
    fontWeight: "600",
  },
  list: {
    gap: 8,
    maxHeight: 320,
    paddingVertical: 12,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  rowLabel: {
    flex: 1,
    fontSize: 16,
    fontWeight: "500",
  },
  footerBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.lg,
    marginTop: 8,
  },
  footerBtnText: {
    fontSize: 15,
    fontWeight: "600",
  },
});
