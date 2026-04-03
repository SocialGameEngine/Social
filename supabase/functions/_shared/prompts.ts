// Prompt library utilities

export const TOTAL_ROUNDS = 10;

export async function getPromptLibrary(supabase: any, libraryId: string) {
  const { data, error } = await supabase
    .from('prompt_libraries')
    .select('*')
    .eq('id', libraryId)
    .single();
    
  if (error) throw error;
  return data;
}
