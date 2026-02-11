import { DEFAULT_ORDER } from "@/constants/dashboard-metrics";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

const STORAGE_KEY = "@lumina/dashboard-settings";

type DashboardSettings = {
  order: string[];
  visibleIds: string[];
};

const defaultSettings: DashboardSettings = {
  order: DEFAULT_ORDER,
  visibleIds: [...DEFAULT_ORDER],
};

type DashboardSettingsContextValue = {
  order: string[];
  visibleIds: string[];
  visibleSet: Set<string>;
  setOrder: (order: string[]) => void;
  setVisible: (id: string, visible: boolean) => void;
  moveToSeen: (id: string) => void;
  moveToHidden: (id: string) => void;
  reorderSeen: (newOrder: string[]) => void;
  reorderHidden: (newOrder: string[]) => void;
  getOrderedVisible: () => string[];
  getOrderedHidden: () => string[];
  isLoading: boolean;
};

const DashboardSettingsContext =
  createContext<DashboardSettingsContextValue | null>(null);

export function DashboardSettingsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [settings, setSettings] = useState<DashboardSettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as DashboardSettings;
          if (Array.isArray(parsed.order) && Array.isArray(parsed.visibleIds)) {
            setSettings({ order: parsed.order, visibleIds: parsed.visibleIds });
          }
        }
      } catch {
        // keep defaults
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const persist = useCallback((next: DashboardSettings) => {
    setSettings(next);
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {});
  }, []);

  const setOrder = useCallback(
    (order: string[]) => {
      persist({ ...settings, order });
    },
    [persist, settings],
  );

  const setVisible = useCallback(
    (id: string, visible: boolean) => {
      const nextVisible = visible
        ? settings.visibleIds.includes(id)
          ? settings.visibleIds
          : [...settings.visibleIds, id]
        : settings.visibleIds.filter((x) => x !== id);
      persist({ ...settings, visibleIds: nextVisible });
    },
    [persist, settings],
  );

  const moveToSeen = useCallback(
    (id: string) => {
      if (settings.visibleIds.includes(id)) return;
      persist({ ...settings, visibleIds: [...settings.visibleIds, id] });
    },
    [persist, settings],
  );

  const moveToHidden = useCallback(
    (id: string) => {
      persist({
        ...settings,
        visibleIds: settings.visibleIds.filter((x) => x !== id),
      });
    },
    [persist, settings],
  );

  const reorderSeen = useCallback(
    (newOrder: string[]) => {
      const hidden = settings.order.filter(
        (id) => !settings.visibleIds.includes(id),
      );
      persist({ ...settings, order: [...newOrder, ...hidden] });
    },
    [persist, settings],
  );

  const reorderHidden = useCallback(
    (newOrder: string[]) => {
      const seen = settings.order.filter((id) =>
        settings.visibleIds.includes(id),
      );
      persist({ ...settings, order: [...seen, ...newOrder] });
    },
    [persist, settings],
  );

  const visibleSet = useMemo(
    () => new Set(settings.visibleIds),
    [settings.visibleIds],
  );

  const getOrderedVisible = useCallback(() => {
    return settings.order.filter((id) => settings.visibleIds.includes(id));
  }, [settings.order, settings.visibleIds]);

  const getOrderedHidden = useCallback(() => {
    return settings.order.filter((id) => !settings.visibleIds.includes(id));
  }, [settings.order, settings.visibleIds]);

  const value: DashboardSettingsContextValue = useMemo(
    () => ({
      order: settings.order,
      visibleIds: settings.visibleIds,
      visibleSet,
      setOrder,
      setVisible,
      moveToSeen,
      moveToHidden,
      reorderSeen,
      reorderHidden,
      getOrderedVisible,
      getOrderedHidden,
      isLoading,
    }),
    [
      settings.order,
      settings.visibleIds,
      visibleSet,
      setOrder,
      setVisible,
      moveToSeen,
      moveToHidden,
      reorderSeen,
      reorderHidden,
      getOrderedVisible,
      getOrderedHidden,
      isLoading,
    ],
  );

  return (
    <DashboardSettingsContext.Provider value={value}>
      {children}
    </DashboardSettingsContext.Provider>
  );
}

export function useDashboardSettings() {
  const ctx = useContext(DashboardSettingsContext);
  if (!ctx)
    throw new Error(
      "useDashboardSettings must be used within DashboardSettingsProvider",
    );
  return ctx;
}
