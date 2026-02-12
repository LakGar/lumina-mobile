import TabHeader from "@/components/tab-header";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Colors, radius } from "@/constants/theme";
import { useApi } from "@/hooks/use-api";
import { useColorScheme } from "@/hooks/use-color-scheme";
import type { Journal } from "@/lib/api";
import { formatUpdatedShort } from "@/utils/date";
import { SignedIn } from "@clerk/clerk-expo";
import Ionicons from "@expo/vector-icons/Ionicons";
import * as Haptics from "expo-haptics";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const HEADER_HEIGHT = 100;
const SEARCH_BAR_HEIGHT = 52;
const TOP_TOTAL = HEADER_HEIGHT + SEARCH_BAR_HEIGHT;
const PADDING_H = 20;
const LIST_PADDING_BOTTOM = 120;

export default function JournalsScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const api = useApi();
  const [searchQuery, setSearchQuery] = useState("");
  const [journals, setJournals] = useState<Journal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadJournals = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await api.fetchJournals();
      setJournals(list);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load journals");
    } finally {
      setLoading(false);
    }
  }, [api]);

  const loadJournalsRef = useRef(loadJournals);
  loadJournalsRef.current = loadJournals;

  useFocusEffect(
    useCallback(() => {
      loadJournalsRef.current();
    }, []),
  );

  const filteredJournals = useMemo(() => {
    if (!searchQuery.trim()) return journals;
    const q = searchQuery.trim().toLowerCase();
    return journals.filter(
      (j) =>
        j.title.toLowerCase().includes(q) ||
        (j.description?.toLowerCase().includes(q) ?? false),
    );
  }, [journals, searchQuery]);

  const onAdd = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push("/(home)/create-journal");
  };

  const onJournalPress = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(`/(home)/journal/${id}`);
  };

  return (
    <ThemedView style={styles.container}>
      <SignedIn>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[
            styles.scrollContent,
            {
              paddingTop: insets.top + TOP_TOTAL,
              paddingBottom: LIST_PADDING_BOTTOM,
            },
          ]}
          showsVerticalScrollIndicator={true}
        >
          <View style={styles.listHeader}>
            <ThemedText
              style={[styles.subtitle, { color: colors.mutedForeground }]}
            >
              {filteredJournals.length} journal
              {filteredJournals.length !== 1 ? "s" : ""}
            </ThemedText>
          </View>
          {loading ? (
            <View style={styles.empty}>
              <ActivityIndicator size="large" color={colors.primary} />
              <ThemedText
                style={[styles.emptyText, { color: colors.mutedForeground }]}
              >
                Loading journals…
              </ThemedText>
            </View>
          ) : error ? (
            <View style={styles.empty}>
              <Ionicons
                name="alert-circle-outline"
                size={48}
                color={colors.destructive}
              />
              <ThemedText
                style={[styles.emptyText, { color: colors.mutedForeground }]}
              >
                {error}
              </ThemedText>
              <Pressable
                onPress={loadJournals}
                style={({ pressed }) => [
                  styles.retryButton,
                  { backgroundColor: colors.primary },
                  pressed && { opacity: 0.9 },
                ]}
              >
                <Text
                  style={[
                    styles.retryButtonText,
                    { color: colors.primaryForeground },
                  ]}
                >
                  Retry
                </Text>
              </Pressable>
            </View>
          ) : filteredJournals.length === 0 ? (
            <View style={styles.empty}>
              <Ionicons
                name="book-outline"
                size={48}
                color={colors.mutedForeground}
              />
              <ThemedText
                style={[styles.emptyText, { color: colors.mutedForeground }]}
              >
                {searchQuery.trim()
                  ? "No journals match your search."
                  : "No journals yet. Tap + to create one."}
              </ThemedText>
            </View>
          ) : (
            <View style={styles.folderList}>
              {filteredJournals.map((journal) => (
                <Pressable
                  key={journal.id}
                  onPress={() => onJournalPress(journal.id)}
                  style={({ pressed }) => [
                    styles.folderRow,
                    {
                      borderBottomColor: colors.border,
                      backgroundColor: colors.background,
                    },
                    pressed && { opacity: 0.7 },
                  ]}
                >
                  <View
                    style={[
                      styles.folderIconWrap,
                      { backgroundColor: colors.muted },
                    ]}
                  >
                    <Ionicons
                      name="journal-outline"
                      size={22}
                      color={colors.primary}
                    />
                  </View>
                  <View style={styles.folderContent}>
                    <Text
                      style={[styles.folderTitle, { color: colors.foreground }]}
                      numberOfLines={1}
                    >
                      {journal.title}
                    </Text>
                    <Text
                      style={[
                        styles.folderSubtext,
                        { color: colors.mutedForeground },
                      ]}
                      numberOfLines={1}
                    >
                      {formatUpdatedShort(new Date(journal.updatedAt))}
                    </Text>
                  </View>
                  <Text
                    style={[
                      styles.folderCount,
                      { color: colors.mutedForeground },
                    ]}
                    numberOfLines={1}
                  >
                    {journal.entryCount}
                  </Text>
                  <Ionicons
                    name="chevron-forward"
                    size={18}
                    color={colors.mutedForeground}
                  />
                </Pressable>
              ))}
            </View>
          )}
        </ScrollView>
        <View style={styles.headerWrap} pointerEvents="box-none">
          <TabHeader
            title="Journals"
            mode="titleOnly"
            overlay
            rightAction={{
              onPress: onAdd,
              accessibilityLabel: "Create journal",
            }}
          />
          <View
            style={[
              styles.searchBarWrap,
              {
                backgroundColor: colors.background,
                paddingHorizontal: PADDING_H,
                paddingBottom: 10,
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
                size={20}
                color={colors.mutedForeground}
                style={styles.searchIcon}
              />
              <TextInput
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search journals"
                placeholderTextColor={colors.mutedForeground}
                style={[styles.searchInput, { color: colors.foreground }]}
                returnKeyType="search"
              />
            </View>
          </View>
        </View>
      </SignedIn>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: PADDING_H,
  },
  headerWrap: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  searchBarWrap: {
    paddingHorizontal: PADDING_H,
    paddingBottom: 10,
    minHeight: SEARCH_BAR_HEIGHT,
    justifyContent: "center",
    marginVertical: 12,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    height: 44,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 0,
  },
  listHeader: {
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 14,
  },
  empty: {
    alignItems: "center",
    paddingVertical: 48,
    gap: 12,
  },
  emptyText: {
    fontSize: 16,
    textAlign: "center",
  },
  folderList: {},
  folderRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  folderIconWrap: {
    width: 40,
    height: 40,
    borderRadius: radius.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  folderContent: { flex: 1, minWidth: 0 },
  folderTitle: {
    fontSize: 17,
    fontWeight: "600",
  },
  folderSubtext: {
    fontSize: 13,
    marginTop: 2,
  },
  folderCount: {
    fontSize: 15,
    fontWeight: "500",
  },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: radius.lg,
    marginTop: 12,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
});
