// Mashup game mode utilities

export async function requireValidMashupLibraries(supabase: any, libraryIds: string[]) {
  if (!libraryIds || libraryIds.length === 0) {
    throw new Error('At least one prompt library is required for mashup mode');
  }
  
  const { data, error } = await supabase
    .from('prompt_libraries')
    .select('id')
    .in('id', libraryIds);
    
  if (error) throw error;
  if (!data || data.length !== libraryIds.length) {
    throw new Error('One or more prompt libraries not found');
  }
  
  return data;
}

export async function getMashupLibraryForRound(supabase: any, libraryIds: string[], roundIndex: number) {
  const libraries = await requireValidMashupLibraries(supabase, libraryIds);
  const libraryIndex = roundIndex % libraries.length;
  return libraries[libraryIndex].id;
}

export function getNextMashupIndex(currentIndex: number, totalLibraries: number): number {
  return (currentIndex + 1) % totalLibraries;
}
