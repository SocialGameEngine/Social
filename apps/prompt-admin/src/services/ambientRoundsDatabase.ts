import { supabase } from './database'; // reuse the existing client
import type { AmbientRound, AmbientRoundExportRow } from '../types/ambientRounds';

export async function getAmbientRounds(): Promise<AmbientRound[]> {
  const { data, error } = await supabase
    .from('ambient_rounds')
    .select('*')
    .order('order_index', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function getAmbientRoundCount(): Promise<number> {
  const { count, error } = await supabase
    .from('ambient_rounds')
    .select('id', { count: 'exact', head: true });
  if (error) throw error;
  return count ?? 0;
}

export async function createAmbientRound(
  round: Omit<AmbientRound, 'id' | 'created_at' | 'updated_at'>,
): Promise<AmbientRound> {
  const { data, error } = await supabase
    .from('ambient_rounds')
    .insert(round)
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

// Reorder: update order_index for every round in the new sequence
export async function reorderAmbientRounds(orderedIds: string[]): Promise<void> {
  const updates = orderedIds.map((id, index) =>
    supabase
      .from('ambient_rounds')
      .update({ order_index: index, updated_at: new Date().toISOString() })
      .eq('id', id),
  );
  const results = await Promise.all(updates);
  const err = results.find(r => r.error)?.error;
  if (err) throw err;
}

// Bulk import: replaces all rows (use with confirmation prompt)
export async function replaceAllAmbientRounds(
  rows: AmbientRoundExportRow[],
): Promise<void> {
  // Strategy: Delete all referencing data first, then delete ambient_rounds, then insert new ones
  // This is necessary because FK constraints prevent deletion of rounds that are referenced
  
  // Step 1: Get all existing ambient round IDs
  const { data: existingRecords, error: fetchError } = await supabase
    .from('ambient_rounds')
    .select('id');
  
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

  // Step 4: Insert new records in chunks
  const CHUNK = 50;
  for (let i = 0; i < rows.length; i += CHUNK) {
    const { error } = await supabase
      .from('ambient_rounds')
      .insert(rows.slice(i, i + CHUNK));
    if (error) throw error;
  }
}
