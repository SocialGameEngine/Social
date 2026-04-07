import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import type { ReactNode } from 'react';
import { supabase } from '../../supabase/client';
import { logger } from '../../shared/utils/logger';
import { throttle } from '../../shared/utils/realtimeThrottle';

// Application types
interface VoteCounts {
  track_id: string;
  upvotes: number;
  downvotes: number;
  total_votes: number;
  net_votes: number;
  last_voted_at: string;
}

interface UserVote {
  track_id: string;
  room_id: string;
  membership_id: string;
  vote_type: 'up' | 'down';
  created_at: string;
  updated_at: string;
}

interface VotingContextType {
  voteCounts: Map<string, VoteCounts>;
  userVotes: Map<string, UserVote>;
  handleVote: (trackId: string, voteType: 'up' | 'down') => Promise<void>;
  getVoteCount: (trackId: string) => VoteCounts | undefined;
  getUserVote: (trackId: string) => 'up' | 'down' | null;
  isLoading: boolean;
  error: string | null;
}

const VotingContext = createContext<VotingContextType | undefined>(undefined);

export function useVoting() {
  const context = useContext(VotingContext);
  if (context === undefined) {
    throw new Error('useVoting must be used within a VotingProvider');
  }
  return context;
}

interface VotingProviderProps {
  children: ReactNode;
  room?: any;
  memberships?: any[];
}

export function VotingProvider({ children, room, memberships = [] }: VotingProviderProps) {
  const [voteCounts, setVoteCounts] = useState<Map<string, VoteCounts>>(new Map());
  const [userVotes, setUserVotes] = useState<Map<string, UserVote>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get current room and membership context
  const roomId = room?.id;
  const membership = memberships.find(m => room?.moderatorIds.includes(m.userId) || room?.creatorId === m.userId);
  const membershipId = membership?.id;

  const fetchVoteCounts = useCallback(async () => {
    try {
      if (!roomId) return;
      
      const { data, error } = await (supabase.rpc as any)('get_vote_counts_from_db', { p_room_id: roomId! });
      if (error) throw error;
      
      const countsMap = new Map<string, VoteCounts>();
      if (Array.isArray(data)) {
        data.forEach((count: any) => {
          countsMap.set(count.track_id, {
            track_id: count.track_id,
            upvotes: count.upvotes || 0,
            downvotes: count.downvotes || 0,
            total_votes: count.total_votes || 0,
            net_votes: (count.upvotes || 0) - (count.downvotes || 0),
            last_voted_at: count.last_voted_at || new Date().toISOString(),
          });
        });
      }
      setVoteCounts(countsMap);
    } catch (err) {
      logger.error('Error fetching vote counts', { error: err, roomId });
      setError('Failed to load vote counts');
    }
  }, [roomId]);

  const fetchUserVotes = useCallback(async () => {
    try {
      if (!roomId || !membershipId) return;

      const { data, error } = await (supabase.rpc as any)('get_user_votes_from_db', { 
        p_room_id: roomId!, 
        p_membership_id: membershipId! 
      });
      if (error) throw error;

      const votesMap = new Map<string, UserVote>();
      if (Array.isArray(data)) {
        data.forEach((vote: any) => {
          votesMap.set(vote.track_id, {
            track_id: vote.track_id,
            room_id: roomId,
            membership_id: membershipId,
            vote_type: vote.vote_type,
            created_at: vote.created_at,
            updated_at: vote.updated_at,
          });
        });
      }
      setUserVotes(votesMap);
    } catch (err) {
      logger.error('Error fetching user votes', { error: err, roomId, membershipId });
      setError('Failed to load user votes');
    }
  }, [roomId, membershipId]);

  const handleVote = async (trackId: string, voteType: 'up' | 'down') => {
    try {
      if (!roomId || !membershipId) throw new Error('No room or membership context found');

      const currentVote = userVotes.get(trackId);
      if (currentVote?.vote_type === voteType) {
        await removeVote(trackId);
        return;
      }

      const { error } = await (supabase.rpc as any)('vote_on_track', {
        p_room_id: roomId!,
        p_membership_id: membershipId!,
        p_track_id: trackId,
        p_vote_type: voteType
      });

      if (error) throw error;

      const newVote: UserVote = {
        track_id: trackId,
        room_id: roomId,
        membership_id: membershipId,
        vote_type: voteType,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      setUserVotes(prev => new Map(prev).set(trackId, newVote));
      const currentCounts = voteCounts.get(trackId) || {
        track_id: trackId,
        upvotes: 0,
        downvotes: 0,
        total_votes: 0,
        net_votes: 0,
        last_voted_at: new Date().toISOString(),
      };

      // Calculate new counts based on previous vote
      let newUpvotes = currentCounts.upvotes;
      let newDownvotes = currentCounts.downvotes;

      if (currentVote) {
        // User is changing their vote
        if (currentVote.vote_type === 'up' && voteType === 'down') {
          newUpvotes = Math.max(0, newUpvotes - 1);
          newDownvotes = newDownvotes + 1;
        } else if (currentVote.vote_type === 'down' && voteType === 'up') {
          newDownvotes = Math.max(0, newDownvotes - 1);
          newUpvotes = newUpvotes + 1;
        }
      } else {
        // User is voting for the first time
        if (voteType === 'up') {
          newUpvotes = newUpvotes + 1;
        } else {
          newDownvotes = newDownvotes + 1;
        }
      }

      const updatedCounts: VoteCounts = {
        ...currentCounts,
        upvotes: newUpvotes,
        downvotes: newDownvotes,
        total_votes: newUpvotes + newDownvotes,
        net_votes: newUpvotes - newDownvotes,
        last_voted_at: new Date().toISOString(),
      };

      setVoteCounts(prev => new Map(prev).set(trackId, updatedCounts));

      // Refresh vote counts from database in background
      fetchVoteCounts();
    } catch (err) {
      logger.error('Error voting', { error: err, roomId, membershipId, trackId, voteType });
      setError('Failed to vote');
    }
  };

  const removeVote = async (trackId: string) => {
    try {
      if (!roomId || !membershipId) throw new Error('No room or membership context found');
      
      const { error } = await (supabase.rpc as any)('remove_vote', {
        p_room_id: roomId!,
        p_track_id: trackId
      });

      if (error) throw error;

      const currentVote = userVotes.get(trackId);
      
      setUserVotes(prev => {
        const newMap = new Map(prev);
        newMap.delete(trackId);
        return newMap;
      });

      // Update local vote counts immediately for instant UI feedback
      if (currentVote) {
        const currentCounts = voteCounts.get(trackId) || {
          track_id: trackId,
          upvotes: 0,
          downvotes: 0,
          total_votes: 0,
          net_votes: 0,
          last_voted_at: new Date().toISOString(),
        };

        let newUpvotes = currentCounts.upvotes;
        let newDownvotes = currentCounts.downvotes;

        // Remove the user's vote from the counts
        if (currentVote.vote_type === 'up') {
          newUpvotes = Math.max(0, newUpvotes - 1);
        } else if (currentVote.vote_type === 'down') {
          newDownvotes = Math.max(0, newDownvotes - 1);
        }

        const updatedCounts: VoteCounts = {
          ...currentCounts,
          upvotes: newUpvotes,
          downvotes: newDownvotes,
          total_votes: newUpvotes + newDownvotes,
          net_votes: newUpvotes - newDownvotes,
          last_voted_at: new Date().toISOString(),
        };

        setVoteCounts(prev => new Map(prev).set(trackId, updatedCounts));
      }

      // Refresh vote counts from database in background
      fetchVoteCounts();
    } catch (err) {
      logger.error('Error removing vote', { error: err, roomId, trackId });
      setError('Failed to remove vote');
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      setError(null);
      await Promise.all([fetchVoteCounts(), fetchUserVotes()]);
      setIsLoading(false);
    };
    loadData();
  }, [roomId, membershipId]); // Reload when room/membership changes

  // Listen for vote updates directly from the vibox_votes table.
  // Uses delta updates from the payload instead of full refetches to reduce egress.
  // A throttled background sync ensures eventual consistency.
  const throttledSyncRef = useRef<ReturnType<typeof throttle> | null>(null);

  useEffect(() => {
    if (!roomId) return;

    // Throttled full sync as a safety net — runs at most once every 10s
    const throttledSync = throttle(() => {
      fetchVoteCounts();
      fetchUserVotes();
    }, 10_000);
    throttledSyncRef.current = throttledSync;

    const channel = supabase
      .channel(`vibox-votes:${roomId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'vibox_votes',
          filter: `room_id=eq.${roomId}`,
        },
        (payload: any) => {
          const eventType = payload.eventType as string;
          const newRecord = payload.new as Record<string, any> | undefined;
          const oldRecord = payload.old as Record<string, any> | undefined;

          // Delta update: apply the change directly from the payload
          if (eventType === 'INSERT' && newRecord) {
            const trackId = newRecord.track_id;
            const voteType = newRecord.vote_type as 'up' | 'down';

            // Update vote counts optimistically
            setVoteCounts(prev => {
              const current = prev.get(trackId) || {
                track_id: trackId, upvotes: 0, downvotes: 0,
                total_votes: 0, net_votes: 0, last_voted_at: new Date().toISOString(),
              };
              const upvotes = voteType === 'up' ? current.upvotes + 1 : current.upvotes;
              const downvotes = voteType === 'down' ? current.downvotes + 1 : current.downvotes;
              const updated = new Map(prev);
              updated.set(trackId, {
                ...current, upvotes, downvotes,
                total_votes: upvotes + downvotes,
                net_votes: upvotes - downvotes,
                last_voted_at: newRecord.created_at || new Date().toISOString(),
              });
              return updated;
            });

            // Update user votes if this is the current user's vote
            if (newRecord.membership_id === membershipId) {
              setUserVotes(prev => {
                const updated = new Map(prev);
                updated.set(trackId, {
                  track_id: trackId, room_id: roomId,
                  membership_id: membershipId!, vote_type: voteType,
                  created_at: newRecord.created_at, updated_at: newRecord.updated_at || newRecord.created_at,
                });
                return updated;
              });
            }
          } else if (eventType === 'DELETE' && oldRecord) {
            const trackId = oldRecord.track_id;
            const voteType = oldRecord.vote_type as 'up' | 'down';

            setVoteCounts(prev => {
              const current = prev.get(trackId);
              if (!current) return prev;
              const upvotes = voteType === 'up' ? Math.max(0, current.upvotes - 1) : current.upvotes;
              const downvotes = voteType === 'down' ? Math.max(0, current.downvotes - 1) : current.downvotes;
              const updated = new Map(prev);
              updated.set(trackId, {
                ...current, upvotes, downvotes,
                total_votes: upvotes + downvotes,
                net_votes: upvotes - downvotes,
                last_voted_at: new Date().toISOString(),
              });
              return updated;
            });

            if (oldRecord.membership_id === membershipId) {
              setUserVotes(prev => {
                const updated = new Map(prev);
                updated.delete(trackId);
                return updated;
              });
            }
          } else if (eventType === 'UPDATE' && newRecord) {
            // Vote type changed (e.g. up → down)
            const trackId = newRecord.track_id;
            const oldVoteType = oldRecord?.vote_type as 'up' | 'down' | undefined;
            const newVoteType = newRecord.vote_type as 'up' | 'down';

            if (oldVoteType && oldVoteType !== newVoteType) {
              setVoteCounts(prev => {
                const current = prev.get(trackId);
                if (!current) return prev;
                let upvotes = current.upvotes;
                let downvotes = current.downvotes;
                if (oldVoteType === 'up') { upvotes = Math.max(0, upvotes - 1); downvotes += 1; }
                else { downvotes = Math.max(0, downvotes - 1); upvotes += 1; }
                const updated = new Map(prev);
                updated.set(trackId, {
                  ...current, upvotes, downvotes,
                  total_votes: upvotes + downvotes,
                  net_votes: upvotes - downvotes,
                  last_voted_at: newRecord.updated_at || new Date().toISOString(),
                });
                return updated;
              });
            }

            if (newRecord.membership_id === membershipId) {
              setUserVotes(prev => {
                const updated = new Map(prev);
                updated.set(trackId, {
                  track_id: trackId, room_id: roomId,
                  membership_id: membershipId!, vote_type: newVoteType,
                  created_at: newRecord.created_at, updated_at: newRecord.updated_at,
                });
                return updated;
              });
            }
          }

          // Schedule a throttled full sync as safety net for consistency
          throttledSync();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      throttledSync.cancel();
    };
  }, [roomId, membershipId, fetchVoteCounts, fetchUserVotes]);

  const getVoteCount = (trackId: string): VoteCounts | undefined => {
    return voteCounts.get(trackId);
  };

  const getUserVote = (trackId: string): 'up' | 'down' | null => {
    const vote = userVotes.get(trackId);
    return vote?.vote_type || null;
  };

  const value: VotingContextType = {
    voteCounts,
    userVotes,
    handleVote,
    getVoteCount,
    getUserVote,
    isLoading,
    error,
  };

  return (
    <VotingContext.Provider value={value}>
      {children}
    </VotingContext.Provider>
  );
}
