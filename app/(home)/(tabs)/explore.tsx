import { ExploreDiscover } from "@/components/explore-discover";
import { ExploreJournalingBlogs } from "@/components/explore-journaling-blogs";
import { ExploreQuote } from "@/components/explore-quote";
import { ExploreQuoteOfTheDay } from "@/components/explore-quote-of-the-day";
import { ExploreTopicPills } from "@/components/explore-topic-pills";
import { ExploreTrendingPrompts } from "@/components/explore-trending-prompts";
import { JournalOfTheDay } from "@/components/journal-of-the-day";
import { PromptOfTheDay } from "@/components/prompt-of-the-day";
import TabHeader from "@/components/tab-header";
import { ThemedView } from "@/components/themed-view";
import { createEntry } from "@/constants/mock-journals";
import { SignedIn } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";
import React, { useCallback } from "react";
import { ScrollView, StyleSheet, View } from "react-native";

const DEFAULT_JOURNAL_ID = "j2";

const EXPLORE_HEADER_HEIGHT = 120;
const SCROLL_PADDING_BOTTOM = 100;

export default function ExploreScreen() {
  const router = useRouter();

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

  return (
    <ThemedView style={styles.container}>
      <SignedIn>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[
            styles.scrollContent,
            {
              paddingTop: EXPLORE_HEADER_HEIGHT,
              paddingBottom: SCROLL_PADDING_BOTTOM,
            },
          ]}
          showsVerticalScrollIndicator={true}
          keyboardShouldPersistTaps="handled"
        >
          <PromptOfTheDay onStartJournaling={handleStartJournalingWithPrompt} />
          <JournalOfTheDay />
          <ExploreQuoteOfTheDay />
          <ExploreTrendingPrompts />
          <ExploreQuote />
          <ExploreTopicPills />
          <ExploreDiscover />
          <ExploreJournalingBlogs />
        </ScrollView>
        <View style={styles.headerOverlay} pointerEvents="box-none">
          <TabHeader title="Explore" mode="titleOnly" overlay />
        </View>
      </SignedIn>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: {},
  headerOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
});
