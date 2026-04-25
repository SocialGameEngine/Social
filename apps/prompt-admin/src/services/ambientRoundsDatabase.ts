import { supabase } from './database'; // reuse the existing client
import type { AmbientRound, AmbientRoundExportRow } from '../types/ambientRounds';

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

export async function deleteAmbientRound(id: string): Promise<void> {
  const { error } = await supabase.from('ambient_rounds').delete().eq('id', id);
  if (error) throw error;
}

// Pack management functions
export async function getAmbientPacks(): Promise<AmbientPack[]> {
  const { data, error } = await supabase
    .from('ambient_packs')
    .select('*')
    .order('sort_order', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

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

export async function deleteAmbientPack(id: string): Promise<void> {
  // First check if pack has any rounds
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

// Reorder: update order_index for every round in the new sequence
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

// Bulk import: replaces all rows in a pack (use with confirmation prompt)
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
