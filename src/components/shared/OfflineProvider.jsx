import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';

const OfflineContext = createContext({
  isOnline: true,
  pendingChanges: [],
  syncChanges: () => {},
  cacheData: () => {},
  getCachedData: () => null,
  queueChange: () => {}
});

export const useOffline = () => useContext(OfflineContext);

const CACHE_KEY = 'offline_cache';
const PENDING_KEY = 'offline_pending';
const CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours

export default function OfflineProvider({ children }) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingChanges, setPendingChanges] = useState([]);
  const [syncing, setSyncing] = useState(false);

  // Load pending changes from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(PENDING_KEY);
    if (stored) {
      setPendingChanges(JSON.parse(stored));
    }
  }, []);

  // Listen for online/offline events
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // Auto-sync when coming back online
      syncChanges();
    };
    
    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Cache data for offline use
  const cacheData = useCallback((key, data) => {
    try {
      const cache = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}');
      cache[key] = {
        data,
        timestamp: Date.now()
      };
      localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
    } catch (error) {
      console.error('Error caching data:', error);
    }
  }, []);

  // Get cached data
  const getCachedData = useCallback((key) => {
    try {
      const cache = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}');
      const entry = cache[key];
      
      if (!entry) return null;
      
      // Check if cache is expired
      if (Date.now() - entry.timestamp > CACHE_EXPIRY) {
        delete cache[key];
        localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
        return null;
      }
      
      return entry.data;
    } catch (error) {
      console.error('Error reading cache:', error);
      return null;
    }
  }, []);

  // Queue a change for later sync
  const queueChange = useCallback((entityName, action, data) => {
    const change = {
      id: Date.now().toString(),
      entityName,
      action, // 'create', 'update', 'delete'
      data,
      timestamp: Date.now()
    };

    setPendingChanges(prev => {
      const updated = [...prev, change];
      localStorage.setItem(PENDING_KEY, JSON.stringify(updated));
      return updated;
    });

    return change.id;
  }, []);

  // Sync pending changes to server
  const syncChanges = useCallback(async () => {
    if (!navigator.onLine || syncing || pendingChanges.length === 0) return;

    setSyncing(true);
    const failedChanges = [];

    for (const change of pendingChanges) {
      try {
        const entity = base44.entities[change.entityName];
        
        switch (change.action) {
          case 'create':
            await entity.create(change.data);
            break;
          case 'update':
            await entity.update(change.data.id, change.data);
            break;
          case 'delete':
            await entity.delete(change.data.id);
            break;
        }
      } catch (error) {
        console.error('Failed to sync change:', error);
        failedChanges.push(change);
      }
    }

    setPendingChanges(failedChanges);
    localStorage.setItem(PENDING_KEY, JSON.stringify(failedChanges));
    setSyncing(false);
  }, [pendingChanges, syncing]);

  // Clear specific cached data
  const clearCache = useCallback((key) => {
    try {
      if (key) {
        const cache = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}');
        delete cache[key];
        localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
      } else {
        localStorage.removeItem(CACHE_KEY);
      }
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  }, []);

  return (
    <OfflineContext.Provider value={{
      isOnline,
      pendingChanges,
      syncing,
      syncChanges,
      cacheData,
      getCachedData,
      queueChange,
      clearCache
    }}>
      {children}
    </OfflineContext.Provider>
  );
}