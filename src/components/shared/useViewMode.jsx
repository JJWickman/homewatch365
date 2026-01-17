import { useState, useEffect } from 'react';

const VIEW_MODES = {
  LIST: 'list',
  LARGE_TILES: 'large-tiles',
  SMALL_TILES: 'small-tiles'
};

export function useViewMode(pageKey, defaultMode = VIEW_MODES.LARGE_TILES) {
  const [viewMode, setViewMode] = useState(defaultMode);

  // Load saved preference on mount
  useEffect(() => {
    const savedMode = localStorage.getItem(`viewMode_${pageKey}`);
    if (savedMode && Object.values(VIEW_MODES).includes(savedMode)) {
      setViewMode(savedMode);
    }
  }, [pageKey]);

  // Save preference when it changes
  const handleViewChange = (newMode) => {
    setViewMode(newMode);
    localStorage.setItem(`viewMode_${pageKey}`, newMode);
  };

  return [viewMode, handleViewChange];
}

export { VIEW_MODES };