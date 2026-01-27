import { supabase } from "../supabase/client";
import type { PromptLibrary, PromptLibraryId } from "./promptLibraries";

/**
 * Fetch all active prompt libraries from the database
 * This allows adding new libraries without redeployment
 */
export async function fetchPromptLibraries(): Promise<PromptLibrary[]> {
  try {
    // Fetch all active libraries
    const { data: libraries, error: librariesError } = await supabase
      .from('prompt_libraries')
      .select('id, name, emoji, description, sort_order')
      .eq('is_active', true)
      .order('sort_order');

    if (librariesError) throw librariesError;
    if (!libraries || libraries.length === 0) {
      console.warn('No prompt libraries found in database');
      return [];
    }

    // Fetch prompts for all libraries
    const { data: prompts, error: promptsError } = await supabase
      .from('prompts')
      .select('library_id, text, sort_order')
      .eq('is_active', true)
      .order('library_id, sort_order');

    if (promptsError) throw promptsError;
    if (!prompts) {
      console.warn('No prompts found in database');
      return [];
    }

    // Group prompts by library
    const promptsByLibrary = new Map<string, string[]>();
    prompts.forEach(prompt => {
      if (!promptsByLibrary.has(prompt.library_id)) {
        promptsByLibrary.set(prompt.library_id, []);
      }
      promptsByLibrary.get(prompt.library_id)?.push(prompt.text);
    });

    // Combine libraries with their prompts
    const result = libraries.map(library => ({
      id: library.id as PromptLibraryId,
      name: library.name,
      emoji: library.emoji,
      description: library.description,
      prompts: promptsByLibrary.get(library.id) || []
    }));

    console.log(`Loaded ${result.length} prompt libraries from database`);
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
  console.warn('Falling back to static prompt libraries');
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
