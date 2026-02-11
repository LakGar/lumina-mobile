import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import {
  DASHBOARD_METRICS,
  DEFAULT_ORDER,
  type DashboardMetric,
} from "@/constants/dashboard-metrics";
import { Colors, radius } from "@/constants/theme";
import { useDashboardSettings } from "@/contexts/dashboard-settings-context";
import { useColorScheme } from "@/hooks/use-color-scheme";
import Ionicons from "@expo/vector-icons/Ionicons";
import { GlassView, isLiquidGlassAvailable } from "expo-glass-effect";
import * as Haptics from "expo-haptics";
import React, { useMemo } from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import { ScaleDecorator } from "react-native-draggable-flatlist";

const metricsById = Object.fromEntries(DASHBOARD_METRICS.map((m) => [m.id, m]));

function GlassSwitch({
  value,
  onValueChange,
  colors,
}: {
  value: boolean;
  onValueChange: (v: boolean) => void;
  colors: { primary: string; muted: string; border: string };
}) {
  const useGlass = Platform.OS === "ios" && isLiquidGlassAvailable();

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onValueChange(!value);
  };

  if (useGlass) {
    return (
      <Pressable onPress={handlePress} hitSlop={8}>
        <GlassView
          style={[
            styles.glassSwitchTrack,
            { justifyContent: value ? "flex-end" : "flex-start" },
          ]}
          glassEffectStyle="regular"
          tintColor={value ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.06)"}
        >
          <View
            style={[
              styles.glassSwitchThumb,
              value
                ? [
                    styles.glassSwitchThumbOn,
                    { backgroundColor: colors.primary },
                  ]
                : styles.glassSwitchThumbOff,
            ]}
          />
        </GlassView>
      </Pressable>
    );
  }

  return (
    <Switch
      value={value}
      onValueChange={(v) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onValueChange(v);
      }}
      trackColor={{ false: colors.muted, true: colors.primary }}
      thumbColor="#fff"
    />
  );
}

function MetricRow({
  metric,
  isVisible,
  onToggle,
  drag,
  useScaleDecorator,
}: {
  metric: DashboardMetric;
  isVisible: boolean;
  onToggle: (v: boolean) => void;
  drag: () => void;
  useScaleDecorator?: boolean;
}) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  const rowContent = (
    <Pressable
      onLongPress={drag}
      delayLongPress={180}
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
      <GlassSwitch value={isVisible} onValueChange={onToggle} colors={colors} />
    </Pressable>
  );

  if (useScaleDecorator) {
    return <ScaleDecorator>{rowContent}</ScaleDecorator>;
  }
  return rowContent;
}

const noop = () => {};

export default function CustomizeDashboardScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const { order, visibleIds, setOrder, setVisible } = useDashboardSettings();

  const orderedData = useMemo(() => {
    const ids = order?.length ? order : DEFAULT_ORDER;
    const list = ids
      .map((id) => metricsById[id])
      .filter(Boolean) as DashboardMetric[];
    return list.length > 0 ? list : [...DASHBOARD_METRICS];
  }, [order]);

  return (
    <ThemedView style={styles.container}>
      <ThemedText
        type="default"
        style={[styles.hint, { color: colors.mutedForeground }]}
      >
        Long-press and drag to reorder. Use the switch to show or hide on the
        dashboard.
      </ThemedText>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}
        keyboardShouldPersistTaps="handled"
      >
        {orderedData.map((item) => (
          <MetricRow
            key={item.id}
            metric={item}
            isVisible={visibleIds.includes(item.id)}
            onToggle={(v) => setVisible(item.id, v)}
            drag={noop}
          />
        ))}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  hint: {
    fontSize: 13,
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 32,
    gap: 10,
  },
  emptyWrap: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 48,
  },
  emptyText: {
    fontSize: 14,
    textAlign: "center",
  },
  glassSwitchTrack: {
    width: 50,
    height: 28,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 2,
  },
  glassSwitchThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  glassSwitchThumbOff: {
    backgroundColor: "rgba(0,0,0,0.2)",
  },
  glassSwitchThumbOn: {
    // primary applied inline
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
});
