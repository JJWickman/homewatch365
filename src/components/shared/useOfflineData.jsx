import { useState, useEffect, useCallback } from 'react';
import { useOffline } from './OfflineProvider';
import { base44 } from '@/api/base44Client';

/**
 * Hook for fetching data with offline support
 * @param {string} entityName - Name of the entity to fetch
 * @param {object} options - Options for fetching
 * @param {object} options.filter - Filter conditions
 * @param {string} options.sort - Sort order
 * @param {number} options.limit - Max items to fetch
 * @param {boolean} options.enabled - Whether to fetch (default: true)
 */
export function useOfflineData(entityName, options = {}) {
  const { filter, sort, limit, enabled = true } = options;
  const { isOnline, cacheData, getCachedData, queueChange } = useOffline();
  
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isFromCache, setIsFromCache] = useState(false);

  // Generate cache key based on entity and filter
  const cacheKey = `${entityName}_${JSON.stringify(filter || {})}_${sort || ''}_${limit || ''}`;

  const fetchData = useCallback(async () => {
    if (!enabled) return;

    setLoading(true);
    setError(null);

    try {
      if (isOnline) {
        // Fetch from server
        const entity = base44.entities[entityName];
        let result;
        
        if (filter && Object.keys(filter).length > 0) {
          result = await entity.filter(filter, sort, limit);
        } else {
          result = await entity.list(sort, limit);
        }
        
        setData(result);
        setIsFromCache(false);
        
        // Cache the result for offline use
        cacheData(cacheKey, result);
      } else {
        // Load from cache
        const cached = getCachedData(cacheKey);
        if (cached) {
          setData(cached);
          setIsFromCache(true);
        } else {
          setError('No cached data available');
        }
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      
      // Try to load from cache on error
      const cached = getCachedData(cacheKey);
      if (cached) {
        setData(cached);
        setIsFromCache(true);
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  }, [entityName, cacheKey, isOnline, enabled, filter, sort, limit, cacheData, getCachedData]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Offline-aware mutation functions
  const create = useCallback(async (newData) => {
    if (isOnline) {
      const result = await base44.entities[entityName].create(newData);
      await fetchData(); // Refresh
      return result;
    } else {
      // Queue for later sync
      const tempId = `temp_${Date.now()}`;
      const tempData = { ...newData, id: tempId, _isOffline: true };
      
      queueChange(entityName, 'create', newData);
      
      // Optimistically update local state
      setData(prev => [...prev, tempData]);
      
      return tempData;
    }
  }, [isOnline, entityName, fetchData, queueChange]);

  const update = useCallback(async (id, updateData) => {
    if (isOnline) {
      const result = await base44.entities[entityName].update(id, updateData);
      await fetchData(); // Refresh
      return result;
    } else {
      // Queue for later sync
      queueChange(entityName, 'update', { id, ...updateData });
      
      // Optimistically update local state
      setData(prev => prev.map(item => 
        item.id === id ? { ...item, ...updateData, _isOffline: true } : item
      ));
      
      return { id, ...updateData };
    }
  }, [isOnline, entityName, fetchData, queueChange]);

  const remove = useCallback(async (id) => {
    if (isOnline) {
      await base44.entities[entityName].delete(id);
      await fetchData(); // Refresh
    } else {
      // Queue for later sync
      queueChange(entityName, 'delete', { id });
      
      // Optimistically update local state
      setData(prev => prev.filter(item => item.id !== id));
    }
  }, [isOnline, entityName, fetchData, queueChange]);

  return {
    data,
    loading,
    error,
    isFromCache,
    isOnline,
    refetch: fetchData,
    create,
    update,
    remove
  };
}