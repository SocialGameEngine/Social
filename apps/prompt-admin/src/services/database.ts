/**
 * Database Service - Prompt Library Management
 * 
 * PURPOSE: Provides CRUD operations for the prompt library system, which stores
 * party game questions and icebreakers used during hosted sessions.
 * 
 * TABLES:
 * - prompt_libraries: Containers organizing prompts by theme/occasion
 * - prompts: Individual question/prompt text with usage analytics
 * 
 * AUTHENTICATION: Uses Supabase service role key for full database access.
 * Requires VITE_SUPABASE_SERVICE_KEY in .env.local (not the anon key).
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import type { Prompt, PromptLibrary } from "../types/prompts";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseKey = import.meta.env.VITE_SUPABASE_SERVICE_KEY as string | undefined;

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    "Missing Supabase env vars. Set VITE_SUPABASE_URL and VITE_SUPABASE_SERVICE_KEY in the root .env.local file.\n\nTo get your service key:\n1. Go to https://supabase.com/dashboard/project/dtudipmqfrknkrsahlst/settings/api\n2. Copy the 'service_role' key (NOT the anon key)\n3. Add it as VITE_SUPABASE_SERVICE_KEY in Social/.env.local",
  );
}

/** Service-role Supabase client with elevated privileges for admin operations */
export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseKey);

/** 
 * Fetches all prompt libraries sorted by display order.
 * Used to populate the library selector sidebar.
 */
export async function getLibraries(): Promise<PromptLibrary[]> {
  const { data, error } = await supabase
    .from("prompt_libraries")
    .select("*")
    .order("sort_order", { ascending: true });

  if (error) {
    throw error;
  }

  return data ?? [];
}

/** 
 * Returns the count of active prompts in a specific library.
 * Displayed in library list items to show content volume.
 */
export async function getPromptCount(libraryId: string): Promise<number> {
  const { count, error } = await supabase
    .from("prompts")
    .select("id", { count: "exact", head: true })
    .eq("library_id", libraryId);

  if (error) {
    throw error;
  }

  return count ?? 0;
}

/** 
 * Creates a new prompt library (e.g., "Holiday Party 2024").
 * Auto-generates timestamps via database defaults.
 */
export async function createLibrary(
  library: Omit<PromptLibrary, "created_at" | "updated_at">,
): Promise<PromptLibrary> {
  const { data, error } = await supabase
    .from("prompt_libraries")
    .insert(library)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

/** 
 * Bulk upsert for library sync operations (import/restore scenarios).
 * Preserves IDs for data portability between environments.
 */
export async function upsertLibrary(library: PromptLibrary): Promise<void> {
  const { error } = await supabase.from("prompt_libraries").upsert(library);

  if (error) {
    throw error;
  }
}

/** 
 * Updates library metadata (name, emoji, description, sort_order).
 * Automatically updates the updated_at timestamp.
 */
export async function updateLibrary(
  id: string,
  library: Partial<PromptLibrary>,
): Promise<PromptLibrary> {
  const { data, error } = await supabase
    .from("prompt_libraries")
    .update({ ...library, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

/**
 * Bulk replacement of all prompts in a library.
 * DELETES existing prompts first, then inserts new ones.
 * Use with caution - prompts are permanently removed.
 */
export async function replaceLibraryPrompts(
  libraryId: string,
  texts: string[],
): Promise<void> {
  const { error: deleteError } = await supabase
    .from("prompts")
    .delete()
    .eq("library_id", libraryId);

  if (deleteError) {
    throw deleteError;
  }

  await createPromptsBulk(libraryId, texts, 0);
}

/**
 * Permanently deletes a library and all its prompts (cascade delete).
 * Foreign key constraint handles prompt deletion automatically.
 */
export async function deleteLibrary(id: string): Promise<void> {
  // Delete prompts first to avoid FK constraint issues
  await supabase.from("prompts").delete().eq("library_id", id);

  const { error } = await supabase.from("prompt_libraries").delete().eq("id", id);

  if (error) {
    throw error;
  }
}

/**
 * Fetches all prompts in a library, ordered by sort_order.
 * Includes usage analytics fields (times_shown, thumbs_up, etc.).
 */
export async function getPrompts(libraryId: string): Promise<Prompt[]> {
  const { data, error } = await supabase
    .from("prompts")
    .select("*")
    .eq("library_id", libraryId)
    .order("sort_order", { ascending: true });

  if (error) {
    throw error;
  }

  return data ?? [];
}

/**
 * Creates a single new prompt in the specified library.
 * Use createPromptsBulk for importing multiple prompts.
 */
export async function createPrompt(
  prompt: Omit<Prompt, "id" | "created_at" | "updated_at">,
): Promise<Prompt> {
  const { data, error } = await supabase
    .from("prompts")
    .insert(prompt)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

/**
 * Bulk creates prompts from text strings with sequential sort_order.
 * Used for CSV/JSON imports. Assigns sort_order starting from startSortOrder.
 * All prompts default to is_active=true.
 */
export async function createPromptsBulk(
  libraryId: string,
  texts: string[],
  startSortOrder: number,
): Promise<void> {
  if (texts.length === 0) {
    return;
  }

  const payload = texts.map((text, index) => ({
    library_id: libraryId,
    text,
    sort_order: startSortOrder + index,
    is_active: true,
  }));

  const { error } = await supabase.from("prompts").insert(payload);

  if (error) {
    throw error;
  }
}

/**
 * Updates a prompt's text, variant, or active status.
 * Use for editing individual prompts or toggling is_active.
 */
export async function updatePrompt(
  id: string,
  prompt: Partial<Prompt>,
): Promise<Prompt> {
  const { data, error } = await supabase
    .from("prompts")
    .update({ ...prompt, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

/**
 * Permanently deletes a single prompt.
 * This is irreversible - consider setting is_active=false instead.
 */
export async function deletePrompt(id: string): Promise<void> {
  const { error } = await supabase.from("prompts").delete().eq("id", id);

  if (error) {
    throw error;
  }
}

/**
 * Reorders prompts by updating sort_order to match the provided ID array.
 * Each prompt gets sort_order = its index in the array (0, 1, 2...).
 * Used after drag-and-drop reordering in the UI.
 */
export async function reorderPrompts(
  libraryId: string,
  promptIds: string[],
): Promise<void> {
  const updates = promptIds.map((id, index) =>
    supabase
      .from("prompts")
      .update({ sort_order: index, updated_at: new Date().toISOString() })
      .eq("id", id)
      .eq("library_id", libraryId),
  );

  const results = await Promise.all(updates);

  const error = results.find((result) => result.error)?.error;

  if (error) {
    throw error;
  }
}
