import {
  DASHBOARD_METRICS,
  type DashboardMetric,
} from "@/constants/dashboard-metrics";
import { radius } from "@/constants/theme";
import { useDashboardSettings } from "@/contexts/dashboard-settings-context";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useThemeColors } from "@/hooks/use-theme-colors";
import Ionicons from "@expo/vector-icons/Ionicons";
import React, { useCallback, useMemo } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import DraggableFlatList, {
  type RenderItemParams,
} from "react-native-draggable-flatlist";
import { ThemedText } from "./themed-text";
import { ThemedView } from "./themed-view";

const metricsById = Object.fromEntries(DASHBOARD_METRICS.map((m) => [m.id, m]));

function MetricRow({
  metric,
  onMoveToOther,
  isVisible,
  drag,
}: {
  metric: DashboardMetric;
  onMoveToOther: () => void;
  isVisible: boolean;
  drag: () => void;
}) {
  const colorScheme = useColorScheme();
  const colors = useThemeColors();

  return (
    <Pressable
      onLongPress={drag}
      delayLongPress={200}
      style={[styles.row, { backgroundColor: colors.card }]}
    >
      <View style={styles.rowLeft}>
        <Ionicons
          name="reorder-three"
          size={22}
          color={colors.mutedForeground}
          style={styles.dragHandle}
        />
        <View style={[styles.iconWrap, { backgroundColor: colors.muted }]}>
          <Ionicons
            name={metric.icon}
            size={18}
            color={colors.mutedForeground}
          />
        </View>
        <Text
          style={[styles.label, { color: colors.foreground }]}
          numberOfLines={1}
        >
          {metric.label}
        </Text>
      </View>
      <Pressable
        onPress={onMoveToOther}
        style={({ pressed }) => [styles.moveBtn, pressed && { opacity: 0.7 }]}
        hitSlop={8}
      >
        <Ionicons
          name={isVisible ? "eye-off-outline" : "eye-outline"}
          size={22}
          color={colors.primary}
        />
        <Text style={[styles.moveLabel, { color: colors.primary }]}>
          {isVisible ? "Hide" : "Show"}
        </Text>
      </Pressable>
    </Pressable>
  );
}

type Props = {
  visible: boolean;
  onClose: () => void;
};

const LIST_HEIGHT = 260;
const USE_NATIVE_SCROLL = true; // set to false to use DraggableFlatList (no nested ScrollView)

export function CustomizeDashboardModal({ visible, onClose }: Props) {
  const colorScheme = useColorScheme();
  const colors = useThemeColors();
  const {
    order,
    visibleIds,
    reorderSeen,
    reorderHidden,
    moveToSeen,
    moveToHidden,
  } = useDashboardSettings();

  const seenData = useMemo(() => {
    const ids = order.filter((id) => visibleIds.includes(id));
    return ids.map((id) => metricsById[id]).filter(Boolean);
  }, [order, visibleIds]);
  const hiddenData = useMemo(() => {
    const ids = order.filter((id) => !visibleIds.includes(id));
    return ids.map((id) => metricsById[id]).filter(Boolean);
  }, [order, visibleIds]);

  const onSeenDragEnd = useCallback(
    ({ data }: { data: { id: string }[] }) => {
      reorderSeen(data.map((d) => d.id));
    },
    [reorderSeen],
  );

  const onHiddenDragEnd = useCallback(
    ({ data }: { data: { id: string }[] }) => {
      reorderHidden(data.map((d) => d.id));
    },
    [reorderHidden],
  );

  const renderSeenItem = useCallback(
    ({ item, drag }: RenderItemParams<DashboardMetric>) => (
      <MetricRow
        metric={item}
        isVisible
        onMoveToOther={() => moveToHidden(item.id)}
        drag={drag}
      />
    ),
    [moveToHidden],
  );

  const renderHiddenItem = useCallback(
    ({ item, drag }: RenderItemParams<DashboardMetric>) => (
      <MetricRow
        metric={item}
        isVisible={false}
        onMoveToOther={() => moveToSeen(item.id)}
        drag={drag}
      />
    ),
    [moveToSeen],
  );

  const noopDrag = useCallback(() => {}, []);

  const listEmpty = useCallback(
    (label: string) => (
      <View style={styles.emptyWrap}>
        <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
          {label}
        </Text>
      </View>
    ),
    [colors.mutedForeground],
  );

  const scrollContent = (
    <View style={styles.body}>
      <View style={styles.section}>
        <ThemedText type="subtitle" style={styles.sectionTitle}>
          Shown on dashboard
        </ThemedText>
        {seenData.length === 0 ? (
          listEmpty("No metrics shown")
        ) : (
          <View style={styles.rowsWrap}>
            {seenData.map((item) => (
              <MetricRow
                key={item.id}
                metric={item}
                isVisible
                onMoveToOther={() => moveToHidden(item.id)}
                drag={noopDrag}
              />
            ))}
          </View>
        )}
      </View>
      <View style={styles.section}>
        <ThemedText type="subtitle" style={styles.sectionTitle}>
          Hidden
        </ThemedText>
        {hiddenData.length === 0 ? (
          listEmpty("No hidden metrics")
        ) : (
          <View style={styles.rowsWrap}>
            {hiddenData.map((item) => (
              <MetricRow
                key={item.id}
                metric={item}
                isVisible={false}
                onMoveToOther={() => moveToSeen(item.id)}
                drag={noopDrag}
              />
            ))}
          </View>
        )}
      </View>
    </View>
  );

  const draggableContent = (
    <View style={[styles.body, styles.bodyFlex]}>
      <View style={styles.section}>
        <ThemedText type="subtitle" style={styles.sectionTitle}>
          Shown on dashboard
        </ThemedText>
        <View style={[styles.listWrap, { height: LIST_HEIGHT }]}>
          <DraggableFlatList
            data={seenData}
            onDragEnd={onSeenDragEnd}
            keyExtractor={(item) => item.id}
            renderItem={renderSeenItem}
            style={styles.list}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={listEmpty("No metrics shown")}
            initialNumToRender={15}
          />
        </View>
      </View>
      <View style={styles.section}>
        <ThemedText type="subtitle" style={styles.sectionTitle}>
          Hidden
        </ThemedText>
        <View style={[styles.listWrap, { height: LIST_HEIGHT }]}>
          <DraggableFlatList
            data={hiddenData}
            onDragEnd={onHiddenDragEnd}
            keyExtractor={(item) => item.id}
            renderItem={renderHiddenItem}
            style={styles.list}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={listEmpty("No hidden metrics")}
            initialNumToRender={15}
          />
        </View>
      </View>
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <ThemedView style={styles.container}>
        <View style={styles.header}>
          <ThemedText type="title" style={styles.title}>
            Customize dashboard
          </ThemedText>
          <Pressable
            onPress={onClose}
            style={({ pressed }) => [
              styles.doneBtn,
              pressed && { opacity: 0.7 },
            ]}
            hitSlop={8}
          >
            <ThemedText
              type="default"
              style={[styles.doneText, { color: colors.primary }]}
            >
              Done
            </ThemedText>
          </Pressable>
        </View>

        <ThemedText
          type="default"
          style={[styles.hint, { color: colors.mutedForeground }]}
        >
          {USE_NATIVE_SCROLL
            ? "Tap Show/Hide to move metrics between sections."
            : "Long-press and drag to reorder. Tap Show/Hide to move between sections."}
        </ThemedText>

        {USE_NATIVE_SCROLL ? (
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {scrollContent}
          </ScrollView>
        ) : (
          draggableContent
        )}
      </ThemedView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  title: {
    fontSize: 20,
  },
  doneBtn: {
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  doneText: {
    fontSize: 16,
    fontWeight: "600",
  },
  hint: {
    fontSize: 13,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  body: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 24,
  },
  bodyFlex: {
    flex: 1,
  },
  section: {
    paddingTop: 16,
  },
  rowsWrap: {
    gap: 10,
    paddingBottom: 8,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 10,
    opacity: 0.8,
  },
  listWrap: {
    overflow: "hidden",
  },
  list: {
    height: "100%",
  },
  emptyWrap: {
    paddingVertical: 24,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 14,
  },
  listContent: {
    paddingBottom: 16,
    gap: 10,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: radius.lg,
  },
  rowLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 10,
  },
  dragHandle: {
    opacity: 0.6,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    flex: 1,
  },
  moveBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  moveLabel: {
    fontSize: 13,
    fontWeight: "600",
  },
});
