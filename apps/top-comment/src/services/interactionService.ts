import { supabase } from "../supabase/client";
import type { Interaction, InteractionResponse } from "../domain/types/interaction.types";

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
    settings: data.settings || {},
    responseCount: data.response_count || 0,
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

  if (error) throw new Error(`Failed to fetch responses: ${error.message}`);
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

export const interactionService = {
  createInteraction,
  closeInteraction,
  getActiveInteractions,
  getAllInteractions,
  submitResponse,
  getResponses,
  getMyResponse,
};
