import { Alert } from "react-native";

const UPGRADE_MESSAGE =
  "This feature is part of Lumina. Upgrade to unlock unlimited journals, Go deeper, chat with your journal coach, weekly tips, and more.";

const JOURNAL_LIMIT_MESSAGE =
  "Free plan is limited to 3 journals. Upgrade to Lumina for unlimited journals.";

type RouterLike = { push: (path: string) => void };

export function showPlanLimitUpgrade(router: RouterLike): void {
  Alert.alert(
    "Upgrade to Lumina",
    UPGRADE_MESSAGE,
    [
      { text: "Not now", style: "cancel" },
      { text: "Upgrade", onPress: () => router.push("/(home)/subscription") },
    ],
  );
}

export function showJournalLimitUpgrade(router: RouterLike): void {
  Alert.alert(
    "Journal limit reached",
    JOURNAL_LIMIT_MESSAGE,
    [
      { text: "OK", style: "cancel" },
      { text: "Upgrade", onPress: () => router.push("/(home)/subscription") },
    ],
  );
}
