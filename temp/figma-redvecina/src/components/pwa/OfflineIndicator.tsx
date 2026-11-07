import React from 'react';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';
import { WifiOff, CheckCircle2, CloudUpload } from 'lucide-react';

export const OfflineIndicator: React.FC = () => {
  const { isOnline, pendingSyncCount, lastSyncMessage } = useOnlineStatus();

  return (
    <>
      {/* Offline Alert Badge */}
      {!isOnline && (
        <div className="fixed bottom-20 md:bottom-6 left-4 z-40 flex items-center gap-2.5 rounded-xl bg-amber-600/95 text-white px-3.5 py-2 text-xs font-semibold shadow-lg backdrop-blur-xs animate-in slide-in-from-bottom-2">
          <WifiOff className="w-4 h-4 text-amber-200 animate-pulse" />
          <div>
            <span>Modo Sin Conexión</span>
            {pendingSyncCount > 0 && (
              <span className="block text-[10px] text-amber-100 font-normal">
                {pendingSyncCount} acción(es) en cola para sincronizar
              </span>
            )}
          </div>
        </div>
      )}

      {/* Sync Success Toast */}
      {lastSyncMessage && (
        <div className="fixed top-18 right-4 z-50 flex items-center gap-2.5 rounded-xl bg-teal-800 text-white px-4 py-2.5 text-xs font-medium shadow-xl border border-teal-600 animate-in fade-in slide-in-from-top-3">
          <CheckCircle2 className="w-4 h-4 text-teal-300 shrink-0" />
          <span>{lastSyncMessage}</span>
        </div>
      )}

      {/* Online with pending items badge (if syncing) */}
      {isOnline && pendingSyncCount > 0 && (
        <div className="fixed bottom-20 md:bottom-6 left-4 z-40 flex items-center gap-2 rounded-xl bg-teal-700 text-white px-3 py-1.5 text-xs font-medium shadow-md">
          <CloudUpload className="w-3.5 h-3.5 animate-bounce" />
          <span>Sincronizando {pendingSyncCount} publicación(es)...</span>
        </div>
      )}
    </>
  );
};
