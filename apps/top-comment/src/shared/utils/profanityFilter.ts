import wordlist from '../data/profanity-wordlist.json';

export type ProfanityLevel = 'strict' | 'moderate' | 'off';

const wordSets: Record<Exclude<ProfanityLevel, 'off'>, Set<string>> = {
  strict: new Set(wordlist.strict.map(w => w.toLowerCase())),
  moderate: new Set(wordlist.moderate.map(w => w.toLowerCase())),
};

function getWordSet(level: ProfanityLevel): Set<string> | null {
  if (level === 'off') return null;
  return wordSets[level];
}

function buildRegex(words: Set<string>): RegExp {
  const escaped = Array.from(words)
    .sort((a, b) => b.length - a.length) // longest first to match "motherfucker" before "fuck"
    .map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  return new RegExp(`\\b(${escaped.join('|')})\\b`, 'gi');
}

const regexCache = new Map<ProfanityLevel, RegExp>();

function getRegex(level: Exclude<ProfanityLevel, 'off'>): RegExp {
  if (!regexCache.has(level)) {
    regexCache.set(level, buildRegex(wordSets[level]));
  }
  return regexCache.get(level)!;
}

/**
 * Check if text contains profanity at the given strictness level.
 */
export function containsProfanity(text: string, level: ProfanityLevel = 'moderate'): boolean {
  if (level === 'off') return false;
  const words = getWordSet(level);
  if (!words) return false;
  return getRegex(level).test(text);
}

/**
 * Replace profane words with '***'.
 */
export function censorText(text: string, level: ProfanityLevel = 'moderate'): string {
  if (level === 'off') return text;
  const words = getWordSet(level);
  if (!words) return text;
  return text.replace(getRegex(level), '***');
}

/**
 * Convenience: censor text using a room's profanity filter setting.
 * Falls back to 'moderate' if no setting provided.
 */
export function censorWithRoomSetting(
  text: string,
  roomProfanityFilter?: ProfanityLevel
): string {
  return censorText(text, roomProfanityFilter ?? 'moderate');
}
