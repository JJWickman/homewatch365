import React from 'react';
import { useOffline } from './OfflineProvider';
import { WifiOff, RefreshCw, CloudOff, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function OfflineBanner() {
  const { isOnline, pendingChanges, syncing, syncChanges } = useOffline();

  if (isOnline && pendingChanges.length === 0) return null;

  return (
    <div className={`px-4 py-2 flex items-center justify-between text-sm ${
      isOnline ? 'bg-amber-50 border-b border-amber-200' : 'bg-red-50 border-b border-red-200'
    }`}>
      <div className="flex items-center gap-2">
        {isOnline ? (
          <>
            <RefreshCw className={`h-4 w-4 text-amber-600 ${syncing ? 'animate-spin' : ''}`} />
            <span className="text-amber-800">
              {syncing ? 'Syncing changes...' : `${pendingChanges.length} change${pendingChanges.length !== 1 ? 's' : ''} pending sync`}
            </span>
          </>
        ) : (
          <>
            <WifiOff className="h-4 w-4 text-red-600" />
            <span className="text-red-800">
              You're offline. Changes will sync when you reconnect.
              {pendingChanges.length > 0 && ` (${pendingChanges.length} pending)`}
            </span>
          </>
        )}
      </div>

      {isOnline && pendingChanges.length > 0 && !syncing && (
        <Button
          size="sm"
          variant="outline"
          onClick={syncChanges}
          className="h-7 text-xs bg-white"
        >
          <RefreshCw className="h-3 w-3 mr-1" />
          Sync Now
        </Button>
      )}
    </div>
  );
}