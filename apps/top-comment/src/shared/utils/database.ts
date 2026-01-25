// Database utility functions for Supabase

type WithId<T> = T & { id: string };

export function toIsoDate(value: unknown | null | undefined) {
  if (!value) return undefined;
  if (typeof value === "string") return value;
  if (value instanceof Date) return value.toISOString();
  return undefined;
}

// Supabase doesn't need converters like Firestore did
// Data mapping is handled in the service layer
export function buildConverter<T extends Record<string, any>>(
  mapFrom: (data: Record<string, any>, docId: string) => T,
  mapTo?: (data: T) => Record<string, any>,
) {
  return {
    toSupabase: (value: WithId<T>) =>
      mapTo ? mapTo(value as T) : (value as Record<string, any>),
    fromSupabase: (data: Record<string, any>, id: string): WithId<T> => {
      return {
        ...mapFrom(data, id),
        id,
      };
    },
  };
}
