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
  // Delete all existing
  await supabase
    .from('ambient_rounds')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000');

  // Insert in chunks of 50
  const CHUNK = 50;
  for (let i = 0; i < rows.length; i += CHUNK) {
    const { error } = await supabase
      .from('ambient_rounds')
      .insert(rows.slice(i, i + CHUNK));
    if (error) throw error;
  }
}
