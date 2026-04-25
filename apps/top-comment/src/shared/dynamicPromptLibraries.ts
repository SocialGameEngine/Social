import { supabase } from "../supabase/client";
import type { PromptLibrary, PromptLibraryId } from "./promptLibraries";

/**
 * Fetch all active prompt libraries from the database
 * This allows adding new libraries without redeployment
 * Note: Legacy prompt_libraries/prompts tables removed - now uses trivia_question_packs only
 */
export async function fetchPromptLibraries(): Promise<PromptLibrary[]> {
  try {
    // Fetch trivia question packs from the database
    const { data: triviaPacks, error } = await supabase
      .from('trivia_question_packs')
      .select('id, name, description, status')
      .eq('status', 'published')
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    if (!triviaPacks || triviaPacks.length === 0) {
      console.warn('No trivia packs found in database');
      return [];
    }

    // Convert trivia packs to PromptLibrary format
    const result = triviaPacks.map(pack => ({
      id: pack.id as PromptLibraryId,
      name: pack.name,
      emoji: '🧠', // Default trivia emoji
      description: pack.description || 'Trivia questions',
      type: 'trivia' as const,
      prompts: ['Trivia questions available'] // Placeholder for UI display
    }));

    return result;

  } catch (error) {
    console.error('Failed to fetch prompt libraries from database:', error);
    return [];
  }
}

/**
 * Get prompt libraries with fallback to static imports
 * Tries database first, falls back to bundled JSON files
 */
export async function getPromptLibraries(): Promise<PromptLibrary[]> {
  // Try dynamic loading from database first
  const dynamicLibraries = await fetchPromptLibraries();
  
  if (dynamicLibraries.length > 0) {
    return dynamicLibraries;
  }

  // Fallback to static imports if database is empty or fails
  const { promptLibraries } = await import("./promptLibraries");
  return promptLibraries;
}

/**
 * Get a specific library by ID
 */
export async function getPromptLibrary(id: PromptLibraryId): Promise<PromptLibrary | null> {
  const libraries = await getPromptLibraries();
  return libraries.find(lib => lib.id === id) || null;
}

/**
 * Get default library (first one or classic)
 */
export async function getDefaultPromptLibrary(): Promise<PromptLibrary | null> {
  const libraries = await getPromptLibraries();
  return libraries[0] || libraries.find(lib => lib.id === 'classic') || null;
}

/**
 * Get default library ID
 */
export async function getDefaultPromptLibraryId(): Promise<PromptLibraryId> {
  const defaultLib = await getDefaultPromptLibrary();
  return defaultLib?.id || 'classic';
}
