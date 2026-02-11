import { Colors, radius } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import Ionicons from "@expo/vector-icons/Ionicons";
import * as Haptics from "expo-haptics";
import React from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export type AddAction = "create_entry" | "quick_entry" | "schedule_reminder";

type AddActionSheetProps = {
  visible: boolean;
  dateLabel?: string;
  onClose: () => void;
  onSelect: (action: AddAction) => void;
};

const ACTIONS: {
  key: AddAction;
  label: string;
  sublabel: string;
  icon: "document-text-outline" | "create-outline" | "notifications-outline";
}[] = [
  {
    key: "create_entry",
    label: "Create entry",
    sublabel: "Choose journal template",
    icon: "document-text-outline",
  },
  {
    key: "quick_entry",
    label: "Quick entry",
    sublabel: "Blank entry",
    icon: "create-outline",
  },
  {
    key: "schedule_reminder",
    label: "Schedule reminder",
    sublabel: "Time + recurrence",
    icon: "notifications-outline",
  },
];

export function AddActionSheet({
  visible,
  dateLabel,
  onClose,
  onSelect,
}: AddActionSheetProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const insets = useSafeAreaInsets();

  const handleSelect = (action: AddAction) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSelect(action);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable
          style={[styles.sheet, { backgroundColor: colors.background }]}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={[styles.handle, { backgroundColor: colors.border }]} />
          {dateLabel ? (
            <Text style={[styles.dateLabel, { color: colors.mutedForeground }]}>
              {dateLabel}
            </Text>
          ) : null}
          <View style={styles.actions}>
            {ACTIONS.map(({ key, label, sublabel, icon }) => (
              <Pressable
                key={key}
                onPress={() => handleSelect(key)}
                style={({ pressed }) => [
                  styles.actionRow,
                  { borderBottomColor: colors.border },
                  pressed && styles.pressed,
                ]}
              >
                <View
                  style={[
                    styles.actionIconWrap,
                    { backgroundColor: colors.muted },
                  ]}
                >
                  <Ionicons name={icon} size={22} color={colors.foreground} />
                </View>
                <View style={styles.actionText}>
                  <Text
                    style={[styles.actionLabel, { color: colors.foreground }]}
                  >
                    {label}
                  </Text>
                  <Text
                    style={[
                      styles.actionSublabel,
                      { color: colors.mutedForeground },
                    ]}
                  >
                    {sublabel}
                  </Text>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={18}
                  color={colors.mutedForeground}
                />
              </Pressable>
            ))}
          </View>
          <View style={{ height: insets.bottom + 16 }} />
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  sheet: {
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingTop: 12,
    paddingHorizontal: 16,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 16,
  },
  dateLabel: {
    fontSize: 13,
    marginBottom: 12,
  },
  actions: {},
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  actionIconWrap: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  actionText: { flex: 1, minWidth: 0 },
  actionLabel: { fontSize: 16, fontWeight: "600" },
  actionSublabel: { fontSize: 13, marginTop: 2 },
  pressed: { opacity: 0.7 },
});
