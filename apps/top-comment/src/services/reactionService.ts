import { supabase } from "../supabase/client";
import { logger } from "../shared/utils/logger";
import type { ReactionEmoji } from "../shared/constants/reactions";
import { REACTION_EMOJIS } from "../shared/constants/reactions";

export interface RoomReaction {
  id: string;
  roomId: string;
  membershipId: string;
  emoji: ReactionEmoji;
  contextType: string;
  contextId: string | null;
  createdAt: string;
}

function mapReaction(data: Record<string, any>): RoomReaction {
  return {
    id: data.id,
    roomId: data.room_id,
    membershipId: data.membership_id,
    emoji: data.emoji as ReactionEmoji,
    contextType: data.context_type,
    contextId: data.context_id ?? null,
    createdAt: data.created_at,
  };
}

async function submitReaction(
  roomId: string,
  membershipId: string,
  emoji: ReactionEmoji,
  contextType: string = 'general',
  contextId?: string
): Promise<RoomReaction> {
  if (!REACTION_EMOJIS.includes(emoji)) {
    throw new Error(`Invalid reaction emoji: ${emoji}`);
  }

  const { data, error } = await (supabase as any)
    .from('room_reactions')
    .insert({
      room_id: roomId,
      membership_id: membershipId,
      emoji,
      context_type: contextType,
      context_id: contextId ?? null,
    })
    .select()
    .single();

  if (error) {
    logger.error('Failed to submit reaction', { error: error.message });
    throw new Error(`Failed to submit reaction: ${error.message}`);
  }

  return mapReaction(data);
}

async function getRecentReactions(
  roomId: string,
  sinceSeconds: number = 30
): Promise<RoomReaction[]> {
  const since = new Date(Date.now() - sinceSeconds * 1000).toISOString();

  const { data, error } = await (supabase as any)
    .from('room_reactions')
    .select('*')
    .eq('room_id', roomId)
    .gte('created_at', since)
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) {
    logger.error('Failed to fetch recent reactions', { error: error.message });
    throw new Error(`Failed to fetch reactions: ${error.message}`);
  }

  return (data || []).map(mapReaction);
}

export const reactionService = {
  submitReaction,
  getRecentReactions,
};
