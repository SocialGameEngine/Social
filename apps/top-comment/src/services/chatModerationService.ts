import { supabase } from "../supabase/client";
import { logger } from "../shared/utils/logger";

async function hideMessage(messageId: string, hiddenBy: string): Promise<void> {
  const { error } = await (supabase as any)
    .from('room_messages')
    .update({
      is_hidden: true,
      hidden_by: hiddenBy,
      hidden_at: new Date().toISOString(),
    })
    .eq('id', messageId);

  if (error) {
    logger.error('Failed to hide message', { error: error.message });
    throw new Error(`Failed to hide message: ${error.message}`);
  }
}

async function unhideMessage(messageId: string): Promise<void> {
  const { error } = await (supabase as any)
    .from('room_messages')
    .update({
      is_hidden: false,
      hidden_by: null,
      hidden_at: null,
    })
    .eq('id', messageId);

  if (error) {
    logger.error('Failed to unhide message', { error: error.message });
    throw new Error(`Failed to unhide message: ${error.message}`);
  }
}

async function muteMember(
  roomId: string,
  membershipId: string,
  mutedBy: string,
  expiresAt?: string
): Promise<void> {
  const { error } = await (supabase as any)
    .from('room_memberships')
    .update({
      is_muted: true,
      muted_at: new Date().toISOString(),
      muted_by: mutedBy,
      mute_expires_at: expiresAt ?? null,
    })
    .eq('id', membershipId)
    .eq('room_id', roomId);

  if (error) {
    logger.error('Failed to mute member', { error: error.message });
    throw new Error(`Failed to mute member: ${error.message}`);
  }
}

async function unmuteMember(roomId: string, membershipId: string): Promise<void> {
  const { error } = await (supabase as any)
    .from('room_memberships')
    .update({
      is_muted: false,
      muted_at: null,
      muted_by: null,
      mute_expires_at: null,
    })
    .eq('id', membershipId)
    .eq('room_id', roomId);

  if (error) {
    logger.error('Failed to unmute member', { error: error.message });
    throw new Error(`Failed to unmute member: ${error.message}`);
  }
}

export const chatModerationService = {
  hideMessage,
  unhideMessage,
  muteMember,
  unmuteMember,
};
