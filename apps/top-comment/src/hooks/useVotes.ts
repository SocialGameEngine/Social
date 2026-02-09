import { useEffect, useState } from "react";
import { supabase } from "../supabase/client";
import type { InteractionVote } from "../shared/types";
import { interactionService } from "../services/interactionService";

interface UseVotesOptions {
  interactionId?: string;
}

export function useVotes({ interactionId }: UseVotesOptions) {
  const [votes, setVotes] = useState<InteractionVote[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!interactionId) {
      setVotes([]);
      return;
    }

    let mounted = true;

    async function loadVotes() {
      try {
        setIsLoading(true);
        setError(null);
        const votesData = await interactionService.getVotes(interactionId!);
        if (mounted) setVotes(votesData);
      } catch (err) {
        if (mounted) setError(err instanceof Error ? err.message : "Failed to load votes");
      } finally {
        if (mounted) setIsLoading(false);
      }
    }

    loadVotes();

    const channel = supabase
      .channel(`interaction_votes:${interactionId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "interaction_votes",
          filter: `interaction_id=eq.${interactionId}`,
        },
        () => {
          // Re-fetch on any change for simplicity
          loadVotes();
        }
      )
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, [interactionId]);

  const getVoteCounts = () => {
    const counts: Record<string, number> = {};
    votes.forEach((vote) => {
      counts[vote.responseId] = (counts[vote.responseId] || 0) + 1;
    });
    return counts;
  };

  const getTopResponses = (limit = 3) => {
    const counts = getVoteCounts();
    return Object.entries(counts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, limit)
      .map(([responseId, count]) => ({ responseId, count }));
  };

  return {
    votes,
    isLoading,
    error,
    voteCount: votes.length,
    getVoteCounts,
    getTopResponses,
  };
}
