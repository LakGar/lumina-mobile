import { Colors, radius } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import type { WeeklyTip } from "@/lib/api";
import Ionicons from "@expo/vector-icons/Ionicons";
import * as Haptics from "expo-haptics";
import React, { useCallback } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const TIP_TYPE_ICON: Record<string, keyof typeof Ionicons.glyphMap> = {
  streak: "flame",
  missed_journal: "calendar",
  quality_down: "create",
  consistency: "trending-up",
  general: "bulb",
};

function tipIcon(tipType: string | null): keyof typeof Ionicons.glyphMap {
  if (tipType && tipType in TIP_TYPE_ICON) return TIP_TYPE_ICON[tipType];
  return "bulb";
}

/** Renders markdown-like text (paragraphs, **bold**) as simple styled text. */
function SimpleMarkdownText({
  text,
  style,
}: {
  text: string;
  style: { color: string; fontSize: number; lineHeight: number };
}) {
  const paragraphs = text.split(/\n\n+/).filter(Boolean);
  return (
    <View style={styles.markdownBlock}>
      {paragraphs.map((p, i) => {
        const withPlaceholders = p.replace(
          /\*\*([^*]+)\*\*/g,
          "\u0000$1\u0001",
        );
        const parts = withPlaceholders.split(/\u0000|\u0001/);
        return (
          <Text
            key={i}
            style={[style, styles.paragraph, i > 0 && { marginTop: 12 }]}
          >
            {parts.map((segment, j) => {
              const bold = withPlaceholders.includes("\u0000") && j % 2 === 1;
              return (
                <Text key={j} style={bold ? [style, styles.bold] : style}>
                  {segment}
                </Text>
              );
            })}
          </Text>
        );
      })}
    </View>
  );
}

export type WeeklyTipCardProps = {
  /** Latest tip from GET weekly-tips?limit=1 */
  tip: WeeklyTip | null;
  loading: boolean;
  /** Generating a new tip (POST generate) */
  generating: boolean;
  onGetTip: () => void;
  onTipShown?: (tip: WeeklyTip) => void;
};

export function WeeklyTipCard({
  tip,
  loading,
  generating,
  onGetTip,
  onTipShown,
}: WeeklyTipCardProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const insets = useSafeAreaInsets();
  const [detailVisible, setDetailVisible] = React.useState(false);
  const [detailTip, setDetailTip] = React.useState<WeeklyTip | null>(null);

  const openDetail = useCallback((t: WeeklyTip) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setDetailTip(t);
    setDetailVisible(true);
  }, []);

  const closeDetail = useCallback(() => {
    setDetailVisible(false);
    if (detailTip) onTipShown?.(detailTip);
    setDetailTip(null);
  }, [detailTip, onTipShown]);

  if (loading && !tip) {
    return (
      <Animated.View
        entering={FadeIn.duration(280)}
        style={[
          styles.skeleton,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
        <View
          style={[styles.skeletonLine, { backgroundColor: colors.muted }]}
        />
        <View
          style={[
            styles.skeletonLine,
            { backgroundColor: colors.muted, width: "70%", marginTop: 8 },
          ]}
        />
      </Animated.View>
    );
  }

  const showCta = !tip && !generating;
  const showCard = tip && !generating;

  return (
    <>
      {showCta && (
        <Animated.View
          entering={FadeInDown.duration(300).springify().damping(18)}
          style={styles.wrapper}
        >
          <Pressable
            onPress={onGetTip}
            style={({ pressed }) => [
              styles.ctaCard,
              { backgroundColor: colors.card, borderColor: colors.border },
              pressed && { opacity: 0.9 },
            ]}
          >
            <View
              style={[
                styles.ctaIconWrap,
                { backgroundColor: colors.primary + "20" },
              ]}
            >
              <Ionicons name="bulb-outline" size={28} color={colors.primary} />
            </View>
            <View style={styles.ctaBody}>
              <Text style={[styles.ctaTitle, { color: colors.foreground }]}>
                Get your weekly tip
              </Text>
              <Text
                style={[styles.ctaSubtitle, { color: colors.mutedForeground }]}
              >
                Personalized insight based on your journaling
              </Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={22}
              color={colors.mutedForeground}
            />
          </Pressable>
        </Animated.View>
      )}

      {generating && (
        <Animated.View
          entering={FadeIn.duration(220)}
          style={[
            styles.generatingCard,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <ActivityIndicator size="small" color={colors.primary} />
          <Text
            style={[styles.generatingLabel, { color: colors.mutedForeground }]}
          >
            Generating your tip…
          </Text>
        </Animated.View>
      )}

      {showCard && tip && (
        <Animated.View
          entering={FadeInDown.duration(300).springify().damping(18)}
          style={styles.wrapper}
        >
          <Pressable
            onPress={() => openDetail(tip)}
            style={({ pressed }) => [
              styles.tipCard,
              { backgroundColor: colors.card, borderColor: colors.border },
              pressed && { opacity: 0.9 },
            ]}
          >
            <View
              style={[
                styles.tipIconWrap,
                { backgroundColor: colors.primary + "18" },
              ]}
            >
              <Ionicons
                name={tipIcon(tip.tipType)}
                size={22}
                color={colors.primary}
              />
            </View>
            <View style={styles.tipBody}>
              <Text
                style={[styles.tipTitle, { color: colors.foreground }]}
                numberOfLines={2}
              >
                {tip.title}
              </Text>
              <Text
                style={[styles.tipShort, { color: colors.mutedForeground }]}
                numberOfLines={2}
              >
                {tip.shortDescription}
              </Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={colors.mutedForeground}
            />
          </Pressable>
        </Animated.View>
      )}

      <Modal
        visible={detailVisible}
        animationType="fade"
        transparent
        onRequestClose={closeDetail}
      >
        <Pressable style={styles.modalOverlay} onPress={closeDetail}>
          <Pressable
            style={styles.modalContentWrap}
            onPress={(e) => e.stopPropagation()}
          >
            <View
              style={[
                styles.modalContent,
                {
                  backgroundColor: colors.background,
                  paddingTop: insets.top + 16,
                  paddingBottom: insets.bottom + 24,
                },
              ]}
            >
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: colors.foreground }]}>
                  {detailTip?.title}
                </Text>
                <Pressable
                  onPress={closeDetail}
                  hitSlop={12}
                  style={({ pressed }) => pressed && { opacity: 0.7 }}
                >
                  <Ionicons name="close" size={24} color={colors.foreground} />
                </Pressable>
              </View>
              <ScrollView
                style={styles.modalScroll}
                contentContainerStyle={styles.modalScrollContent}
                showsVerticalScrollIndicator={false}
              >
                {detailTip && (
                  <SimpleMarkdownText
                    text={detailTip.detailedText}
                    style={{
                      color: colors.foreground,
                      fontSize: 16,
                      lineHeight: 24,
                    }}
                  />
                )}
              </ScrollView>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginBottom: 16 },
  skeleton: {
    marginHorizontal: 20,
    padding: 20,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    minHeight: 88,
    justifyContent: "center",
  },
  skeletonLine: {
    height: 14,
    borderRadius: 4,
    width: "90%",
  },
  ctaCard: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 20,
    padding: 16,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
  },
  ctaIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  ctaBody: { flex: 1, minWidth: 0 },
  ctaTitle: { fontSize: 17, fontWeight: "700" },
  ctaSubtitle: { fontSize: 13, marginTop: 2 },
  generatingCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    marginHorizontal: 20,
    padding: 20,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
  },
  generatingLabel: { fontSize: 15 },
  tipCard: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 20,
    padding: 16,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
  },
  tipIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  tipBody: { flex: 1, minWidth: 0 },
  tipTitle: { fontSize: 16, fontWeight: "700" },
  tipShort: { fontSize: 13, marginTop: 4 },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  modalContentWrap: { maxHeight: "85%", minHeight: 200 },
  modalContent: { flex: 1, borderTopLeftRadius: 20, borderTopRightRadius: 20 },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  modalTitle: { flex: 1, fontSize: 20, fontWeight: "800", paddingRight: 12 },
  modalScroll: { flex: 1 },
  modalScrollContent: { paddingHorizontal: 20, paddingBottom: 24 },
  markdownBlock: {},
  paragraph: {},
  bold: { fontWeight: "700" },
});
