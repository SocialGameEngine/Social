import { supabase } from "../supabase/client";

export interface RoomAnalyticsSummary {
  roomId: string;
  roomCode: string;
  roomName: string;
  roomCreatedAt: string;
  totalSessions: number;
  uniquePlayers: number;
  avgPlayersPerSession: number;
  avgAnswerRate: number;
  avgVoteRate: number;
  avgSessionDurationSec: number;
  lastSessionAt: string | null;
}

export interface SessionDetail {
  sessionId: string;
  sessionCode: string;
  roomId: string;
  status: string;
  roundsPlayed: number;
  promptLibraryId: string | null;
  startedAt: string | null;
  endedAt: string | null;
  joinedCount: number | null;
  answerRate: number | null;
  voteRate: number | null;
  durationSec: number | null;
  dayOfWeek: number | null;
  hourOfDay: number | null;
}

export interface PlayerEngagement {
  roomId: string;
  userId: string;
  playerName: string;
  sessionsPlayed: number;
  firstPlayedAt: string | null;
  lastPlayedAt: string | null;
  totalScore: number;
}

export interface PeakTimeData {
  dayOfWeek: number;
  hourOfDay: number;
  sessionCount: number;
}

export interface LibraryUsage {
  promptLibraryId: string;
  sessionCount: number;
}

export interface RetentionMetrics {
  totalPlayers: number;
  returningPlayers: number;
  returnRate: number;
  avgSessionsPerPlayer: number;
}

/** Fetch room-level analytics summary */
export async function getRoomAnalyticsSummary(roomId: string): Promise<RoomAnalyticsSummary | null> {
  const { data, error } = await (supabase as any)
    .from("room_analytics_summary")
    .select("*")
    .eq("room_id", roomId)
    .single();

  if (error || !data) return null;

  return {
    roomId: data.room_id,
    roomCode: data.room_code,
    roomName: data.room_name,
    roomCreatedAt: data.room_created_at,
    totalSessions: Number(data.total_sessions) || 0,
    uniquePlayers: Number(data.unique_players) || 0,
    avgPlayersPerSession: Number(data.avg_players_per_session) || 0,
    avgAnswerRate: Number(data.avg_answer_rate) || 0,
    avgVoteRate: Number(data.avg_vote_rate) || 0,
    avgSessionDurationSec: Number(data.avg_session_duration_sec) || 0,
    lastSessionAt: data.last_session_at,
  };
}

/** Fetch session history for a room */
export async function getSessionHistory(
  roomId: string,
  limit = 50,
  offset = 0
): Promise<SessionDetail[]> {
  const { data, error } = await (supabase as any)
    .from("session_detail_view")
    .select("*")
    .eq("room_id", roomId)
    .order("started_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error || !data) return [];

  return data.map((row: any) => ({
    sessionId: row.session_id,
    sessionCode: row.session_code,
    roomId: row.room_id,
    status: row.status,
    roundsPlayed: Number(row.rounds_played) || 0,
    promptLibraryId: row.prompt_library_id,
    startedAt: row.started_at,
    endedAt: row.ended_at,
    joinedCount: row.joined_count != null ? Number(row.joined_count) : null,
    answerRate: row.answer_rate != null ? Number(row.answer_rate) : null,
    voteRate: row.vote_rate != null ? Number(row.vote_rate) : null,
    durationSec: row.duration_sec != null ? Number(row.duration_sec) : null,
    dayOfWeek: row.day_of_week != null ? Number(row.day_of_week) : null,
    hourOfDay: row.hour_of_day != null ? Number(row.hour_of_day) : null,
  }));
}

/** Fetch player engagement data for a room */
export async function getPlayerEngagement(
  roomId: string,
  limit = 50
): Promise<PlayerEngagement[]> {
  const { data, error } = await (supabase as any)
    .from("player_engagement_view")
    .select("*")
    .eq("room_id", roomId)
    .order("sessions_played", { ascending: false })
    .limit(limit);

  if (error || !data) return [];

  return data.map((row: any) => ({
    roomId: row.room_id,
    userId: row.user_id,
    playerName: row.player_name,
    sessionsPlayed: Number(row.sessions_played) || 0,
    firstPlayedAt: row.first_played_at,
    lastPlayedAt: row.last_played_at,
    totalScore: Number(row.total_score) || 0,
  }));
}

/** Compute peak times from session history */
export async function getPeakTimes(roomId: string): Promise<PeakTimeData[]> {
  const sessions = await getSessionHistory(roomId, 500);

  const counts: Record<string, number> = {};
  for (const s of sessions) {
    if (s.dayOfWeek != null && s.hourOfDay != null) {
      const key = `${s.dayOfWeek}-${s.hourOfDay}`;
      counts[key] = (counts[key] || 0) + 1;
    }
  }

  return Object.entries(counts).map(([key, count]) => {
    const [dow, hour] = key.split("-").map(Number);
    return { dayOfWeek: dow, hourOfDay: hour, sessionCount: count };
  });
}

/** Count prompt library usage across sessions */
export async function getPopularPromptLibraries(roomId: string): Promise<LibraryUsage[]> {
  const sessions = await getSessionHistory(roomId, 500);

  const counts: Record<string, number> = {};
  for (const s of sessions) {
    if (s.promptLibraryId) {
      counts[s.promptLibraryId] = (counts[s.promptLibraryId] || 0) + 1;
    }
  }

  return Object.entries(counts)
    .map(([id, count]) => ({ promptLibraryId: id, sessionCount: count }))
    .sort((a, b) => b.sessionCount - a.sessionCount);
}

/** Calculate player retention metrics */
export async function getRetentionMetrics(roomId: string): Promise<RetentionMetrics> {
  const players = await getPlayerEngagement(roomId, 10000);

  const totalPlayers = players.length;
  const returningPlayers = players.filter((p) => p.sessionsPlayed > 1).length;
  const returnRate = totalPlayers > 0 ? returningPlayers / totalPlayers : 0;
  const avgSessionsPerPlayer =
    totalPlayers > 0
      ? players.reduce((sum, p) => sum + p.sessionsPlayed, 0) / totalPlayers
      : 0;

  return { totalPlayers, returningPlayers, returnRate, avgSessionsPerPlayer };
}
