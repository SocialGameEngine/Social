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

    console.log('Found libraries in database:', libraries.map(l => l.id));

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

    console.log('Found prompts in database:', prompts.length);

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
      type: library.id === 'trivia-test' ? 'trivia' as const : 'prompt' as const, // Determine type based on library ID
      prompts: promptsByLibrary.get(library.id) || []
    }));

    console.log('Final libraries with types:', result.map(l => ({ id: l.id, type: l.type, promptCount: l.prompts.length })));

    // Add trivia question packs to the result so they show up in the UI
    // This is a hybrid approach to make trivia packs selectable in the current UI
    try {
      const { data: triviaPacks } = await supabase
        .from('trivia_question_packs')
        .select('id, name, description, status')
        .eq('status', 'published')
        .order('created_at', { ascending: false });

      if (triviaPacks && triviaPacks.length > 0) {
        const triviaPackLibraries = triviaPacks.map(pack => ({
          id: pack.id as PromptLibraryId,
          name: pack.name,
          emoji: '🧠', // Default trivia emoji
          description: pack.description || 'Trivia questions',
          type: 'trivia' as const,
          prompts: ['Trivia questions available'] // Placeholder for UI display
        }));
        
        console.log('Adding trivia packs:', triviaPackLibraries.map(p => ({ id: p.id, name: p.name })));
        result.push(...triviaPackLibraries);
      }
    } catch (triviaError) {
      console.warn('Failed to fetch trivia packs:', triviaError);
    }

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
    console.log('Using database libraries, count:', dynamicLibraries.length);
    return dynamicLibraries;
  }

  // Fallback to static imports if database is empty or fails
  console.warn('Falling back to static prompt libraries');
  const { promptLibraries } = await import("./promptLibraries");
  console.log('Static libraries count:', promptLibraries.length);
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
