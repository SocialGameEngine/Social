import { useState, useEffect, useCallback } from "react";
import {
  getPlayerBadges,
  getRoomBadges,
  evaluateBadges,
  type PlayerBadge,
} from "../services/badgeService";

interface UseBadgesProps {
  userId?: string;
  roomId?: string;
}

export function useBadges({ userId, roomId }: UseBadgesProps) {
  const [myBadges, setMyBadges] = useState<PlayerBadge[]>([]);
  const [roomBadges, setRoomBadges] = useState<Record<string, PlayerBadge[]>>({});
  const [newlyAwarded, setNewlyAwarded] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchBadges = useCallback(async () => {
    if (!userId || !roomId) return;
    setIsLoading(true);
    try {
      const [mine, all] = await Promise.all([
        getPlayerBadges(userId, roomId),
        getRoomBadges(roomId),
      ]);
      setMyBadges(mine);
      setRoomBadges(all);
    } catch (err) {
      console.error("Failed to fetch badges:", err);
    } finally {
      setIsLoading(false);
    }
  }, [userId, roomId]);

  useEffect(() => {
    fetchBadges();
  }, [fetchBadges]);

  const evaluate = useCallback(async () => {
    if (!userId || !roomId) return [];
    try {
      const awarded = await evaluateBadges(userId, roomId);
      if (awarded.length > 0) {
        setNewlyAwarded(awarded);
        await fetchBadges();
      }
      return awarded;
    } catch (err) {
      console.error("Failed to evaluate badges:", err);
      return [];
    }
  }, [userId, roomId, fetchBadges]);

  const clearNewlyAwarded = useCallback(() => {
    setNewlyAwarded([]);
  }, []);

  return {
    myBadges,
    roomBadges,
    newlyAwarded,
    isLoading,
    evaluate,
    clearNewlyAwarded,
    refresh: fetchBadges,
  };
}
