/**
 * Ambient Rounds Database Service
 * 
 * PURPOSE: Manages the ambient_rounds and ambient_packs tables, which power
 * the autonomous/ambient game mode where the TV runs continuous trivia without
 * a host. Content is organized into "packs" (e.g., "General", "Sports", 
 * "Venue-Specific") and rounds within each pack.
 * 
 * TABLES:
 * - ambient_packs: Content collections with metadata (emoji, description)
 * - ambient_rounds: Individual trivia/topic rounds with settings JSONB
 * 
 * PACK CONCEPT: Unlike prompt_libraries which are flat, ambient uses packs
 * as a namespace. Rounds are scoped to a pack_id, allowing multiple themed
 * content libraries to coexist.
 * 
 * USAGE FLOW:
 * 1. Create/select a pack (e.g., "The Crown Pub - General")
 * 2. Add rounds via UI or bulk import (JSON from AI generator)
 * 3. Drag to reorder (order_index determines sequence)
 * 4. Pack is selected when creating an ambient Sociale
 */

import { supabase } from './database'; // reuse the existing client
import type { AmbientRound, AmbientRoundExportRow } from '../types/ambientRounds';

/** Ambient pack metadata - represents a themed content collection */
export interface AmbientPack {
  id: string;
  name: string;
  description?: string;
  emoji: string;
  is_default: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

/**
 * Fetches ambient rounds, optionally filtered by pack.
 * Results ordered by order_index for correct sequence in game loop.
 * @param packId - Filter to specific pack, or undefined for all rounds
 */
export async function getAmbientRounds(packId?: string): Promise<AmbientRound[]> {
  let query = supabase
    .from('ambient_rounds')
    .select('*');
  
  if (packId) {
    query = query.eq('pack_id', packId);
  }
  
  const { data, error } = await query.order('order_index', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

/**
 * Returns count of rounds in a pack (or total across all packs).
 * Used in pack list UI to show content volume per pack.
 */
export async function getAmbientRoundCount(packId?: string): Promise<number> {
  let query = supabase
    .from('ambient_rounds')
    .select('id', { count: 'exact', head: true });
  
  if (packId) {
    query = query.eq('pack_id', packId);
  }
  
  const { count, error } = await query;
  if (error) throw error;
  return count ?? 0;
}

/**
 * Creates a new ambient round in the specified pack.
 * Round must include type, title, content, and settings.
 */
export async function createAmbientRound(
  packId: string,
  round: Omit<AmbientRound, 'id' | 'created_at' | 'updated_at'>,
): Promise<AmbientRound> {
  const { data, error } = await supabase
    .from('ambient_rounds')
    .insert({ ...round, pack_id: packId })
    .select()
    .single();
  if (error) throw error;
  return data;
}

/**
 * Updates round content, title, or settings.
 * Preserves pack_id - use reorder or move operations to change pack.
 */
export async function updateAmbientRound(
  id: string,
  round: Partial<Omit<AmbientRound, 'id' | 'created_at' | 'updated_at'>>,
): Promise<AmbientRound> {
  const { data, error } = await supabase
    .from('ambient_rounds')
    .update({ ...round, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

/**
 * Permanently deletes a round and all associated gameplay data.
 * CASCADE deletes: sociale_responses, sociale_votes, sociale_score_events
 */
export async function deleteAmbientRound(id: string): Promise<void> {
  const { error } = await supabase.from('ambient_rounds').delete().eq('id', id);
  if (error) throw error;
}

/**
 * PACK MANAGEMENT
 * Packs are the top-level containers for ambient content.
 * Each venue/location typically has one or more packs.
 */

/** Fetches all packs ordered by sort_order for UI display */
export async function getAmbientPacks(): Promise<AmbientPack[]> {
  const { data, error } = await supabase
    .from('ambient_packs')
    .select('*')
    .order('sort_order', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

/**
 * Creates a new content pack (e.g., "The Crown - Sports Trivia").
 * Emoji should be a single character for UI consistency.
 */
export async function createAmbientPack(
  pack: Omit<AmbientPack, 'id' | 'created_at' | 'updated_at'>,
): Promise<AmbientPack> {
  const { data, error } = await supabase
    .from('ambient_packs')
    .insert(pack)
    .select()
    .single();
  if (error) throw error;
  return data;
}

/** Updates pack metadata (name, emoji, description, is_default) */
export async function updateAmbientPack(
  id: string,
  updates: Partial<Omit<AmbientPack, 'id' | 'created_at' | 'updated_at'>>,
): Promise<AmbientPack> {
  const { data, error } = await supabase
    .from('ambient_packs')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

/**
 * Deletes a pack only if empty (no rounds).
 * Prevents accidental deletion of content-containing packs.
 * @throws Error if pack contains rounds
 */
export async function deleteAmbientPack(id: string): Promise<void> {
  // Check for existing rounds to prevent accidental deletion
  const { count } = await supabase
    .from('ambient_rounds')
    .select('id', { count: 'exact', head: true })
    .eq('pack_id', id);
  
  if ((count ?? 0) > 0) {
    throw new Error('Cannot delete pack that contains rounds');
  }
  
  const { error } = await supabase.from('ambient_packs').delete().eq('id', id);
  if (error) throw error;
}

/**
 * Reorders rounds within a pack by updating order_index.
 * @param packId - Pack containing the rounds
 * @param orderedIds - Array of round IDs in desired sequence
 * Each round gets order_index = its position in array (0, 1, 2...)
 */
export async function reorderAmbientRounds(
  packId: string,
  orderedIds: string[]
): Promise<void> {
  const updates = orderedIds.map((id, index) =>
    supabase
      .from('ambient_rounds')
      .update({ order_index: index, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('pack_id', packId),
  );
  const results = await Promise.all(updates);
  const err = results.find(r => r.error)?.error;
  if (err) throw err;
}

/**
 * BULK IMPORT / REPLACE
 * 
 * DANGER: This function DELETES all existing rounds in the pack
 * and inserts new ones. Use only after explicit user confirmation.
 * 
 * Handles foreign key constraints by deleting referencing data first:
 * 1. sociale_responses (answers to these rounds)
 * 2. sociale_votes (votes on answers)
 * 3. sociale_score_events (scoring history)
 * 4. ambient_rounds (the rounds themselves)
 * 5. Insert new rounds in chunks
 * 
 * @param packId - Target pack to populate
 * @param rows - New rounds from AI-generated JSON or CSV import
 */
export async function replaceAllAmbientRounds(
  packId: string,
  rows: AmbientRoundExportRow[],
): Promise<void> {
  // Strategy: Delete all referencing data first, then delete ambient_rounds, then insert new ones
  // This is necessary because FK constraints prevent deletion of rounds that are referenced
  
  // Step 1: Get all existing ambient round IDs in this pack
  const { data: existingRecords, error: fetchError } = await supabase
    .from('ambient_rounds')
    .select('id')
    .eq('pack_id', packId);
  
  if (fetchError) throw fetchError;
  
  if (existingRecords && existingRecords.length > 0) {
    const existingIds = existingRecords.map(r => r.id);
    
    // Step 2: Delete all referencing records in batches
    // Delete sociale_responses that reference these ambient rounds
    const DELETE_CHUNK = 100;
    for (let i = 0; i < existingIds.length; i += DELETE_CHUNK) {
      const chunk = existingIds.slice(i, i + DELETE_CHUNK);
      
      // Delete responses
      await supabase
        .from('sociale_responses')
        .delete()
        .in('ambient_round_id', chunk);
      
      // Delete votes
      await supabase
        .from('sociale_votes')
        .delete()
        .in('ambient_round_id', chunk);
      
      // Delete score events
      await supabase
        .from('sociale_score_events')
        .delete()
        .in('ambient_round_id', chunk);
    }
    
    // Step 3: Now delete all ambient rounds
    for (let i = 0; i < existingIds.length; i += DELETE_CHUNK) {
      const chunk = existingIds.slice(i, i + DELETE_CHUNK);
      const { error: deleteError } = await supabase
        .from('ambient_rounds')
        .delete()
        .in('id', chunk);
      
      if (deleteError) throw deleteError;
    }
  }

  // Step 4: Insert new records in chunks with pack_id
  const CHUNK = 50;
  const recordsWithPackId = rows.map(row => ({ ...row, pack_id: packId }));
  for (let i = 0; i < recordsWithPackId.length; i += CHUNK) {
    const { error } = await supabase
      .from('ambient_rounds')
      .insert(recordsWithPackId.slice(i, i + CHUNK));
    if (error) throw error;
  }
}
