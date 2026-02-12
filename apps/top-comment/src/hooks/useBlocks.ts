import { useState, useEffect, useCallback } from 'react';
import { reportService, type PlayerBlock } from '../services/reportService';

interface UseBlocksOptions {
  membershipId: string | undefined;
  roomId: string | undefined;
}

export function useBlocks({ membershipId, roomId }: UseBlocksOptions) {
  const [blocks, setBlocks] = useState<PlayerBlock[]>([]);
  const [blockedIds, setBlockedIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);

  // Load blocked players
  useEffect(() => {
    if (!membershipId) {
      setBlocks([]);
      setBlockedIds(new Set());
      return;
    }

    setIsLoading(true);
    reportService
      .getBlockedPlayers(membershipId)
      .then((data) => {
        setBlocks(data);
        setBlockedIds(new Set(data.map((b) => b.blockedMembershipId)));
      })
      .catch((err) => {
        console.error('Failed to load blocks:', err);
      })
      .finally(() => setIsLoading(false));
  }, [membershipId]);

  const blockPlayer = useCallback(
    async (blockedMembershipId: string) => {
      if (!membershipId || !roomId) return;
      const block = await reportService.blockPlayer(membershipId, blockedMembershipId, roomId);
      setBlocks((prev) => [...prev, block]);
      setBlockedIds((prev) => new Set(prev).add(blockedMembershipId));
    },
    [membershipId, roomId]
  );

  const unblockPlayer = useCallback(
    async (blockedMembershipId: string) => {
      if (!membershipId) return;
      await reportService.unblockPlayer(membershipId, blockedMembershipId);
      setBlocks((prev) => prev.filter((b) => b.blockedMembershipId !== blockedMembershipId));
      setBlockedIds((prev) => {
        const next = new Set(prev);
        next.delete(blockedMembershipId);
        return next;
      });
    },
    [membershipId]
  );

  const isBlocked = useCallback(
    (targetMembershipId: string) => blockedIds.has(targetMembershipId),
    [blockedIds]
  );

  return { blocks, blockedIds, blockPlayer, unblockPlayer, isBlocked, isLoading };
}
