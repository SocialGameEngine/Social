import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../../supabase/client';
import { getSessionId } from '../utils/session';

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
  session_id: string;
  player_id?: string;
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

export function VotingProvider({ children }: { children: ReactNode }) {
  const [voteCounts, setVoteCounts] = useState<Map<string, VoteCounts>>(new Map());
  const [userVotes, setUserVotes] = useState<Map<string, UserVote>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchVoteCounts = async () => {
    try {
      const { data, error } = await supabase.rpc('get_vote_counts_from_db');
      if (error) throw error;
      
      const countsMap = new Map<string, VoteCounts>();
      if (Array.isArray(data)) {
        data.forEach((count: any) => {
          countsMap.set(count.track_id, {
            track_id: count.track_id,
            upvotes: count.upvotes || 0,
            downvotes: count.downvotes || 0,
            total_votes: count.total_votes || 0,
            net_votes: count.net_votes || 0,
            last_voted_at: count.last_voted_at || new Date().toISOString(),
          });
        });
      }
      setVoteCounts(countsMap);
    } catch (err) {
      console.error('Error fetching vote counts:', err);
      setError('Failed to load vote counts');
    }
  };

  const fetchUserVotes = async () => {
    try {
      const sessionId = getSessionId();
      if (!sessionId) return;

      const { data, error } = await supabase.rpc('get_user_votes_from_db', { p_session_id: sessionId });
      if (error) throw error;

      const votesMap = new Map<string, UserVote>();
      if (Array.isArray(data)) {
        data.forEach((vote: any) => {
          votesMap.set(vote.track_id, {
            track_id: vote.track_id,
            session_id: vote.session_id,
            player_id: vote.player_id,
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
  };

  // Broadcast vote changes via Supabase Realtime
  const broadcastVoteChange = (trackId: string, voteType: 'up' | 'down' | null, sessionId: string) => {
    supabase
      .channel('vibox-votes')
      .send({
        type: 'broadcast',
        event: 'vote_update',
        payload: {
          track_id: trackId,
          vote_type: voteType,
          session_id: sessionId,
          timestamp: new Date().toISOString(),
        }
      });
  };

  const handleVote = async (trackId: string, voteType: 'up' | 'down') => {
    try {
      const sessionId = getSessionId();
      if (!sessionId) throw new Error('No session ID found');

      const currentVote = userVotes.get(trackId);
      if (currentVote?.vote_type === voteType) {
        await removeVote(trackId, sessionId);
        return;
      }

      const { error } = await supabase.rpc('vote_on_track', {
        p_track_id: trackId,
        p_session_id: sessionId,
        p_vote_type: voteType,
      });

      if (error) throw error;

      const newVote: UserVote = {
        track_id: trackId,
        session_id: sessionId,
        vote_type: voteType,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      setUserVotes(prev => new Map(prev).set(trackId, newVote));

      // Update local vote counts immediately for instant UI feedback
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

      // Broadcast vote change
      broadcastVoteChange(trackId, voteType, sessionId);

      // Refresh vote counts from database in background
      fetchVoteCounts();
    } catch (err) {
      console.error('Error voting:', err);
      setError('Failed to vote');
    }
  };

  const removeVote = async (trackId: string, sessionId: string) => {
    try {
      const { error } = await supabase.rpc('remove_vote', {
        p_track_id: trackId,
        p_session_id: sessionId,
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

      // Broadcast vote removal
      broadcastVoteChange(trackId, null, sessionId);

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
  }, []);

  // Listen for vote updates from other users
  useEffect(() => {
    const channel = supabase
      .channel('vibox-votes')
      .on('broadcast', { event: 'vote_update' }, (payload) => {
        const voteUpdate = payload.payload;
        
        if (voteUpdate.session_id === getSessionId()) {
          // This is our own vote, ignore
          return;
        }

        // Refresh vote counts when other users vote
        fetchVoteCounts();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []); // Empty dependency array - only run once

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
