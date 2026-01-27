import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../../supabase/client';
import type { Answer, Venue } from '@social/db';

interface UseVenueWallResult {
  venue: Venue | null;
  answers: Answer[];
  submitComment: (content: string) => Promise<void>;
  loading: boolean;
}

export function useVenueWall(venueKey?: string): UseVenueWallResult {
  const [venue, setVenue] = useState<Venue | null>(null);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [loading, setLoading] = useState(true);

  // Find venue by slug
  useEffect(() => {
    if (!venueKey) {
      setLoading(false);
      return;
    }

    const findVenue = async () => {
      const { data, error } = await supabase
        .from('venues')
        .select('*')
        .eq('slug', venueKey)
        .single();

      if (error) {
        console.error('Error finding venue:', error);
        setLoading(false);
        return;
      }

      setVenue(data);
      setLoading(false);
    };

    findVenue();
  }, [venueKey]);

  // Subscribe to answers for this venue
  useEffect(() => {
    if (!venue?.id) return;

    const fetchAnswers = async () => {
      const { data, error } = await supabase
        .from('answers')  // Updated: submissions → answers
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (!error && data) {
        setAnswers(data.slice(0, 20));
      }
    };

    fetchAnswers();

    const channel = supabase
      .channel(`wall-${venue.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'answers',  // Updated: submissions → answers
        },
        (payload) => {
          if (payload.new) {
            setAnswers(prev => [payload.new as Answer, ...prev.slice(0, 49)]);
          }
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [venue?.id]);

  const submitComment = useCallback(async (content: string) => {
    if (!venue?.id || !content.trim()) return;

    try {
      console.log('Would submit comment:', content, 'for venue:', venue.name);

      const mockAnswer: Answer = {
        id: Date.now().toString(),
        session_id: 'demo-session',
        team_id: 'demo-team',  // Updated: player_id → team_id
        round_index: 0,        // Updated: round_number → round_index
        text: content.trim(),  // Updated: content → text
        group_id: 'demo-group',
        masked: false,         // Updated: is_moderated → masked
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      setAnswers(prev => [mockAnswer, ...prev]);
    } catch (error) {
      console.error('Error submitting comment:', error);
    }
  }, [venue?.id, venue?.name]);

  return {
    venue,
    answers,
    submitComment,
    loading,
  };
}



