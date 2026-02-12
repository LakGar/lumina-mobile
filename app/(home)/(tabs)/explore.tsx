import { DiscoverCardModal } from "@/components/discover-card-modal";
import { ExploreDiscover } from "@/components/explore-discover";
import { ExploreJournalingBlogs } from "@/components/explore-journaling-blogs";
import { ExploreQuote } from "@/components/explore-quote";
import { ExploreQuoteOfTheDay } from "@/components/explore-quote-of-the-day";
import { ExploreTopicPills } from "@/components/explore-topic-pills";
import { ExploreTrendingPrompts } from "@/components/explore-trending-prompts";
import { JournalOfTheDay } from "@/components/journal-of-the-day";
import { JournalSelectModal } from "@/components/journal-select-modal";
import { PromptOfTheDay } from "@/components/prompt-of-the-day";
import TabHeader from "@/components/tab-header";
import { ThemedView } from "@/components/themed-view";
import { useApi } from "@/hooks/use-api";
import { SignedIn } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";
import React, { useCallback, useRef, useState } from "react";
import { Alert, ScrollView, StyleSheet, View } from "react-native";

const EXPLORE_HEADER_HEIGHT = 120;
const SCROLL_PADDING_BOTTOM = 100;

export default function ExploreScreen() {
  const router = useRouter();
  const api = useApi();
  const creatingRef = useRef(false);
  const [journalPickerVisible, setJournalPickerVisible] = useState(false);
  const pendingPromptRef = useRef<string | null>(null);
  const [discoverModal, setDiscoverModal] = useState<{
    id: string;
    label: string;
    subtitle: string;
  } | null>(null);

  const handleJournalSelected = useCallback(
    async (journalId: string) => {
      const prompt = pendingPromptRef.current?.trim() || ".";
      pendingPromptRef.current = null;
      if (creatingRef.current) return;
      creatingRef.current = true;
      try {
        const newEntry = await api.createEntry(journalId, {
          content: prompt,
          source: "TEXT",
        });
        router.push({
          pathname: "/(home)/entry/[entryId]",
          params: { entryId: newEntry.id, journalId },
        });
      } catch (e) {
        Alert.alert(
          "Error",
          e instanceof Error ? e.message : "Could not create entry",
        );
      } finally {
        creatingRef.current = false;
      }
    },
    [router, api],
  );

  const handleStartJournalingWithPrompt = useCallback((prompt: string) => {
    pendingPromptRef.current = prompt;
    setJournalPickerVisible(true);
  }, []);

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
          <JournalOfTheDay
            onStartJournaling={handleStartJournalingWithPrompt}
          />
          <ExploreQuoteOfTheDay />
          <ExploreTrendingPrompts
            onStartJournaling={handleStartJournalingWithPrompt}
          />
          <ExploreQuote />
          <ExploreTopicPills
            onStartJournaling={handleStartJournalingWithPrompt}
          />
          <ExploreDiscover
            onStartJournaling={handleStartJournalingWithPrompt}
            onCardPress={(id, label, subtitle) =>
              setDiscoverModal({ id, label, subtitle })
            }
          />
          <ExploreJournalingBlogs />
        </ScrollView>
        <View style={styles.headerOverlay} pointerEvents="box-none">
          <TabHeader title="Explore" mode="titleOnly" overlay />
        </View>
        <JournalSelectModal
          visible={journalPickerVisible}
          onClose={() => setJournalPickerVisible(false)}
          onSelectJournal={handleJournalSelected}
          onCreateNewJournal={() => {
            setJournalPickerVisible(false);
            router.push("/(home)/create-journal");
          }}
          fetchJournals={api.fetchJournals}
        />
        <DiscoverCardModal
          visible={!!discoverModal}
          onClose={() => setDiscoverModal(null)}
          cardId={discoverModal?.id ?? null}
          cardLabel={discoverModal?.label ?? ""}
          cardSubtitle={discoverModal?.subtitle ?? ""}
          onStartJournaling={handleStartJournalingWithPrompt}
          onOpenJournals={() => router.push("/(home)/(tabs)/journals")}
        />
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
