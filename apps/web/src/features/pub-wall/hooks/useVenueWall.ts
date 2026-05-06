import { useState, useEffect, useCallback } from 'react';
import type { Answer, Venue } from '@social/db';

interface UseVenueWallResult {
  venue: Venue | null;
  answers: Answer[];
  submitComment: (content: string) => Promise<void>;
  loading: boolean;
}

/**
 * Legacy hook for pub-wall feature
 * Note: venues and answers tables no longer exist in current schema
 * This hook is kept for backwards compatibility but returns empty data
 */
export function useVenueWall(venueKey?: string): UseVenueWallResult {
  const [venue] = useState<Venue | null>(null);
  const [answers] = useState<Answer[]>([]);
  const [loading, setLoading] = useState(true);

  // Find venue by slug - disabled (table doesn't exist)
  useEffect(() => {
    if (!venueKey) {
      setLoading(false);
      return;
    }

    // Legacy venues table no longer exists
    console.warn('useVenueWall: venues table no longer exists');
    setLoading(false);
  }, [venueKey]);

  // Subscribe to answers for this venue - disabled (table doesn't exist)
  useEffect(() => {
    if (!venue?.id) return;

    // Legacy answers table no longer exists
    console.warn('useVenueWall: answers table no longer exists');
  }, [venue?.id]);

  const submitComment = useCallback(async (content: string) => {
    if (!venue?.id || !content.trim()) return;

    // Legacy feature - no longer functional
    console.warn('useVenueWall: submitComment is deprecated - answers table no longer exists');
  }, [venue?.id]);

  return {
    venue,
    answers,
    submitComment,
    loading,
  };
}



