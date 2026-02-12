import { supabase } from "../supabase/client";
import { logger } from "../shared/utils/logger";
import { createRateLimiter } from "../shared/utils/rateLimiter";
import { RATE_LIMITS } from "../shared/constants/rateLimits";

const reportLimiter = createRateLimiter(RATE_LIMITS.report.maxActions, RATE_LIMITS.report.windowMs);

export type ReportReason = 'inappropriate' | 'spam' | 'harassment' | 'cheating' | 'other';
export type ReportStatus = 'pending' | 'reviewed' | 'actioned' | 'dismissed';
export type ReportContentType = 'player' | 'chat_message' | 'response' | 'interaction';
export type ReportAction = 'none' | 'warned' | 'muted' | 'kicked' | 'banned';

export interface Report {
  id: string;
  roomId: string;
  reporterMembershipId: string;
  reportedMembershipId: string | null;
  contentType: ReportContentType;
  contentId: string | null;
  reason: ReportReason;
  description: string | null;
  status: ReportStatus;
  reviewedBy: string | null;
  reviewedAt: string | null;
  actionTaken: ReportAction | null;
  createdAt: string;
}

export interface PlayerBlock {
  id: string;
  blockerMembershipId: string;
  blockedMembershipId: string;
  roomId: string;
  createdAt: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapReport(data: Record<string, any>): Report {
  return {
    id: data.id,
    roomId: data.room_id,
    reporterMembershipId: data.reporter_membership_id,
    reportedMembershipId: data.reported_membership_id ?? null,
    contentType: data.content_type,
    contentId: data.content_id ?? null,
    reason: data.reason,
    description: data.description ?? null,
    status: data.status,
    reviewedBy: data.reviewed_by ?? null,
    reviewedAt: data.reviewed_at ?? null,
    actionTaken: data.action_taken ?? null,
    createdAt: data.created_at,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapBlock(data: Record<string, any>): PlayerBlock {
  return {
    id: data.id,
    blockerMembershipId: data.blocker_membership_id,
    blockedMembershipId: data.blocked_membership_id,
    roomId: data.room_id,
    createdAt: data.created_at,
  };
}

async function submitReport(params: {
  roomId: string;
  reporterMembershipId: string;
  reportedMembershipId?: string;
  contentType: ReportContentType;
  contentId?: string;
  reason: ReportReason;
  description?: string;
}): Promise<Report> {
  if (!reportLimiter.canAct()) {
    throw new Error('You have submitted too many reports recently. Please wait.');
  }

  const { data, error } = await (supabase as any)
    .from('reports')
    .insert({
      room_id: params.roomId,
      reporter_membership_id: params.reporterMembershipId,
      reported_membership_id: params.reportedMembershipId ?? null,
      content_type: params.contentType,
      content_id: params.contentId ?? null,
      reason: params.reason,
      description: params.description ?? null,
    })
    .select()
    .single();

  if (error) {
    logger.error('Failed to submit report', { error: error.message });
    throw new Error(`Failed to submit report: ${error.message}`);
  }

  return mapReport(data);
}

async function getReportsForRoom(
  roomId: string,
  status?: ReportStatus
): Promise<Report[]> {
  let query = (supabase as any)
    .from('reports')
    .select('*')
    .eq('room_id', roomId)
    .order('created_at', { ascending: false });

  if (status) {
    query = query.eq('status', status);
  }

  const { data, error } = await query;

  if (error) {
    logger.error('Failed to fetch reports', { error: error.message });
    throw new Error(`Failed to fetch reports: ${error.message}`);
  }

  return (data || []).map(mapReport);
}

async function reviewReport(
  reportId: string,
  action: ReportAction,
  reviewerMembershipId: string
): Promise<Report> {
  const { data, error } = await (supabase as any)
    .from('reports')
    .update({
      status: 'actioned',
      action_taken: action,
      reviewed_by: reviewerMembershipId,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', reportId)
    .select()
    .single();

  if (error) {
    logger.error('Failed to review report', { error: error.message });
    throw new Error(`Failed to review report: ${error.message}`);
  }

  return mapReport(data);
}

async function dismissReport(
  reportId: string,
  reviewerMembershipId: string
): Promise<Report> {
  const { data, error } = await (supabase as any)
    .from('reports')
    .update({
      status: 'dismissed',
      reviewed_by: reviewerMembershipId,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', reportId)
    .select()
    .single();

  if (error) {
    logger.error('Failed to dismiss report', { error: error.message });
    throw new Error(`Failed to dismiss report: ${error.message}`);
  }

  return mapReport(data);
}

async function blockPlayer(
  blockerMembershipId: string,
  blockedMembershipId: string,
  roomId: string
): Promise<PlayerBlock> {
  const { data, error } = await (supabase as any)
    .from('player_blocks')
    .insert({
      blocker_membership_id: blockerMembershipId,
      blocked_membership_id: blockedMembershipId,
      room_id: roomId,
    })
    .select()
    .single();

  if (error) {
    logger.error('Failed to block player', { error: error.message });
    throw new Error(`Failed to block player: ${error.message}`);
  }

  return mapBlock(data);
}

async function unblockPlayer(
  blockerMembershipId: string,
  blockedMembershipId: string
): Promise<void> {
  const { error } = await (supabase as any)
    .from('player_blocks')
    .delete()
    .eq('blocker_membership_id', blockerMembershipId)
    .eq('blocked_membership_id', blockedMembershipId);

  if (error) {
    logger.error('Failed to unblock player', { error: error.message });
    throw new Error(`Failed to unblock player: ${error.message}`);
  }
}

async function getBlockedPlayers(membershipId: string): Promise<PlayerBlock[]> {
  const { data, error } = await (supabase as any)
    .from('player_blocks')
    .select('*')
    .eq('blocker_membership_id', membershipId);

  if (error) {
    logger.error('Failed to fetch blocked players', { error: error.message });
    throw new Error(`Failed to fetch blocked players: ${error.message}`);
  }

  return (data || []).map(mapBlock);
}

export const reportService = {
  submitReport,
  getReportsForRoom,
  reviewReport,
  dismissReport,
  blockPlayer,
  unblockPlayer,
  getBlockedPlayers,
};
