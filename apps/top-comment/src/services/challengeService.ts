import { supabase } from "../supabase/client";
import { logger } from "../shared/utils/logger";
import { censorText } from "../shared/utils/profanityFilter";
import { createRateLimiter } from "../shared/utils/rateLimiter";
import type { Interaction } from "../domain/types/interaction.types";

const challengeLimiter = createRateLimiter(3, 60_000);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapInteraction(data: Record<string, any>): Interaction {
  return {
    id: data.id,
    roomId: data.room_id,
    createdBy: data.created_by,
    type: data.type,
    status: data.status,
    question: data.question,
    description: data.description,
    settings: data.settings,
    responseCount: data.response_count || 0,
    voteCount: data.vote_count || 0,
    answerEndsAt: data.answer_ends_at,
    answerSeconds: data.answer_seconds,
    votingEndsAt: data.voting_ends_at,
    votingSeconds: data.voting_seconds,
    createdAt: data.created_at,
    closedAt: data.closed_at,
    targetType: data.target_type ?? 'broadcast',
    targetMembershipId: data.target_membership_id ?? null,
    sourceMembershipId: data.source_membership_id ?? null,
    challengeStatus: data.challenge_status ?? null,
    challengeExpiresAt: data.challenge_expires_at ?? null,
    pointsWager: data.points_wager ?? 0,
  };
}

async function sendChallenge(params: {
  roomId: string;
  sourceMembershipId: string;
  targetMembershipId: string;
  question: string;
  pointsWager?: number;
  expiresInSeconds?: number;
}): Promise<Interaction> {
  if (!challengeLimiter.canAct()) {
    throw new Error('Slow down! You are sending challenges too fast.');
  }

  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) throw new Error("User not authenticated");

  const expiresIn = params.expiresInSeconds ?? 30;
  const filteredQuestion = censorText(params.question);

  const { data, error } = await (supabase as any)
    .from('interactions')
    .insert({
      room_id: params.roomId,
      created_by: userData.user.id,
      type: 'challenge',
      status: 'active',
      question: filteredQuestion,
      target_type: 'challenge',
      target_membership_id: params.targetMembershipId,
      source_membership_id: params.sourceMembershipId,
      challenge_status: 'pending',
      challenge_expires_at: new Date(Date.now() + expiresIn * 1000).toISOString(),
      points_wager: params.pointsWager ?? 0,
      answer_seconds: 60,
      answer_ends_at: new Date(Date.now() + (expiresIn + 60) * 1000).toISOString(),
    })
    .select()
    .single();

  if (error) {
    logger.error('Failed to send challenge', { error: error.message });
    throw new Error(`Failed to send challenge: ${error.message}`);
  }

  return mapInteraction(data);
}

async function respondToChallenge(
  interactionId: string,
  accept: boolean
): Promise<void> {
  const newStatus = accept ? 'accepted' : 'declined';
  const updates: Record<string, any> = {
    challenge_status: newStatus,
  };

  if (accept) {
    updates.answer_ends_at = new Date(Date.now() + 60 * 1000).toISOString();
  } else {
    updates.status = 'closed';
    updates.closed_at = new Date().toISOString();
  }

  const { error } = await (supabase as any)
    .from('interactions')
    .update(updates)
    .eq('id', interactionId);

  if (error) {
    logger.error('Failed to respond to challenge', { error: error.message });
    throw new Error(`Failed to respond to challenge: ${error.message}`);
  }
}

async function getChallengesForPlayer(
  roomId: string,
  membershipId: string
): Promise<Interaction[]> {
  const { data, error } = await (supabase as any)
    .from('interactions')
    .select('*')
    .eq('room_id', roomId)
    .eq('type', 'challenge')
    .eq('target_membership_id', membershipId)
    .eq('challenge_status', 'pending')
    .order('created_at', { ascending: false });

  if (error) {
    logger.error('Failed to fetch challenges', { error: error.message });
    throw new Error(`Failed to fetch challenges: ${error.message}`);
  }

  return (data || []).map(mapInteraction);
}

async function getSentChallenges(
  roomId: string,
  membershipId: string
): Promise<Interaction[]> {
  const { data, error } = await (supabase as any)
    .from('interactions')
    .select('*')
    .eq('room_id', roomId)
    .eq('type', 'challenge')
    .eq('source_membership_id', membershipId)
    .in('challenge_status', ['pending', 'accepted'])
    .order('created_at', { ascending: false });

  if (error) {
    logger.error('Failed to fetch sent challenges', { error: error.message });
    throw new Error(`Failed to fetch sent challenges: ${error.message}`);
  }

  return (data || []).map(mapInteraction);
}

async function resolveChallenge(interactionId: string): Promise<{
  winnerId: string | null;
  loserId: string | null;
  points: number;
}> {
  // Get the challenge interaction
  const { data: interaction, error: intError } = await (supabase as any)
    .from('interactions')
    .select('*')
    .eq('id', interactionId)
    .single();

  if (intError || !interaction) throw new Error('Challenge not found');

  // Get responses from both players
  const { data: responses, error: respError } = await (supabase as any)
    .from('responses')
    .select('*')
    .eq('interaction_id', interactionId);

  if (respError) throw new Error('Failed to fetch responses');

  // Get votes
  const { data: votes, error: voteError } = await (supabase as any)
    .from('interaction_votes')
    .select('*')
    .eq('interaction_id', interactionId);

  if (voteError) throw new Error('Failed to fetch votes');

  // Determine winner by vote count
  const voteCounts = new Map<string, number>();
  for (const v of (votes || [])) {
    const voteRecord = v as { response_id: string };
    voteCounts.set(voteRecord.response_id, (voteCounts.get(voteRecord.response_id) || 0) + 1);
  }

  let winnerId: string | null = null;
  let loserId: string | null = null;
  let maxVotes = 0;

  for (const r of (responses || [])) {
    const response = r as { id: string; membership_id: string };
    const count = voteCounts.get(response.id) || 0;
    if (count > maxVotes) {
      maxVotes = count;
      winnerId = response.membership_id;
    }
  }

  if (winnerId && responses && responses.length >= 2) {
    const typedResponses = responses as Array<{ membership_id: string }>;
    loserId = typedResponses.find((r) => r.membership_id !== winnerId)?.membership_id || null;
  }

  // Close the challenge
  await (supabase as any)
    .from('interactions')
    .update({
      status: 'closed',
      closed_at: new Date().toISOString(),
      challenge_status: 'accepted',
    })
    .eq('id', interactionId);

  return {
    winnerId,
    loserId,
    points: interaction.points_wager || 0,
  };
}

export const challengeService = {
  sendChallenge,
  respondToChallenge,
  getChallengesForPlayer,
  getSentChallenges,
  resolveChallenge,
};
