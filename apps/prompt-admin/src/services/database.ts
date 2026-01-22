import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import type { Prompt, PromptLibrary } from "../types/prompts";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseKey = import.meta.env.VITE_SUPABASE_SERVICE_KEY as string | undefined;

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    "Missing Supabase env vars. Set VITE_SUPABASE_URL and VITE_SUPABASE_SERVICE_KEY in the root .env.local file.\n\nTo get your service key:\n1. Go to https://supabase.com/dashboard/project/dtudipmqfrknkrsahlst/settings/api\n2. Copy the 'service_role' key (NOT the anon key)\n3. Add it as VITE_SUPABASE_SERVICE_KEY in Social/.env.local",
  );
}

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseKey);

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

export async function upsertLibrary(library: PromptLibrary): Promise<void> {
  const { error } = await supabase.from("prompt_libraries").upsert(library);

  if (error) {
    throw error;
  }
}

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

export async function deleteLibrary(id: string): Promise<void> {
  await supabase.from("prompts").delete().eq("library_id", id);

  const { error } = await supabase.from("prompt_libraries").delete().eq("id", id);

  if (error) {
    throw error;
  }
}

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

export async function deletePrompt(id: string): Promise<void> {
  const { error } = await supabase.from("prompts").delete().eq("id", id);

  if (error) {
    throw error;
  }
}

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
