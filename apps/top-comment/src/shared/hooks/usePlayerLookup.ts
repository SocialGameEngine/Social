import { useMemo } from "react";
import type { RoomMembership } from "../types";

/**
 * Creates a map of player IDs to display names for quick lookup
 * Used by HostPage and PresenterPage for displaying player information
 */
export function usePlayerLookup(players: RoomMembership[]): Map<string, string> {
  return useMemo(() => {
    const map = new Map<string, string>();
    players.forEach((player) => {
      map.set(player.id, player.playerName);
    });
    return map;
  }, [players]);
}
