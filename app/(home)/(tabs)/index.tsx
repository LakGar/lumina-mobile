import { HomeFloatingActions } from "@/components/home-floating-actions";
import { InsightSection } from "@/components/insight-section";
import { JournalSelectModal } from "@/components/journal-select-modal";
import MyDashboard from "@/components/my-dashbaord";
import { PromptOfTheDay } from "@/components/prompt-of-the-day";
import RefferalBanner from "@/components/refferal-banner";
import TabHeader from "@/components/tab-header";
import { ThemedView } from "@/components/themed-view";
import { WeeklyTipCard } from "@/components/weekly-tip-card";
import { useSubscription } from "@/contexts/subscription-context";
import { useApi } from "@/hooks/use-api";
import type { WeeklyTip } from "@/lib/api";
import { addDays, formatYYYYMMDD, startOfWeek } from "@/utils/date";
import { SignedIn, SignedOut } from "@clerk/clerk-expo";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Alert, StyleSheet, View } from "react-native";
import Animated, {
  runOnJS,
  useAnimatedScrollHandler,
  useSharedValue,
} from "react-native-reanimated";

function RedirectToWelcome() {
  const router = useRouter();
  React.useEffect(() => {
    router.replace("/(home)/welcome");
  }, [router]);
  return null;
}

const FLOATING_ACTIONS_HEIGHT = 180;
const SCROLL_HIDE_THRESHOLD = 40;
const SCROLL_SHOW_THRESHOLD = 20;
const HEADER_OVERLAY_HEIGHT = 200;

export default function HomeIndex() {
  const router = useRouter();
  const api = useApi();
  const { isPro } = useSubscription() ?? { isPro: false };
  const [hasAiSuggestions] = useState(true);
  const [showWeekStrip, setShowWeekStrip] = useState(true);
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [entriesThisWeek, setEntriesThisWeek] = useState<number | null>(null);
  const [entriesForSelectedDay, setEntriesForSelectedDay] = useState<
    number | null
  >(null);
  const [totalJournals, setTotalJournals] = useState<number | null>(null);
  const [lastJournalEntry, setLastJournalEntry] = useState<{
    title: string;
    daysAgo: number;
  } | null>(null);
  const [journaledDaysThisWeek, setJournaledDaysThisWeek] = useState<
    boolean[] | null
  >(null);
  const [dashboardOverrides, setDashboardOverrides] = useState<Record<
    string,
    { value: number; average?: string }
  > | null>(null);
  const [recentMoodSummary, setRecentMoodSummary] = useState<{
    lastMood: string;
    count: number;
  } | null>(null);
  const [latestWeeklyTip, setLatestWeeklyTip] = useState<WeeklyTip | null>(
    null,
  );
  const [weeklyTipsLoading, setWeeklyTipsLoading] = useState(true);
  const [weeklyTipGenerating, setWeeklyTipGenerating] = useState(false);
  const lastScrollY = useSharedValue(0);
  const apiRef = useRef(api);
  apiRef.current = api;

  const loadDashboardStats = useCallback(async () => {
    try {
      apiRef.current.invalidate.journals();
      apiRef.current.invalidate.myEntries();
      apiRef.current.invalidate.userStats();
      const [journalsRes, entriesRes, userStatsRes] = await Promise.all([
        apiRef.current.fetchJournals().then((j) => (Array.isArray(j) ? j : [])),
        apiRef.current
          .fetchMyEntries(100)
          .then((e) => (Array.isArray(e) ? e : [])),
        apiRef.current.fetchUserStats().catch(() => null),
      ]);
      const journals = journalsRes;
      const entries = entriesRes;
      const userStats = userStatsRes;
      setTotalJournals(journals.length);
      const weekStart = startOfWeek(new Date());
      const weekEnd = addDays(weekStart, 7);
      const today = new Date();
      const selectedYmd = formatYYYYMMDD(selectedDate);
      let weekCount = 0;
      let dayCount = 0;
      const weekDaysHadEntry = [
        false,
        false,
        false,
        false,
        false,
        false,
        false,
      ];
      let totalWords = 0;
      let entriesWithMood = 0;

      for (const e of entries) {
        const created = new Date(
          typeof e.createdAt === "string" ? e.createdAt : "",
        );
        if (Number.isNaN(created.getTime())) continue;
        const createdYmd = formatYYYYMMDD(created);
        if (created >= weekStart && created < weekEnd) {
          weekCount += 1;
          const dayOfWeek = created.getDay();
          const idx = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
          weekDaysHadEntry[idx] = true;
        }
        if (createdYmd === selectedYmd) dayCount += 1;
        const body = (typeof e.body === "string" ? e.body : "")
          .trim()
          .replace(/^\.$/, "");
        const wordCount = body ? body.split(/\s+/).filter(Boolean).length : 0;
        totalWords += wordCount;
        if (typeof e.mood === "string" && e.mood.trim()) entriesWithMood += 1;
      }

      setEntriesThisWeek(weekCount);
      setEntriesForSelectedDay(dayCount);
      setJournaledDaysThisWeek(weekDaysHadEntry);

      const first = entries[0];
      if (first) {
        const created = new Date(
          typeof first.createdAt === "string" ? first.createdAt : "",
        );
        const daysAgo = Number.isNaN(created.getTime())
          ? 0
          : Math.floor(
              (today.getTime() - created.getTime()) / (24 * 60 * 60 * 1000),
            );
        const rawTitle = (
          typeof first.title === "string" ? first.title : (first.body ?? "")
        )
          .trim()
          .replace(/^\.$/, "");
        const title = rawTitle.slice(0, 50) + (rawTitle.length > 50 ? "…" : "");
        setLastJournalEntry({ title: title || "Untitled", daysAgo });
      } else {
        setLastJournalEntry(null);
      }

      const n = entries.length;
      const overrides: Record<string, { value: number; average?: string }> = {};
      if (n > 0) {
        overrides["words-per-entry"] = {
          value: Math.round(totalWords / n),
          average: "avg",
        };
        overrides["reflections"] = { value: n, average: "total" };
        overrides["gratitude-entries"] = {
          value: entriesWithMood,
          average: "with mood",
        };
      }
      const entriesByDay = new Set<string>();
      for (const e of entries) {
        const d = new Date(typeof e.createdAt === "string" ? e.createdAt : "");
        if (!Number.isNaN(d.getTime())) entriesByDay.add(formatYYYYMMDD(d));
      }
      let streak = 0;
      for (let d = 0; d < 365; d++) {
        const check = new Date(today);
        check.setDate(check.getDate() - d);
        const ymd = formatYYYYMMDD(check);
        if (entriesByDay.has(ymd)) streak += 1;
        else break;
      }
      overrides["current-streak"] = { value: streak, average: "days" };
      const daysInLast30 = 30;
      let daysWithEntry = 0;
      for (let d = 0; d < daysInLast30; d++) {
        const check = new Date(today);
        check.setDate(check.getDate() - d);
        if (entriesByDay.has(formatYYYYMMDD(check))) daysWithEntry += 1;
      }
      const consistencyPct =
        daysInLast30 > 0 ? Math.round((daysWithEntry / daysInLast30) * 100) : 0;
      overrides["consistency"] = {
        value: consistencyPct,
        average: "last 30 days",
      };

      if (userStats) {
        if (userStats.entryQualityScore != null) {
          overrides["entry-quality-score"] = {
            value: Math.round(userStats.entryQualityScore),
            average: "quality",
          };
        }
        if (userStats.moodScore != null) {
          overrides["mood-score"] = {
            value: Math.round(userStats.moodScore * 10) / 10,
            average: "avg",
          };
        }
        overrides["prompts-completed"] = {
          value: userStats.promptsCompleted,
          average: "total",
        };
      }

      setDashboardOverrides(overrides);

      const withMood = entries.filter(
        (e) => typeof e.mood === "string" && e.mood.trim(),
      );
      if (withMood.length > 0) {
        const last = withMood[0];
        setRecentMoodSummary({
          lastMood: (last.mood ?? "").trim(),
          count: withMood.length,
        });
      } else {
        setRecentMoodSummary(null);
      }
    } catch {
      // Set zeros so UI shows "0" instead of "—" when load fails (e.g. network)
      setTotalJournals(0);
      setEntriesThisWeek(0);
      setEntriesForSelectedDay(0);
      setJournaledDaysThisWeek([
        false,
        false,
        false,
        false,
        false,
        false,
        false,
      ]);
      setLastJournalEntry(null);
      setDashboardOverrides({
        "current-streak": { value: 0, average: "days" },
        consistency: { value: 0, average: "last 30 days" },
      });
      setRecentMoodSummary(null);
    }
  }, [selectedDate]);

  useEffect(() => {
    loadDashboardStats();
  }, [loadDashboardStats]);

  useFocusEffect(
    useCallback(() => {
      loadDashboardStats();
    }, [loadDashboardStats]),
  );

  // Fetch latest weekly tip only for Pro (single request on focus/date change)
  useEffect(() => {
    if (!isPro) {
      setLatestWeeklyTip(null);
      setWeeklyTipsLoading(false);
      return;
    }
    let cancelled = false;
    setWeeklyTipsLoading(true);
    apiRef.current
      .fetchWeeklyTips(1)
      .then((list) => {
        if (!cancelled) setLatestWeeklyTip(list[0] ?? null);
      })
      .catch(() => {
        if (!cancelled) setLatestWeeklyTip(null);
      })
      .finally(() => {
        if (!cancelled) setWeeklyTipsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isPro, selectedDate]);

  const handleGetWeeklyTip = useCallback(async () => {
    if (!isPro) {
      router.push("/(home)/subscription");
      return;
    }
    if (weeklyTipGenerating) return;
    setWeeklyTipGenerating(true);
    try {
      const tip = await apiRef.current.generateWeeklyTip();
      setLatestWeeklyTip(tip);
    } catch {
      Alert.alert(
        "Tip unavailable",
        "We couldn’t generate a tip right now. Please try again.",
        [{ text: "OK" }],
      );
    } finally {
      setWeeklyTipGenerating(false);
    }
  }, [isPro, router, weeklyTipGenerating]);

  const handleWeeklyTipShown = useCallback((tip: WeeklyTip) => {
    apiRef.current.markWeeklyTipRead(tip.id).catch(() => {});
  }, []);

  const updateWeekStrip = useCallback((y: number, isScrollingDown: boolean) => {
    if (isScrollingDown && y > SCROLL_HIDE_THRESHOLD) {
      setShowWeekStrip(false);
    } else if (!isScrollingDown || y < SCROLL_SHOW_THRESHOLD) {
      setShowWeekStrip(true);
    }
  }, []);

  const [journalPickerVisible, setJournalPickerVisible] = useState(false);
  const pendingPromptRef = useRef<string | null>(null);
  const creatingEntryRef = useRef(false);

  const handleOpenCreateEntry = useCallback(() => {
    pendingPromptRef.current = null;
    setJournalPickerVisible(true);
  }, []);

  const handleJournalSelected = useCallback(
    async (journalId: string) => {
      const prompt = pendingPromptRef.current?.trim();
      pendingPromptRef.current = null;
      const hasPrompt = prompt && prompt.length > 0;
      const content = hasPrompt ? "." : ".";
      if (creatingEntryRef.current) return;
      creatingEntryRef.current = true;
      try {
        const newEntry = await api.createEntry(journalId, {
          content,
          source: hasPrompt ? "TEXT" : undefined,
          ...(hasPrompt ? { prompt } : {}),
        });
        router.push({
          pathname: "/(home)/entry/[entryId]",
          params: {
            entryId: newEntry.id,
            journalId,
            ...(hasPrompt ? { prompt } : {}),
          },
        });
      } catch (e) {
        Alert.alert(
          "Error",
          e instanceof Error ? e.message : "Could not create entry",
        );
      } finally {
        creatingEntryRef.current = false;
      }
    },
    [router, api],
  );

  const handleCreateNewJournalFromPicker = useCallback(() => {
    router.push("/(home)/create-journal");
  }, [router]);

  const handleStartJournalingWithPrompt = useCallback((prompt: string) => {
    pendingPromptRef.current = prompt;
    setJournalPickerVisible(true);
  }, []);

  const handleAiSuggestionPress = useCallback(() => {
    router.push("/(home)/(tabs)/ai-chat");
  }, [router]);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (e) => {
      const y = e.contentOffset.y;
      const isScrollingDown = y > lastScrollY.value;
      lastScrollY.value = y;
      runOnJS(updateWeekStrip)(y, isScrollingDown);
    },
  });

  return (
    <ThemedView style={styles.container}>
      <SignedOut>
        <RedirectToWelcome />
      </SignedOut>
      <SignedIn>
        <Animated.ScrollView
          style={styles.scroll}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingTop: HEADER_OVERLAY_HEIGHT },
          ]}
          showsVerticalScrollIndicator={true}
          keyboardShouldPersistTaps="handled"
          onScroll={scrollHandler}
          scrollEventThrottle={16}
        >
          <RefferalBanner />
          <PromptOfTheDay onStartJournaling={handleStartJournalingWithPrompt} />
          <WeeklyTipCard
            tip={latestWeeklyTip}
            loading={weeklyTipsLoading}
            generating={weeklyTipGenerating}
            onGetTip={handleGetWeeklyTip}
            onTipShown={handleWeeklyTipShown}
            isPro={isPro}
          />
          <InsightSection
            selectedDate={selectedDate}
            entriesThisWeek={entriesThisWeek}
            entriesForSelectedDay={entriesForSelectedDay}
            lastJournalEntry={lastJournalEntry}
            journaledDaysThisWeek={journaledDaysThisWeek}
            recentMoodSummary={recentMoodSummary}
            luminaScore={isPro ? 0 : undefined}
            isPro={isPro}
            onNavigateToMood={() => router.push("/(home)/mood")}
            onCreateEntry={handleOpenCreateEntry}
            onNavigateToEntry={(entryId, journalId) =>
              router.push({
                pathname: "/(home)/entry/[entryId]",
                params: { entryId, journalId },
              })
            }
            onNavigateToCreateJournal={() =>
              router.push("/(home)/create-journal")
            }
          />
          <MyDashboard
            selectedDate={selectedDate}
            entriesThisWeek={entriesThisWeek}
            entriesForSelectedDay={entriesForSelectedDay}
            totalJournals={totalJournals}
            metricOverrides={dashboardOverrides}
            onCustomizePress={() => router.push("/(home)/customize-dashboard")}
          />
        </Animated.ScrollView>
        <View style={styles.headerOverlay} pointerEvents="box-none">
          <TabHeader
            title="Home"
            mode="home"
            showWeekStrip={showWeekStrip}
            overlay
            streak={0}
            selectedDate={selectedDate}
            onDateChange={setSelectedDate}
          />
        </View>
        <HomeFloatingActions
          hasAiSuggestions={hasAiSuggestions}
          onCreateEntry={handleOpenCreateEntry}
          onAiSuggestionPress={handleAiSuggestionPress}
        />
        <JournalSelectModal
          visible={journalPickerVisible}
          onClose={() => setJournalPickerVisible(false)}
          onSelectJournal={handleJournalSelected}
          onCreateNewJournal={handleCreateNewJournalFromPicker}
          fetchJournals={api.fetchJournals}
        />
      </SignedIn>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: {
    paddingBottom: FLOATING_ACTIONS_HEIGHT,
  },
  headerOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
});
