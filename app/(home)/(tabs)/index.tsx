import { HomeFloatingActions } from "@/components/home-floating-actions";
import { InsightSection } from "@/components/insight-section";
import MyDashboard from "@/components/my-dashbaord";
import { PromptOfTheDay } from "@/components/prompt-of-the-day";
import RefferalBanner from "@/components/refferal-banner";
import TabHeader from "@/components/tab-header";
import { ThemedView } from "@/components/themed-view";
import { createEntry } from "@/constants/mock-journals";
import { SignedIn, SignedOut } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import { StyleSheet, View } from "react-native";
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

const DEFAULT_JOURNAL_ID = "j2";

const FLOATING_ACTIONS_HEIGHT = 180;
const SCROLL_HIDE_THRESHOLD = 40;
const SCROLL_SHOW_THRESHOLD = 20;
const HEADER_OVERLAY_HEIGHT = 200;

export default function HomeIndex() {
  const router = useRouter();
  const [hasAiSuggestions] = useState(true);
  const [showWeekStrip, setShowWeekStrip] = useState(true);
  const lastScrollY = useSharedValue(0);

  const updateWeekStrip = useCallback((y: number, isScrollingDown: boolean) => {
    if (isScrollingDown && y > SCROLL_HIDE_THRESHOLD) {
      setShowWeekStrip(false);
    } else if (!isScrollingDown || y < SCROLL_SHOW_THRESHOLD) {
      setShowWeekStrip(true);
    }
  }, []);

  const handleCreateEntry = useCallback(() => {
    const newEntry = createEntry(DEFAULT_JOURNAL_ID);
    router.push({
      pathname: "/(home)/entry/[entryId]",
      params: { entryId: newEntry.id, journalId: DEFAULT_JOURNAL_ID },
    });
  }, [router]);

  const handleStartJournalingWithPrompt = useCallback(
    (prompt: string) => {
      const newEntry = createEntry(DEFAULT_JOURNAL_ID, prompt);
      router.push({
        pathname: "/(home)/entry/[entryId]",
        params: { entryId: newEntry.id, journalId: DEFAULT_JOURNAL_ID },
      });
    },
    [router],
  );

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
          <InsightSection />
          <MyDashboard
            onCustomizePress={() => router.push("/(home)/customize-dashboard")}
          />
        </Animated.ScrollView>
        <View style={styles.headerOverlay} pointerEvents="box-none">
          <TabHeader
            title="Home"
            mode="home"
            showWeekStrip={showWeekStrip}
            overlay
          />
        </View>
        <HomeFloatingActions
          hasAiSuggestions={hasAiSuggestions}
          onCreateEntry={handleCreateEntry}
          onAiSuggestionPress={handleAiSuggestionPress}
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
