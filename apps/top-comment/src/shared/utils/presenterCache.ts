const CACHE_PREFIX = 'presenter_';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

export interface PresenterCacheData {
  sessionId: string;
  sessionStatus: string;
  roomCode: string;
  roomName?: string;
  leaderboard: any[];
  interactions: any[];
  timestamp: number;
}

function getCacheKey(sessionId: string): string {
  return `${CACHE_PREFIX}${sessionId}`;
}

export function savePresenterCache(sessionId: string, data: Omit<PresenterCacheData, 'timestamp'>): void {
  try {
    const entry: PresenterCacheData = { ...data, timestamp: Date.now() };
    localStorage.setItem(getCacheKey(sessionId), JSON.stringify(entry));
  } catch {
    // localStorage may be full or unavailable
  }
}

export function loadPresenterCache(sessionId: string): PresenterCacheData | null {
  try {
    const raw = localStorage.getItem(getCacheKey(sessionId));
    if (!raw) return null;

    const data: PresenterCacheData = JSON.parse(raw);

    // Check TTL
    if (Date.now() - data.timestamp > CACHE_TTL_MS) {
      localStorage.removeItem(getCacheKey(sessionId));
      return null;
    }

    return data;
  } catch {
    return null;
  }
}

export function clearPresenterCache(sessionId: string): void {
  try {
    localStorage.removeItem(getCacheKey(sessionId));
  } catch {
    // ignore
  }
}

export function clearStalePresenterCaches(): void {
  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(CACHE_PREFIX)) {
        const raw = localStorage.getItem(key);
        if (raw) {
          try {
            const data = JSON.parse(raw);
            if (Date.now() - data.timestamp > CACHE_TTL_MS) {
              keysToRemove.push(key);
            }
          } catch {
            keysToRemove.push(key);
          }
        }
      }
    }
    keysToRemove.forEach((k) => localStorage.removeItem(k));
  } catch {
    // ignore
  }
}
