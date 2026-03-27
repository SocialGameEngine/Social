import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import { supabase } from '../../supabase/client';

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
      
      const { data, error } = await (supabase.rpc as any)('get_vote_counts_from_db', { p_session_id: roomId! });
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
      console.error('Error fetching vote counts:', err);
      setError('Failed to load vote counts');
    }
  }, [roomId]);

  const fetchUserVotes = useCallback(async () => {
    try {
      if (!roomId || !membershipId) return;

      const { data, error } = await (supabase.rpc as any)('get_user_votes_from_db', { 
        p_session_id: roomId!, 
        p_player_id: membershipId! 
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
      console.error('Error fetching user votes:', err);
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
        p_session_id: roomId!,
        p_player_id: membershipId!,
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
      console.error('Error voting:', err);
      setError('Failed to vote');
    }
  };

  const removeVote = async (trackId: string) => {
    try {
      if (!roomId || !membershipId) throw new Error('No room or membership context found');
      
      const { error } = await (supabase.rpc as any)('remove_vote', {
        p_session_id: roomId!,
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
      console.error('Error removing vote:', err);
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
  // This avoids relying on broadcast messages and keeps host/room in sync.
  useEffect(() => {
    if (!roomId) return;
    
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
        () => {
          fetchVoteCounts();
          fetchUserVotes();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId, fetchVoteCounts, fetchUserVotes]); // Recreate channel when room changes

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
