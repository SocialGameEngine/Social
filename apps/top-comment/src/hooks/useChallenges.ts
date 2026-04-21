import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../supabase/client';
import { challengeService } from '../services/challengeService';
import type { Interaction } from '../shared/types';

interface UseChallengesOptions {
  roomId: string | undefined;
  membershipId: string | undefined;
}

export function useChallenges({ roomId, membershipId }: UseChallengesOptions) {
  const [pendingChallenges, setPendingChallenges] = useState<Interaction[]>([]);
  const [sentChallenges, setSentChallenges] = useState<Interaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const pendingCount = pendingChallenges.length;

  // Load challenges
  useEffect(() => {
    if (!roomId || !membershipId) {
      setPendingChallenges([]);
      setSentChallenges([]);
      return;
    }

    setIsLoading(true);
    Promise.all([
      challengeService.getChallengesForPlayer(roomId, membershipId),
      challengeService.getSentChallenges(roomId, membershipId),
    ])
      .then(([pending, sent]) => {
        setPendingChallenges(pending);
        setSentChallenges(sent);
      })
      .catch((err) => console.error('Failed to load challenges:', err))
      .finally(() => setIsLoading(false));
  }, [roomId, membershipId]);

  // Real-time subscription for challenge updates
  useEffect(() => {
    if (!roomId || !membershipId) return;

    const channel = supabase
      .channel(`challenges:${roomId}:${membershipId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'interactions',
          filter: `room_id=eq.${roomId}`,
        },
        (payload) => {
          const raw = payload.new as Record<string, any>;
          if (raw?.type !== 'challenge') return;

          const interaction: Interaction = {
            id: raw.id,
            roomId: raw.room_id,
            createdBy: raw.created_by,
            type: raw.type,
            status: raw.status,
            question: raw.question,
            description: raw.description,
            settings: raw.settings,
            responseCount: raw.response_count || 0,
            voteCount: raw.vote_count || 0,
            answerEndsAt: raw.answer_ends_at,
            answerSeconds: raw.answer_seconds,
            votingEndsAt: raw.voting_ends_at,
            votingSeconds: raw.voting_seconds,
            createdAt: raw.created_at,
            closedAt: raw.closed_at,
            targetType: raw.target_type ?? 'broadcast',
            targetMembershipId: raw.target_membership_id ?? null,
            sourceMembershipId: raw.source_membership_id ?? null,
            challengeStatus: raw.challenge_status ?? null,
            challengeExpiresAt: raw.challenge_expires_at ?? null,
            pointsWager: raw.points_wager ?? 0,
          };

          // Update pending challenges (targeted at me)
          if (raw.target_membership_id === membershipId) {
            if (raw.challenge_status === 'pending') {
              setPendingChallenges((prev) => {
                if (prev.some((c) => c.id === interaction.id)) {
                  return prev.map((c) => (c.id === interaction.id ? interaction : c));
                }
                return [interaction, ...prev];
              });
            } else {
              setPendingChallenges((prev) => prev.filter((c) => c.id !== interaction.id));
            }
          }

          // Update sent challenges (from me)
          if (raw.source_membership_id === membershipId) {
            if (['pending', 'accepted'].includes(raw.challenge_status)) {
              setSentChallenges((prev) => {
                if (prev.some((c) => c.id === interaction.id)) {
                  return prev.map((c) => (c.id === interaction.id ? interaction : c));
                }
                return [interaction, ...prev];
              });
            } else {
              setSentChallenges((prev) => prev.filter((c) => c.id !== interaction.id));
            }
          }
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      channel.unsubscribe();
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [roomId, membershipId]);

  // Auto-expire pending challenges
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setPendingChallenges((prev) =>
        prev.filter((c) => {
          if (!c.challengeExpiresAt) return true;
          return new Date(c.challengeExpiresAt).getTime() > now;
        })
      );
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const sendChallenge = useCallback(
    async (targetMembershipId: string, question: string, pointsWager?: number) => {
      if (!roomId || !membershipId) return;
      const challenge = await challengeService.sendChallenge({
        roomId,
        sourceMembershipId: membershipId,
        targetMembershipId,
        question,
        pointsWager,
      });
      setSentChallenges((prev) => [challenge, ...prev]);
      return challenge;
    },
    [roomId, membershipId]
  );

  const acceptChallenge = useCallback(async (interactionId: string) => {
    await challengeService.respondToChallenge(interactionId, true);
    setPendingChallenges((prev) => prev.filter((c) => c.id !== interactionId));
  }, []);

  const declineChallenge = useCallback(async (interactionId: string) => {
    await challengeService.respondToChallenge(interactionId, false);
    setPendingChallenges((prev) => prev.filter((c) => c.id !== interactionId));
  }, []);

  return {
    pendingChallenges,
    sentChallenges,
    pendingCount,
    isLoading,
    sendChallenge,
    acceptChallenge,
    declineChallenge,
  };
}
