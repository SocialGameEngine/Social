import { supabase } from "../supabase/client";
import { logger } from "../shared/utils/logger";
import { censorText } from "../shared/utils/profanityFilter";
import { createRateLimiter } from "../shared/utils/rateLimiter";

const submitLimiter = createRateLimiter(3, 60_000);

export interface AudienceSubmission {
  id: string;
  roomId: string;
  membershipId: string;
  questionText: string;
  category: string | null;
  status: 'pending' | 'approved' | 'rejected' | 'used';
  reviewedBy: string | null;
  reviewedAt: string | null;
  rejectionReason: string | null;
  usedInInteractionId: string | null;
  createdAt: string;
  // Joined
  playerName?: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapSubmission(data: Record<string, any>): AudienceSubmission {
  const membership = data.room_memberships;
  return {
    id: data.id,
    roomId: data.room_id,
    membershipId: data.membership_id,
    questionText: data.question_text,
    category: data.category ?? null,
    status: data.status,
    reviewedBy: data.reviewed_by ?? null,
    reviewedAt: data.reviewed_at ?? null,
    rejectionReason: data.rejection_reason ?? null,
    usedInInteractionId: data.used_in_interaction_id ?? null,
    createdAt: data.created_at,
    playerName: membership?.player_name,
  };
}

async function submitQuestion(
  roomId: string,
  membershipId: string,
  questionText: string,
  category?: string
): Promise<AudienceSubmission> {
  if (!submitLimiter.canAct()) {
    throw new Error('Slow down! You are submitting questions too fast.');
  }

  const filtered = censorText(questionText);

  const { data, error } = await (supabase as any)
    .from('audience_submissions')
    .insert({
      room_id: roomId,
      membership_id: membershipId,
      question_text: filtered,
      category: category ?? null,
    })
    .select('*, room_memberships:membership_id(player_name)')
    .single();

  if (error) {
    logger.error('Failed to submit question', { error: error.message });
    throw new Error(`Failed to submit question: ${error.message}`);
  }

  return mapSubmission(data);
}

async function getSubmissions(
  roomId: string,
  status?: string
): Promise<AudienceSubmission[]> {
  let query = (supabase as any)
    .from('audience_submissions')
    .select('*, room_memberships:membership_id(player_name)')
    .eq('room_id', roomId)
    .order('created_at', { ascending: false });

  if (status) {
    query = query.eq('status', status);
  }

  const { data, error } = await query;

  if (error) {
    logger.error('Failed to fetch submissions', { error: error.message });
    throw new Error(`Failed to fetch submissions: ${error.message}`);
  }

  return (data || []).map(mapSubmission);
}

async function getMySubmissions(
  roomId: string,
  membershipId: string
): Promise<AudienceSubmission[]> {
  const { data, error } = await (supabase as any)
    .from('audience_submissions')
    .select('*')
    .eq('room_id', roomId)
    .eq('membership_id', membershipId)
    .order('created_at', { ascending: false });

  if (error) {
    logger.error('Failed to fetch my submissions', { error: error.message });
    throw new Error(`Failed to fetch submissions: ${error.message}`);
  }

  return (data || []).map(mapSubmission);
}

async function approveSubmission(
  submissionId: string,
  reviewerMembershipId: string
): Promise<AudienceSubmission> {
  const { data, error } = await (supabase as any)
    .from('audience_submissions')
    .update({
      status: 'approved',
      reviewed_by: reviewerMembershipId,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', submissionId)
    .select('*, room_memberships:membership_id(player_name)')
    .single();

  if (error) {
    logger.error('Failed to approve submission', { error: error.message });
    throw new Error(`Failed to approve submission: ${error.message}`);
  }

  return mapSubmission(data);
}

async function rejectSubmission(
  submissionId: string,
  reviewerMembershipId: string,
  reason?: string
): Promise<AudienceSubmission> {
  const { data, error } = await (supabase as any)
    .from('audience_submissions')
    .update({
      status: 'rejected',
      reviewed_by: reviewerMembershipId,
      reviewed_at: new Date().toISOString(),
      rejection_reason: reason ?? null,
    })
    .eq('id', submissionId)
    .select('*, room_memberships:membership_id(player_name)')
    .single();

  if (error) {
    logger.error('Failed to reject submission', { error: error.message });
    throw new Error(`Failed to reject submission: ${error.message}`);
  }

  return mapSubmission(data);
}

async function markUsed(
  submissionId: string,
  interactionId: string
): Promise<void> {
  const { error } = await (supabase as any)
    .from('audience_submissions')
    .update({
      status: 'used',
      used_in_interaction_id: interactionId,
    })
    .eq('id', submissionId);

  if (error) {
    logger.error('Failed to mark submission as used', { error: error.message });
    throw new Error(`Failed to mark submission as used: ${error.message}`);
  }
}

async function getApprovedSubmissions(roomId: string): Promise<AudienceSubmission[]> {
  return getSubmissions(roomId, 'approved');
}

export const audienceSubmissionService = {
  submitQuestion,
  getSubmissions,
  getMySubmissions,
  approveSubmission,
  rejectSubmission,
  markUsed,
  getApprovedSubmissions,
};
