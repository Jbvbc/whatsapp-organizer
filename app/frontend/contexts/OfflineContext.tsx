import { createContext, useContext, useState, useEffect, useCallback, ReactNode, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { processQueue, getQueueSize } from '../services/sync';
import { getCacheTimestamp } from '../services/cache';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:8000';
const CHECK_INTERVAL = 30000;

interface OfflineContextType {
  isOnline: boolean;
  pendingSyncCount: number;
  lastSyncTimestamp: number | null;
  triggerSync: () => Promise<void>;
}

const OfflineContext = createContext<OfflineContextType>({
  isOnline: true,
  pendingSyncCount: 0,
  lastSyncTimestamp: null,
  triggerSync: async () => {},
});

export function OfflineProvider({ children }: { children: ReactNode }) {
  const [isOnline, setIsOnline] = useState(true);
  const [pendingSyncCount, setPendingSyncCount] = useState(0);
  const [lastSyncTimestamp, setLastSyncTimestamp] = useState<number | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const checkConnectivity = useCallback(async () => {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      const response = await fetch(`${BACKEND_URL}/api/contacts?limit=1`, {
        method: 'HEAD',
        signal: controller.signal,
      });
      clearTimeout(timeout);
      setIsOnline(response.ok);
    } catch {
      setIsOnline(false);
    }
  }, []);

  const updatePendingCount = useCallback(async () => {
    const count = await getQueueSize();
    setPendingSyncCount(count);
  }, []);

  const triggerSync = useCallback(async () => {
    if (!isOnline) return;
    const result = await processQueue(BACKEND_URL);
    if (result.success > 0 || result.failed > 0) {
      await updatePendingCount();
    }
    const ts = await getCacheTimestamp('lastSync');
    setLastSyncTimestamp(ts);
  }, [isOnline, updatePendingCount]);

  useEffect(() => {
    checkConnectivity();
    updatePendingCount();

    intervalRef.current = setInterval(() => {
      checkConnectivity();
    }, CHECK_INTERVAL);

    const subscription = AppState.addEventListener('change', (state: AppStateStatus) => {
      if (state === 'active') {
        checkConnectivity();
      }
    });

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      subscription.remove();
    };
  }, [checkConnectivity, updatePendingCount]);

  useEffect(() => {
    if (isOnline && pendingSyncCount > 0) {
      triggerSync();
    }
  }, [isOnline, pendingSyncCount, triggerSync]);

  return (
    <OfflineContext.Provider value={{ isOnline, pendingSyncCount, lastSyncTimestamp, triggerSync }}>
      {children}
    </OfflineContext.Provider>
  );
}

export function useOffline() {
  return useContext(OfflineContext);
}
