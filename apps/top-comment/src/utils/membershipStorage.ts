// Persistent same-device room membership cache.
// Stores a mapping of roomCode -> membershipId so a returning player on the
// same device can recover their identity without re-entering a name.
//
// Schema is intentionally minimal. Server-side recovery (magic link / OTP)
// uses `room_memberships.user_id` FK and does not rely on this.

const STORAGE_KEY = 'social_memberships';

type MembershipMap = Record<string, string>; // roomCode (normalized upper) -> membershipId

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

function normalizeRoomCode(roomCode: string): string {
  return roomCode.trim().toUpperCase();
}

export function storeMembership(roomCode: string, membershipId: string): void {
  if (!roomCode || !membershipId) return;
  const map = readMap();
  map[normalizeRoomCode(roomCode)] = membershipId;
  writeMap(map);
}

export function getStoredMembershipId(roomCode: string): string | null {
  if (!roomCode) return null;
  const map = readMap();
  return map[normalizeRoomCode(roomCode)] ?? null;
}

export function clearMembership(roomCode: string): void {
  if (!roomCode) return;
  const map = readMap();
  delete map[normalizeRoomCode(roomCode)];
  writeMap(map);
}

export function clearAllMemberships(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}
