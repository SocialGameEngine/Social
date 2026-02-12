import { supabase } from "../supabase/client";
import { BADGE_DEFINITIONS, type BadgeDefinition } from "../shared/data/badges";

export interface PlayerBadge {
  id: string;
  userId: string;
  roomId: string;
  badgeId: string;
  awardedAt: string;
  badge: BadgeDefinition;
}

/** Fetch all badges for a user in a room */
export async function getPlayerBadges(userId: string, roomId: string): Promise<PlayerBadge[]> {
  const { data, error } = await (supabase as any)
    .from("player_badges")
    .select("*")
    .eq("user_id", userId)
    .eq("room_id", roomId)
    .order("awarded_at", { ascending: false });

  if (error || !data) return [];

  return data
    .map((row: any) => {
      const badge = BADGE_DEFINITIONS.find((b) => b.id === row.badge_id);
      if (!badge) return null;
      return {
        id: row.id,
        userId: row.user_id,
        roomId: row.room_id,
        badgeId: row.badge_id,
        awardedAt: row.awarded_at,
        badge,
      };
    })
    .filter(Boolean) as PlayerBadge[];
}

/** Fetch badges for all users in a room (for lobby display) */
export async function getRoomBadges(roomId: string): Promise<Record<string, PlayerBadge[]>> {
  const { data, error } = await (supabase as any)
    .from("player_badges")
    .select("*")
    .eq("room_id", roomId);

  if (error || !data) return {};

  const result: Record<string, PlayerBadge[]> = {};
  for (const row of data) {
    const badge = BADGE_DEFINITIONS.find((b) => b.id === row.badge_id);
    if (!badge) continue;
    const pb: PlayerBadge = {
      id: row.id,
      userId: row.user_id,
      roomId: row.room_id,
      badgeId: row.badge_id,
      awardedAt: row.awarded_at,
      badge,
    };
    if (!result[row.user_id]) result[row.user_id] = [];
    result[row.user_id].push(pb);
  }
  return result;
}

/** Award a badge to a user (idempotent via unique constraint) */
export async function awardBadge(userId: string, roomId: string, badgeId: string): Promise<boolean> {
  const { error } = await (supabase as any)
    .from("player_badges")
    .insert({ user_id: userId, room_id: roomId, badge_id: badgeId })
    .select()
    .single();

  // Unique constraint violation means already awarded — that's fine
  if (error && error.code === "23505") return false;
  if (error) {
    console.error("Failed to award badge:", error);
    return false;
  }
  return true;
}

/** Get player stats for badge evaluation */
async function getPlayerStats(userId: string, roomId: string): Promise<Record<string, number>> {
  const stats: Record<string, number> = {};

  // Sessions played (from player_engagement_view)
  const { data: engagement } = await (supabase as any)
    .from("player_engagement_view")
    .select("sessions_played, total_score")
    .eq("room_id", roomId)
    .eq("user_id", userId)
    .single();

  if (engagement) {
    stats.sessions_played = Number(engagement.sessions_played) || 0;
    stats.total_score = Number(engagement.total_score) || 0;
  }

  // Wins (rounds won — approximate from top scores)
  const { count: winCount } = await supabase
    .from("top_comment_players")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .gt("score", 0);
  stats.wins = winCount || 0;

  // Chat messages
  const { count: chatCount } = await (supabase as any)
    .from("room_chat_messages")
    .select("*", { count: "exact", head: true })
    .eq("room_id", roomId)
    .eq("user_id", userId);
  stats.chat_messages = chatCount || 0;

  // Challenges sent
  const { count: challengeCount } = await supabase
    .from("interactions")
    .select("*", { count: "exact", head: true })
    .eq("room_id", roomId)
    .eq("source_membership_id", userId)
    .eq("type", "challenge");
  stats.challenges_sent = challengeCount || 0;

  // Reactions received
  const { count: reactionCount } = await (supabase as any)
    .from("room_reactions")
    .select("*", { count: "exact", head: true })
    .eq("room_id", roomId)
    .eq("target_membership_id", userId);
  stats.reactions_received = reactionCount || 0;

  // Submissions approved
  const { count: subCount } = await (supabase as any)
    .from("audience_submissions")
    .select("*", { count: "exact", head: true })
    .eq("room_id", roomId)
    .eq("submitted_by", userId)
    .eq("status", "approved");
  stats.submissions_approved = subCount || 0;

  return stats;
}

/** Evaluate all badges for a user and award any newly earned ones */
export async function evaluateBadges(userId: string, roomId: string): Promise<string[]> {
  const [stats, existingBadges] = await Promise.all([
    getPlayerStats(userId, roomId),
    getPlayerBadges(userId, roomId),
  ]);

  const existingIds = new Set(existingBadges.map((b) => b.badgeId));
  const newlyAwarded: string[] = [];

  for (const badge of BADGE_DEFINITIONS) {
    if (existingIds.has(badge.id)) continue;

    const metricValue = stats[badge.criteria.metric] || 0;
    let earned = false;

    switch (badge.criteria.type) {
      case "count":
      case "milestone":
        earned = metricValue >= badge.criteria.value;
        break;
      case "streak":
        // Streaks are approximated by count for now
        earned = metricValue >= badge.criteria.value;
        break;
    }

    if (earned) {
      const awarded = await awardBadge(userId, roomId, badge.id);
      if (awarded) {
        newlyAwarded.push(badge.id);
      }
    }
  }

  return newlyAwarded;
}
