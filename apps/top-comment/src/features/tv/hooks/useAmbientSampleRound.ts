import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../../supabase/client';

export interface AmbientSampleRound {
  id: string;
  title: string;
  content: string | null;
  type: string;
}

export function useAmbientSampleRound() {
  return useQuery<AmbientSampleRound | null>({
    queryKey: ['ambient-sample-round'],
    queryFn: async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from('ambient_rounds')
        .select('id, title, content, type')
        .order('order_index', { ascending: true })
        .limit(1)
        .maybeSingle();

      if (error) {
        if (error.code === 'PGRST116') return null;
        throw error;
      }
      return data as AmbientSampleRound | null;
    },
    staleTime: 5 * 60_000,
  });
}
