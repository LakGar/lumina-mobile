import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";

import { getEntryListTitle, getEntryPreview } from "@/constants/mock-journals";
import { radius } from "@/constants/theme";
import { useApi } from "@/hooks/use-api";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useThemeColors } from "@/hooks/use-theme-colors";
import type { EntrySortOption, Journal, JournalEntry } from "@/lib/api";
import { formatEntryListTime } from "@/utils/date";
import Ionicons from "@expo/vector-icons/Ionicons";
import * as Haptics from "expo-haptics";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const PADDING_H = 20;
const LIST_PADDING_BOTTOM = 100;

const SORT_OPTIONS: { key: EntrySortOption; label: string }[] = [
  { key: "newest", label: "Newest" },
  { key: "oldest", label: "Oldest" },
  { key: "lastEdited", label: "Last edited" },
];

export default function JournalDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const api = useApi();

  const [journal, setJournal] = useState<Journal | null>(null);
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sort, setSort] = useState<EntrySortOption>("newest");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortMenuVisible, setSortMenuVisible] = useState(false);
  const [creating, setCreating] = useState(false);

  const loadJournalAndEntries = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const [j, { entries: list }] = await Promise.all([
        api.fetchJournal(id),
        api.fetchJournalEntries(id, { sort }),
      ]);
      setJournal(j ?? null);
      setEntries(list);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [id, sort, api]);

  const loadJournalAndEntriesRef = useRef(loadJournalAndEntries);
  loadJournalAndEntriesRef.current = loadJournalAndEntries;
  useFocusEffect(
    useCallback(() => {
      loadJournalAndEntriesRef.current();
    }, []),
  );

  const filteredEntries = useMemo(() => {
    if (!searchQuery.trim()) return entries;
    const q = searchQuery.trim().toLowerCase();
    return entries.filter((e) => {
      const title = getEntryListTitle(e);
      const preview = getEntryPreview(e.body);
      return (
        title.toLowerCase().includes(q) || preview.toLowerCase().includes(q)
      );
    });
  }, [entries, searchQuery]);

  const goBack = () => router.back();

  const creatingRef = useRef(false);
  const onCreateEntry = useCallback(async () => {
    if (!id) return;
    if (creatingRef.current) return;
    creatingRef.current = true;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCreating(true);
    try {
      const newEntry = await api.createEntry(id, { content: "." });
      router.push({
        pathname: "/(home)/entry/[entryId]",
        params: { entryId: newEntry.id, journalId: id },
      });
    } catch {
      setCreating(false);
      creatingRef.current = false;
    } finally {
      creatingRef.current = false;
    }
  }, [id, router, api]);

  if (!id) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText style={styles.notFound}>Journal not found.</ThemedText>
        <Pressable onPress={goBack}>
          <ThemedText style={{ color: colors.primary }}>Go back</ThemedText>
        </Pressable>
      </ThemedView>
    );
  }

  if (loading && !journal) {
    return (
      <ThemedView style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <ThemedText style={{ color: colors.mutedForeground, marginTop: 12 }}>
          Loading…
        </ThemedText>
      </ThemedView>
    );
  }

  if (error && !journal) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText style={styles.notFound}>{error}</ThemedText>
        <Pressable onPress={goBack}>
          <ThemedText style={{ color: colors.primary }}>Go back</ThemedText>
        </Pressable>
      </ThemedView>
    );
  }

  if (!journal) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText style={styles.notFound}>Journal not found.</ThemedText>
        <Pressable onPress={goBack}>
          <ThemedText style={{ color: colors.primary }}>Go back</ThemedText>
        </Pressable>
      </ThemedView>
    );
  }

  const renderRow = ({
    item: entry,
  }: {
    item: (typeof filteredEntries)[0];
  }) => {
    const listTitle = getEntryListTitle(entry);
    const preview = getEntryPreview(entry.body);
    const listTime = formatEntryListTime(
      new Date(entry.updatedAt ?? entry.createdAt),
    );
    return (
      <Pressable
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          router.push({
            pathname: "/(home)/entry/[entryId]",
            params: { entryId: entry.id, journalId: id },
          });
        }}
        style={({ pressed }) => [
          styles.entryRow,
          { borderBottomColor: colors.border },
          pressed && { opacity: 0.7 },
        ]}
      >
        <View style={styles.entryRowMain}>
          <Text
            style={[styles.entryRowTitle, { color: colors.foreground }]}
            numberOfLines={1}
          >
            {listTitle}
          </Text>
          <Text
            style={[styles.entryRowPreview, { color: colors.mutedForeground }]}
            numberOfLines={2}
          >
            {preview || "No content"}
          </Text>
        </View>
        <View style={styles.entryRowRight}>
          <Text
            style={[styles.entryRowTime, { color: colors.mutedForeground }]}
            numberOfLines={1}
          >
            {listTime}
          </Text>
          {entry.mood ? (
            <View
              style={[styles.moodDot, { backgroundColor: colors.primary }]}
            />
          ) : null}
        </View>
      </Pressable>
    );
  };

  return (
    <ThemedView style={styles.container}>
      <View
        style={[
          styles.header,
          {
            paddingTop: insets.top + 8,
            paddingBottom: 8,
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
          <ThemedText style={styles.headerTitle} numberOfLines={1}>
            {journal.title}
          </ThemedText>
        </View>
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setSortMenuVisible((v) => !v);
          }}
          style={({ pressed }) => [
            styles.sortButton,
            pressed && { opacity: 0.7 },
          ]}
          accessibilityLabel="Sort"
        >
          <Ionicons
            name="ellipsis-horizontal"
            size={22}
            color={colors.foreground}
          />
        </Pressable>
      </View>

      <View
        style={[
          styles.searchWrap,
          {
            paddingHorizontal: PADDING_H,
            paddingVertical: 8,
            backgroundColor: colors.background,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <View
          style={[
            styles.searchBar,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
            },
          ]}
        >
          <Ionicons
            name="search"
            size={18}
            color={colors.mutedForeground}
            style={styles.searchIcon}
          />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search in this journal"
            placeholderTextColor={colors.mutedForeground}
            style={[styles.searchInput, { color: colors.foreground }]}
            returnKeyType="search"
          />
        </View>
        {sortMenuVisible ? (
          <View
            style={[
              styles.sortMenu,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
              },
            ]}
          >
            {SORT_OPTIONS.map((opt) => (
              <Pressable
                key={opt.key}
                onPress={() => {
                  setSort(opt.key);
                  setSortMenuVisible(false);
                }}
                style={({ pressed }) => [
                  styles.sortMenuItem,
                  pressed && { opacity: 0.7 },
                ]}
              >
                <Text
                  style={[styles.sortMenuLabel, { color: colors.foreground }]}
                >
                  {opt.label}
                </Text>
                {sort === opt.key ? (
                  <Ionicons name="checkmark" size={18} color={colors.primary} />
                ) : null}
              </Pressable>
            ))}
          </View>
        ) : null}
      </View>

      {filteredEntries.length === 0 ? (
        <View
          style={[
            styles.empty,
            {
              paddingTop: 48,
              paddingBottom: insets.bottom + 24,
            },
          ]}
        >
          <Ionicons
            name="document-text-outline"
            size={48}
            color={colors.mutedForeground}
          />
          <ThemedText
            style={[styles.emptyText, { color: colors.mutedForeground }]}
          >
            No entries yet
          </ThemedText>
          <Pressable
            onPress={onCreateEntry}
            disabled={creating}
            style={({ pressed }) => [
              styles.createButton,
              { backgroundColor: colors.primary },
              pressed && !creating && { opacity: 0.9 },
            ]}
          >
            {creating ? (
              <ActivityIndicator
                size="small"
                color={colors.primaryForeground}
              />
            ) : (
              <Text
                style={[
                  styles.createButtonLabel,
                  { color: colors.primaryForeground },
                ]}
              >
                Create entry
              </Text>
            )}
          </Pressable>
        </View>
      ) : (
        <>
          <FlatList
            data={filteredEntries}
            keyExtractor={(item) => item.id}
            renderItem={renderRow}
            contentContainerStyle={{
              paddingBottom: insets.bottom + LIST_PADDING_BOTTOM,
            }}
            style={styles.list}
          />
          <View
            style={[
              styles.fabWrap,
              {
                paddingBottom: insets.bottom + 16,
              },
            ]}
            pointerEvents="box-none"
          >
            <Pressable
              onPress={onCreateEntry}
              disabled={creating}
              style={({ pressed }) => [
                styles.fab,
                { backgroundColor: colors.primary },
                pressed && !creating && { opacity: 0.9 },
              ]}
              accessibilityLabel="Create entry"
            >
              {creating ? (
                <ActivityIndicator
                  size="small"
                  color={colors.primaryForeground}
                />
              ) : (
                <Ionicons
                  name="add"
                  size={28}
                  color={colors.primaryForeground}
                />
              )}
            </Pressable>
          </View>
        </>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { justifyContent: "center", alignItems: "center" },
  notFound: { padding: 20 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backButton: { padding: 4, marginRight: 8 },
  headerCenter: { flex: 1, minWidth: 0 },
  headerTitle: { fontSize: 18, fontWeight: "700" },
  headerRight: { width: 32 },
  sortButton: { padding: 4 },
  searchWrap: { borderBottomWidth: StyleSheet.hairlineWidth },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    height: 40,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 12,
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, fontSize: 16, paddingVertical: 8 },
  sortMenu: {
    marginTop: 8,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
  },
  sortMenuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  sortMenuLabel: { fontSize: 16 },
  list: { flex: 1 },
  entryRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: PADDING_H,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  entryRowMain: { flex: 1, minWidth: 0 },
  entryRowTitle: { fontSize: 17, fontWeight: "600", marginBottom: 4 },
  entryRowPreview: { fontSize: 14, lineHeight: 20 },
  entryRowRight: {
    alignItems: "flex-end",
    gap: 6,
    minWidth: 70,
  },
  entryRowTime: { fontSize: 13 },
  moodDot: { width: 8, height: 8, borderRadius: 4 },
  empty: {
    alignItems: "center",
    gap: 16,
  },
  emptyText: { fontSize: 17 },
  createButton: {
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: radius.lg,
  },
  createButtonLabel: { fontSize: 17, fontWeight: "600" },
  fabWrap: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
  },
});
