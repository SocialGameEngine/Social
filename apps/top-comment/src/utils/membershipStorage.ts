// Persistent same-device room membership cache.
// Stores a mapping of roomCode -> membershipId so a returning player on the
// same device can recover their identity without re-entering a name.
//
// Schema is intentionally minimal. Server-side recovery (magic link / OTP)
// uses `room_memberships.user_id` FK and does not rely on this.

const STORAGE_KEY = 'social_memberships';
const RECENCY_KEY = 'social_memberships_recency';

type MembershipMap = Record<string, string>; // roomCode (normalized upper) -> membershipId
type RecencyMap = Record<string, number>; // roomCode -> last-used timestamp (ms)

function readMap(): MembershipMap {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function writeMap(map: MembershipMap): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch {
    /* storage full / denied — fall back to fresh join next time */
  }
}

function readRecency(): RecencyMap {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(RECENCY_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function writeRecency(map: RecencyMap): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(RECENCY_KEY, JSON.stringify(map));
  } catch {
    /* ignore */
  }
}

function normalizeRoomCode(roomCode: string): string {
  return roomCode.trim().toUpperCase();
}

export function storeMembership(roomCode: string, membershipId: string): void {
  if (!roomCode || !membershipId) return;
  const code = normalizeRoomCode(roomCode);
  const map = readMap();
  map[code] = membershipId;
  writeMap(map);
  const recency = readRecency();
  recency[code] = Date.now();
  writeRecency(recency);
}

/**
 * Returns the most recently used (roomCode, membershipId) tuple, or null if
 * none exist. Used on EntryPage / JoinPage to offer "Welcome back" resume
 * without requiring a `?code=` query param (P1-18).
 */
export function getMostRecentMembership(): { roomCode: string; membershipId: string } | null {
  const map = readMap();
  const recency = readRecency();
  let bestCode: string | null = null;
  let bestTs = -Infinity;
  for (const code of Object.keys(map)) {
    const ts = recency[code] ?? 0;
    if (ts > bestTs) {
      bestTs = ts;
      bestCode = code;
    }
  }
  if (!bestCode) return null;
  const id = map[bestCode];
  if (!id) return null;
  return { roomCode: bestCode, membershipId: id };
}

/** Returns all stored (roomCode, membershipId) tuples ordered most-recent-first. */
export function listStoredMemberships(): Array<{ roomCode: string; membershipId: string; lastUsedMs: number }> {
  const map = readMap();
  const recency = readRecency();
  return Object.keys(map)
    .map((roomCode) => ({ roomCode, membershipId: map[roomCode]!, lastUsedMs: recency[roomCode] ?? 0 }))
    .sort((a, b) => b.lastUsedMs - a.lastUsedMs);
}

export function getStoredMembershipId(roomCode: string): string | null {
  if (!roomCode) return null;
  const map = readMap();
  return map[normalizeRoomCode(roomCode)] ?? null;
}

export function clearMembership(roomCode: string): void {
  if (!roomCode) return;
  const code = normalizeRoomCode(roomCode);
  const map = readMap();
  delete map[code];
  writeMap(map);
  const recency = readRecency();
  delete recency[code];
  writeRecency(recency);
}

export function clearAllMemberships(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
    window.localStorage.removeItem(RECENCY_KEY);
  } catch {
    /* ignore */
  }
}
