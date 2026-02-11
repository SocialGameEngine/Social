import { supabase } from "../supabase/client";
import type { Interaction, InteractionResponse, InteractionVote, HeadlineFibbageSettings, VotingOption, HeadlineResults } from "../domain/types/interaction.types";

// --- Mappers ---

function mapInteraction(data: any): Interaction {
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

function mapResponse(data: any): InteractionResponse {
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

function mapVote(data: any): InteractionVote {
  return {
    id: data.id,
    interactionId: data.interaction_id,
    membershipId: data.membership_id,
    responseId: data.response_id,
    createdAt: data.created_at,
  };
}

// --- Interaction CRUD ---

async function createInteraction(
  roomId: string,
  question: string,
  description?: string
): Promise<Interaction> {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) throw new Error("User not authenticated");

  const { data, error } = await supabase
    .from("interactions")
    .insert({
      room_id: roomId,
      question,
      description: description || null,
      created_by: userData.user.id,
      answer_ends_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(), // 5 minutes from now
      answer_seconds: 300,
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to create interaction: ${error.message}`);
  return mapInteraction(data);
}

async function closeInteraction(interactionId: string): Promise<void> {
  const { error } = await supabase
    .from("interactions")
    .update({ status: "closed", closed_at: new Date().toISOString() })
    .eq("id", interactionId);

  if (error) throw new Error(`Failed to close interaction: ${error.message}`);
}

async function getActiveInteractions(roomId: string): Promise<Interaction[]> {
  const { data, error } = await supabase
    .from("interactions")
    .select("*")
    .eq("room_id", roomId)
    .eq("status", "active")
    .order("created_at", { ascending: false });

  if (error) throw new Error(`Failed to fetch interactions: ${error.message}`);
  return (data || []).map(mapInteraction);
}

async function getAllInteractions(roomId: string): Promise<Interaction[]> {
  const { data, error } = await supabase
    .from("interactions")
    .select("*")
    .eq("room_id", roomId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(`Failed to fetch interactions: ${error.message}`);
  return (data || []).map(mapInteraction);
}

// --- Response CRUD ---

async function submitResponse(
  interactionId: string,
  membershipId: string,
  text: string
): Promise<InteractionResponse> {
  const { data, error } = await supabase
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
  return mapResponse(data);
}

async function getResponses(interactionId: string): Promise<InteractionResponse[]> {
  const { data, error } = await supabase
    .from("responses")
    .select("*, room_memberships:membership_id(player_name, mascot_id)")
    .eq("interaction_id", interactionId)
    .order("created_at", { ascending: true });

  if (error) throw new Error(`Failed to get responses: ${error.message}`);
  return (data || []).map(mapResponse);
}

async function getMyResponse(
  interactionId: string,
  membershipId: string
): Promise<InteractionResponse | null> {
  const { data, error } = await supabase
    .from("responses")
    .select("*, room_memberships:membership_id(player_name, mascot_id)")
    .eq("interaction_id", interactionId)
    .eq("membership_id", membershipId)
    .maybeSingle();

  if (error) throw new Error(`Failed to fetch response: ${error.message}`);
  return data ? mapResponse(data) : null;
}

// --- Vote CRUD ---

async function advanceToVoting(interactionId: string, votingSeconds = 300): Promise<boolean> {
  const { data, error } = await supabase
    .rpc('advance_interaction_to_voting', {
      p_interaction_id: interactionId,
      p_voting_seconds: votingSeconds
    });

  if (error) throw new Error(`Failed to advance to voting: ${error.message}`);
  return data;
}

async function advanceToResults(interactionId: string): Promise<boolean> {
  // First check current status to ensure we can advance to results
  const { data: interaction, error: fetchError } = await supabase
    .from("interactions")
    .select("status")
    .eq("id", interactionId)
    .single();
  
  if (fetchError) throw new Error(`Failed to check interaction status: ${fetchError.message}`);
  
  // Can only advance from 'voting' to 'results'
  if (interaction.status !== 'voting') {
    throw new Error(`Cannot advance to results: interaction is in '${interaction.status}' phase, must be 'voting'`);
  }

  // Update to results phase
  const { error: updateError } = await supabase
    .from("interactions")
    .update({ status: "results" })
    .eq("id", interactionId);

  if (updateError) throw new Error(`Failed to advance to results: ${updateError.message}`);
  return true;
}

async function submitVote(interactionId: string, membershipId: string, responseId: string): Promise<InteractionVote> {
  const { data, error } = await supabase
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
  return mapVote(data);
}

async function getVotes(interactionId: string): Promise<InteractionVote[]> {
  const { data, error } = await supabase
    .from("interaction_votes")
    .select("*")
    .eq("interaction_id", interactionId)
    .order("created_at", { ascending: true });

  if (error) throw new Error(`Failed to get votes: ${error.message}`);
  return (data || []).map(mapVote);
}

// --- Headline Fibbage Methods ---

async function createHeadlineInteraction(params: {
  roomId: string;
  headlineId: string;
  headlineBlank: string;
  sourceName: string;
  publishedAt: string;
  answerSeconds?: number;
  votingSeconds?: number;
}): Promise<Interaction> {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) throw new Error("User not authenticated");

  const answerSeconds = params.answerSeconds ?? 90;
  const votingSeconds = params.votingSeconds ?? 60;

  const settings: HeadlineFibbageSettings = {
    mode: "headline_fibbage",
    headlineId: params.headlineId,
    headlineBlank: params.headlineBlank,
    sourceName: params.sourceName,
    publishedAt: params.publishedAt,
    answerMaxLen: 40,
    profanityFilter: "basic",
  };

  const { data, error } = await supabase
    .from("interactions")
    .insert({
      room_id: params.roomId,
      created_by: userData.user.id,
      type: "headline_fibbage",
      status: "active",
      question: params.headlineBlank,
      description: `${params.sourceName} • ${new Date(params.publishedAt).toLocaleDateString()}`,
      settings: settings as any, // Cast to any for Supabase JSON column
      answer_seconds: answerSeconds,
      answer_ends_at: new Date(Date.now() + answerSeconds * 1000).toISOString(),
      voting_seconds: votingSeconds,
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to create headline interaction: ${error.message}`);
  return mapInteraction(data);
}

async function getVotingOptions(_interactionId: string, _membershipId: string): Promise<VotingOption[]> {
  // TODO: Replace with actual RPC call when database is updated
  // For now, return mock data
  return [
    { optionId: '1', text: 'The real answer', isReal: true },
    { optionId: '2', text: 'A believable lie', isReal: false },
    { optionId: '3', text: 'Another lie', isReal: false },
    { optionId: '4', text: 'Yet another lie', isReal: false },
  ];
}

async function getHeadlineResults(_interactionId: string, _membershipId: string): Promise<HeadlineResults> {
  // TODO: Replace with actual RPC call when database is updated
  // For now, return mock data
  return {
    realAnswer: 'The real answer to the headline',
    options: [
      { optionId: '1', text: 'The real answer to the headline', voteCount: 5, fooledTeams: 5, isReal: true },
      { optionId: '2', text: 'A believable lie', voteCount: 3, fooledTeams: 3, isReal: false },
      { optionId: '3', text: 'Another lie', voteCount: 2, fooledTeams: 2, isReal: false },
      { optionId: '4', text: 'Yet another lie', voteCount: 1, fooledTeams: 1, isReal: false },
    ],
  };
}

async function submitHeadlineVote(interactionId: string, membershipId: string, responseId: string): Promise<void> {
  // TODO: Replace with actual RPC call when database is updated
  // For now, just simulate success
  console.log('Mock vote submitted:', { interactionId, membershipId, responseId });
}

export const interactionService = {
  createInteraction,
  closeInteraction,
  getActiveInteractions,
  getAllInteractions,
  submitResponse,
  getResponses,
  getMyResponse,
  advanceToVoting,
  advanceToResults,
  submitVote,
  getVotes,
  createHeadlineInteraction,
  getVotingOptions,
  getHeadlineResults,
  submitHeadlineVote,
};
