import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

export function useAutoSave(data, saveFunction, options = {}) {
  const {
    delay = 1500, // Debounce delay in milliseconds
    enabled = true,
    exclude = [] // Fields to exclude from auto-save tracking
  } = options;

  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const timeoutRef = useRef(null);
  const previousDataRef = useRef(data);
  const isInitialMount = useRef(true);

  useEffect(() => {
    // Skip on initial mount
    if (isInitialMount.current) {
      isInitialMount.current = false;
      previousDataRef.current = data;
      return;
    }

    // Filter out excluded fields for comparison
    const filterData = (obj) => {
      const filtered = { ...obj };
      exclude.forEach(key => delete filtered[key]);
      return filtered;
    };

    const currentFiltered = filterData(data);
    const previousFiltered = filterData(previousDataRef.current);

    // Check if data actually changed
    const hasChanged = JSON.stringify(currentFiltered) !== JSON.stringify(previousFiltered);

    if (!hasChanged || !enabled) {
      return;
    }

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new timeout for auto-save
    timeoutRef.current = setTimeout(async () => {
      setIsSaving(true);
      try {
        await saveFunction(data);
        setLastSaved(new Date());
        previousDataRef.current = data;
      } catch (error) {
        console.error('Auto-save failed:', error);
        toast.error('Auto-save failed. Please save manually.');
      } finally {
        setIsSaving(false);
      }
    }, delay);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [data, saveFunction, delay, enabled, exclude]);

  return { isSaving, lastSaved };
}