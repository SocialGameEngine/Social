import { AppError } from "./utils.ts";

export function normalizeSelectedLibraries(input: unknown): string[] {
  const libs = Array.isArray(input) ? input : [];
  const strings = libs
    .filter((x: unknown): x is string => typeof x === "string")
    .map((x) => x.trim())
    .filter((x) => x.length > 0);

  return Array.from(new Set(strings));
}

export function requireValidMashupLibraries(input: unknown): string[] {
  const libs = normalizeSelectedLibraries(input);
  if (libs.length < 2 || libs.length > 6) {
    throw new AppError(
      400,
      "Mashup mode requires selecting 2-6 libraries",
      "invalid-argument",
    );
  }
  return libs;
}

export function getMashupLibraryForRound(
  selectedLibraries: string[],
  baseIndex: number,
  roundOffset: number,
): { libraryId: string; index: number } {
  const safeBase = Number.isFinite(baseIndex) ? baseIndex : 0;
  const index = (safeBase + roundOffset) % selectedLibraries.length;
  return { libraryId: selectedLibraries[index], index };
}

export function getNextMashupIndex(
  selectedLibraries: string[],
  currentIndex: number,
  shouldAdvance: boolean,
): number {
  const safe = Number.isFinite(currentIndex) ? currentIndex : 0;
  return shouldAdvance ? (safe + 1) % selectedLibraries.length : safe;
}

