import { useEffect, useState } from 'react';
import { storage } from '../services/storage';

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [pendingSyncCount, setPendingSyncCount] = useState<number>(0);
  const [lastSyncMessage, setLastSyncMessage] = useState<string | null>(null);

  useEffect(() => {
    // Initial check of offline queue
    setPendingSyncCount(storage.getOfflineQueue().length);

    const handleOnline = () => {
      setIsOnline(true);
      // Auto flush pending actions
      const count = storage.flushOfflineQueue();
      if (count > 0) {
        setLastSyncMessage(`¡Conexión recuperada! Se sincronizaron ${count} publicaciones guardadas localmente.`);
        setTimeout(() => setLastSyncMessage(null), 5000);
      }
      setPendingSyncCount(0);
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    const handleStorageChange = () => {
      setPendingSyncCount(storage.getOfflineQueue().length);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('redvecina_data_changed', handleStorageChange);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('redvecina_data_changed', handleStorageChange);
    };
  }, []);

  return { isOnline, pendingSyncCount, lastSyncMessage };
}
