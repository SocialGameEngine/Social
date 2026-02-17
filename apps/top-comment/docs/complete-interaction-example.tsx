/**
 * COMPLETE INTERACTION SYSTEM - All in One File
 * 
 * This is a reference implementation showing the entire interaction system
 * consolidated into a single file for easy understanding and reference.
 * 
 * Features:
 * - Real-time room interactions (prompts)
 * - Three phases: active (answering) → voting → results
 * - Supabase real-time subscriptions
 * - Full CRUD operations
 * - TypeScript types
 * - React hooks and components
 */

import React, { useState, useEffect, useCallback, useMemo, lazy, Suspense } from 'react';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// ===== TYPES =====

export type InteractionType = 'prompt';
export type InteractionStatus = 'active' | 'voting' | 'results' | 'closed';

export interface Interaction {
  id: string;
  roomId: string;
  createdBy: string;
  type: InteractionType;
  status: InteractionStatus;
  question: string;
  description?: string | null;
  settings: Record<string, unknown>;
  responseCount: number;
  voteCount: number;
  answerEndsAt?: string | null;
  answerSeconds?: number;
  votingEndsAt?: string | null;
  votingSeconds?: number;
  createdAt: string;
  closedAt?: string | null;
}

export interface InteractionResponse {
  id: string;
  interactionId: string;
  membershipId: string;
  text: string;
  createdAt: string;
  playerName?: string;
  mascotId?: number;
}

export interface InteractionVote {
  id: string;
  interactionId: string;
  membershipId: string;
  responseId: string;
  createdAt: string;
}

export interface RoomMembership {
  id: string;
  roomId: string;
  userId: string;
  playerName: string;
  mascotId: number;
  isHost: boolean;
  isBanned: boolean;
  joinedAt: string;
}

export interface User {
  id: string;
  email?: string;
}

// ===== SUPABASE CLIENT =====

let supabaseClient: SupabaseClient<any> | null = null;

function getSupabaseClient(): SupabaseClient<any> {
  if (!supabaseClient) {
    const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL;
    const supabaseKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase environment variables');
    }

    supabaseClient = createClient(supabaseUrl, supabaseKey);
  }
  return supabaseClient;
}

// ===== SERVICE LAYER =====

class InteractionService {
  private supabase = getSupabaseClient();

  // Mappers
  private mapInteraction(data: any): Interaction {
    return {
      id: data.id,
      roomId: data.room_id,
      createdBy: data.created_by,
      type: data.type,
      status: data.status,
      question: data.question,
      description: data.description,
      settings: data.settings,
      responseCount: data.response_count || 0,
      voteCount: data.vote_count || 0,
      answerEndsAt: data.answer_ends_at,
      answerSeconds: data.answer_seconds,
      votingEndsAt: data.voting_ends_at,
      votingSeconds: data.voting_seconds,
      createdAt: data.created_at,
      closedAt: data.closed_at,
    };
  }

  private mapResponse(data: any): InteractionResponse {
    const membership = data.room_memberships;
    return {
      id: data.id,
      interactionId: data.interaction_id,
      membershipId: data.membership_id,
      text: data.text,
      createdAt: data.created_at,
      playerName: membership?.player_name,
      mascotId: membership?.mascot_id,
    };
  }

  private mapVote(data: any): InteractionVote {
    return {
      id: data.id,
      interactionId: data.interaction_id,
      membershipId: data.membership_id,
      responseId: data.response_id,
      createdAt: data.created_at,
    };
  }

  // Interaction CRUD
  async createInteraction(roomId: string, question: string, description?: string): Promise<Interaction> {
    const { data: userData, error: userError } = await this.supabase.auth.getUser();
    if (userError || !userData.user) throw new Error("User not authenticated");

    const { data, error } = await this.supabase
      .from("interactions")
      .insert({
        room_id: roomId,
        question,
        description: description || null,
        created_by: userData.user.id,
        answer_ends_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
        answer_seconds: 300,
      })
      .select()
      .single();

    if (error) throw new Error(`Failed to create interaction: ${error.message}`);
    return this.mapInteraction(data);
  }

  async closeInteraction(interactionId: string): Promise<void> {
    const { error } = await this.supabase
      .from("interactions")
      .update({ status: "closed", closed_at: new Date().toISOString() })
      .eq("id", interactionId);

    if (error) throw new Error(`Failed to close interaction: ${error.message}`);
  }

  async getAllInteractions(roomId: string): Promise<Interaction[]> {
    const { data, error } = await this.supabase
      .from("interactions")
      .select("*")
      .eq("room_id", roomId)
      .order("created_at", { ascending: false });

    if (error) throw new Error(`Failed to fetch interactions: ${error.message}`);
    return (data || []).map(this.mapInteraction);
  }

  // Response CRUD
  async submitResponse(interactionId: string, membershipId: string, text: string): Promise<InteractionResponse> {
    const { data, error } = await this.supabase
      .from("responses")
      .upsert(
        {
          interaction_id: interactionId,
          membership_id: membershipId,
          text,
        },
        { onConflict: "interaction_id,membership_id" }
      )
      .select("*, room_memberships:membership_id(player_name, mascot_id)")
      .single();

    if (error) throw new Error(`Failed to submit response: ${error.message}`);
    return this.mapResponse(data);
  }

  async getResponses(interactionId: string): Promise<InteractionResponse[]> {
    const { data, error } = await this.supabase
      .from("responses")
      .select("*, room_memberships:membership_id(player_name, mascot_id)")
      .eq("interaction_id", interactionId)
      .order("created_at", { ascending: true });

    if (error) throw new Error(`Failed to get responses: ${error.message}`);
    return (data || []).map(this.mapResponse);
  }

  async getMyResponse(interactionId: string, membershipId: string): Promise<InteractionResponse | null> {
    const { data, error } = await this.supabase
      .from("responses")
      .select("*, room_memberships:membership_id(player_name, mascot_id)")
      .eq("interaction_id", interactionId)
      .eq("membership_id", membershipId)
      .maybeSingle();

    if (error) throw new Error(`Failed to fetch response: ${error.message}`);
    return data ? this.mapResponse(data) : null;
  }

  // Vote CRUD
  async advanceToVoting(interactionId: string, votingSeconds = 300): Promise<boolean> {
    const { data, error } = await this.supabase
      .rpc('advance_interaction_to_voting', {
        p_interaction_id: interactionId,
        p_voting_seconds: votingSeconds
      });

    if (error) throw new Error(`Failed to advance to voting: ${error.message}`);
    return data;
  }

  async advanceToResults(interactionId: string): Promise<boolean> {
    const { data: interaction, error: fetchError } = await this.supabase
      .from("interactions")
      .select("status")
      .eq("id", interactionId)
      .single();
    
    if (fetchError) throw new Error(`Failed to check interaction status: ${fetchError.message}`);
    
    if (interaction.status !== 'voting') {
      throw new Error(`Cannot advance to results: interaction is in '${interaction.status}' phase, must be 'voting'`);
    }

    const { error: updateError } = await this.supabase
      .from("interactions")
      .update({ status: "results" })
      .eq("id", interactionId);

    if (updateError) throw new Error(`Failed to advance to results: ${updateError.message}`);
    return true;
  }

  async submitVote(interactionId: string, membershipId: string, responseId: string): Promise<InteractionVote> {
    const { data, error } = await this.supabase
      .from("interaction_votes")
      .upsert(
        {
          interaction_id: interactionId,
          membership_id: membershipId,
          response_id: responseId,
        },
        { onConflict: "interaction_id,membership_id" }
      )
      .select()
      .single();

    if (error) throw new Error(`Failed to submit vote: ${error.message}`);
    return this.mapVote(data);
  }

  async getVotes(interactionId: string): Promise<InteractionVote[]> {
    const { data, error } = await this.supabase
      .from("interaction_votes")
      .select("*")
      .eq("interaction_id", interactionId)
      .order("created_at", { ascending: true });

    if (error) throw new Error(`Failed to get votes: ${error.message}`);
    return (data || []).map(this.mapVote);
  }
}

const interactionService = new InteractionService();

// ===== HOOKS =====

interface UseInteractionsOptions {
  roomId?: string;
}

export function useInteractions({ roomId }: UseInteractionsOptions) {
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = getSupabaseClient();

  const refresh = useCallback(async () => {
    if (!roomId) return;
    try {
      const data = await interactionService.getAllInteractions(roomId);
      const activeInteractions = data.filter(interaction => interaction.status !== 'closed');
      setInteractions(activeInteractions);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load interactions');
    }
  }, [roomId]);

  useEffect(() => {
    if (!roomId) {
      setInteractions([]);
      return;
    }
    setIsLoading(true);
    refresh().finally(() => setIsLoading(false));
  }, [roomId, refresh]);

  useEffect(() => {
    if (!roomId) return;

    const channel = supabase
      .channel(`interactions:${roomId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'interactions',
          filter: `room_id=eq.${roomId}`,
        },
        () => {
          refresh();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'responses',
        },
        () => {
          refresh();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId, refresh]);

  const createInteraction = useCallback(
    async (question: string, description?: string) => {
      if (!roomId) throw new Error('No room ID');
      const interaction = await interactionService.createInteraction(roomId, question, description);
      setInteractions((prev) => [interaction, ...prev]);
      return interaction;
    },
    [roomId]
  );

  const closeInteraction = useCallback(async (interactionId: string) => {
    await interactionService.closeInteraction(interactionId);
    setInteractions((prev) => prev.filter((i) => i.id !== interactionId));
  }, []);

  return {
    interactions,
    isLoading,
    error,
    createInteraction,
    closeInteraction,
    refresh,
  };
}

interface UseVotesOptions {
  interactionId?: string;
}

export function useVotes({ interactionId }: UseVotesOptions) {
  const [votes, setVotes] = useState<InteractionVote[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const supabase = getSupabaseClient();

  const refresh = useCallback(async () => {
    if (!interactionId) return;
    try {
      const data = await interactionService.getVotes(interactionId);
      setVotes(data);
    } catch (err) {
      console.error('Failed to load votes:', err);
    }
  }, [interactionId]);

  useEffect(() => {
    if (!interactionId) {
      setVotes([]);
      return;
    }
    setIsLoading(true);
    refresh().finally(() => setIsLoading(false));
  }, [interactionId, refresh]);

  useEffect(() => {
    if (!interactionId) return;

    const channel = supabase
      .channel(`votes:${interactionId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'interaction_votes',
          filter: `interaction_id=eq.${interactionId}`,
        },
        () => {
          refresh();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [interactionId, refresh]);

  return { votes, isLoading, refresh };
}

// ===== COMPONENTS =====

interface InteractionCardProps {
  interaction: Interaction;
  membership: RoomMembership | null;
  onResponse: (interactionId: string, text: string) => void;
  onVote: (interactionId: string, responseId: string) => void;
  onViewResults: (interaction: Interaction) => void;
  onClose: (interactionId: string) => void;
}

function InteractionCard({ 
  interaction, 
  membership, 
  onResponse, 
  onVote, 
  onViewResults, 
  onClose 
}: InteractionCardProps) {
  const [userResponse, setUserResponse] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!userResponse.trim() || !membership) return;
    
    setIsSubmitting(true);
    try {
      await onResponse(interaction.id, userResponse.trim());
      setUserResponse('');
    } catch (error) {
      console.error('Failed to submit response:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusColor = () => {
    switch (interaction.status) {
      case 'active': return 'bg-blue-100 text-blue-800';
      case 'voting': return 'bg-purple-100 text-purple-800';
      case 'results': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = () => {
    switch (interaction.status) {
      case 'active': return 'Answering';
      case 'voting': return 'Voting';
      case 'results': return 'Results';
      default: return 'Closed';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-4">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {interaction.question}
          </h3>
          {interaction.description && (
            <p className="text-gray-600 text-sm">{interaction.description}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor()}`}>
            {getStatusText()}
          </span>
          {membership?.isHost && interaction.status !== 'closed' && (
            <button
              onClick={() => onClose(interaction.id)}
              className="text-gray-400 hover:text-gray-600"
              title="Close interaction"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      <div className="text-sm text-gray-500 mb-4">
        {interaction.responseCount} response{interaction.responseCount !== 1 ? 's' : ''} • 
        {interaction.voteCount} vote{interaction.voteCount !== 1 ? 's' : ''}
      </div>

      {interaction.status === 'active' && membership && (
        <div className="border-t pt-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={userResponse}
              onChange={(e) => setUserResponse(e.target.value)}
              placeholder="Type your response..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
            />
            <button
              onClick={handleSubmit}
              disabled={!userResponse.trim() || isSubmitting}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Sending...' : 'Send'}
            </button>
          </div>
        </div>
      )}

      {interaction.status === 'voting' && (
        <div className="border-t pt-4">
          <button
            onClick={() => onVote(interaction.id, '')}
            className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
          >
            Vote Now
          </button>
        </div>
      )}

      {interaction.status === 'results' && (
        <div className="border-t pt-4">
          <button
            onClick={() => onViewResults(interaction)}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            View Results
          </button>
        </div>
      )}
    </div>
  );
}

// Modal components (simplified for this example)
interface SendPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (question: string, description?: string) => void;
}

function SendPromptModal({ isOpen, onClose, onSubmit }: SendPromptModalProps) {
  const [question, setQuestion] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;

    setIsSubmitting(true);
    try {
      await onSubmit(question.trim(), description.trim() || undefined);
      setQuestion('');
      setDescription('');
      onClose();
    } catch (error) {
      console.error('Failed to create interaction:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <h2 className="text-xl font-bold mb-4">Send New Prompt</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Question *
            </label>
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="What's your question?"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description (optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Add more context..."
              rows={3}
            />
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!question.trim() || isSubmitting}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Sending...' : 'Send Prompt'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ===== MAIN COMPONENT =====

interface CompleteInteractionSystemProps {
  roomId: string;
  user: User;
  memberships: RoomMembership[];
}

export function CompleteInteractionSystem({ 
  roomId, 
  user, 
  memberships 
}: CompleteInteractionSystemProps) {
  const { interactions, createInteraction, closeInteraction } = useInteractions({ roomId });
  const [showSendModal, setShowSendModal] = useState(false);

  const myMembership = useMemo(
    () => memberships.find((m) => m.userId === user.id) ?? null,
    [memberships, user.id]
  );

  const isHost = myMembership?.isHost ?? false;

  const handleSendPrompt = useCallback(
    async (question: string, description?: string) => {
      await createInteraction(question, description);
    },
    [createInteraction]
  );

  const handleResponse = useCallback(
    async (interactionId: string, text: string) => {
      if (!myMembership) return;
      await interactionService.submitResponse(interactionId, myMembership.id, text);
    },
    [myMembership]
  );

  const handleVote = useCallback(
    async (interactionId: string, responseId: string) => {
      if (!myMembership) return;
      await interactionService.submitVote(interactionId, myMembership.id, responseId);
    },
    [myMembership]
  );

  const handleCloseInteraction = useCallback(
    async (interactionId: string) => {
      try {
        await closeInteraction(interactionId);
      } catch (error) {
        console.error("Failed to close interaction:", error);
      }
    },
    [closeInteraction]
  );

  const handleViewResults = useCallback((interaction: Interaction) => {
    // In a real implementation, this would open a results modal
    console.log('View results for:', interaction);
  }, []);

  return (
    <div className="max-w-2xl mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Room Interactions</h1>
        {isHost && (
          <button
            onClick={() => setShowSendModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Send Prompt
          </button>
        )}
      </div>

      <div className="space-y-4">
        {interactions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            {isHost ? 'No prompts yet. Send one to get started!' : 'No active prompts right now.'}
          </div>
        ) : (
          interactions.map((interaction) => (
            <InteractionCard
              key={interaction.id}
              interaction={interaction}
              membership={myMembership}
              onResponse={handleResponse}
              onVote={handleVote}
              onViewResults={handleViewResults}
              onClose={handleCloseInteraction}
            />
          ))
        )}
      </div>

      <SendPromptModal
        isOpen={showSendModal}
        onClose={() => setShowSendModal(false)}
        onSubmit={handleSendPrompt}
      />
    </div>
  );
}

// ===== USAGE EXAMPLE =====

/*
// How to use this system:

import { CompleteInteractionSystem } from './complete-interaction-example';

function RoomPage() {
  const { user } = useAuth();
  const { room, memberships } = useRoom();
  
  if (!room || !user) return <div>Loading...</div>;
  
  return (
    <CompleteInteractionSystem
      roomId={room.id}
      user={user}
      memberships={memberships}
    />
  );
}
*/

export default CompleteInteractionSystem;
