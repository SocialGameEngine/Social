import { useQuery } from '@tanstack/react-query';
import { getPromptLibraries } from '../dynamicPromptLibraries';
import type { PromptLibraryId } from '../promptLibraries';

/**
 * Hook to fetch prompt libraries with caching
 * Libraries are cached for 5 minutes to reduce database calls
 */
export function usePromptLibraries() {
  return useQuery({
    queryKey: ['promptLibraries'],
    queryFn: getPromptLibraries,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
    refetchOnWindowFocus: false,
  });
}

/**
 * Hook to get a specific prompt library by ID
 */
export function usePromptLibrary(id: PromptLibraryId) {
  const { data: libraries, ...rest } = usePromptLibraries();
  
  const library = libraries?.find(lib => lib.id === id) || null;
  
  return {
    data: library,
    ...rest
  };
}

/**
 * Hook to get the default prompt library
 */
export function useDefaultPromptLibrary() {
  const { data: libraries, ...rest } = usePromptLibraries();
  
  const defaultLibrary = libraries?.[0] || libraries?.find(lib => lib.id === 'classic') || null;
  
  return {
    data: defaultLibrary,
    ...rest
  };
}
