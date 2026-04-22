import { getSupabaseClient } from '@social/db';

const supabase = getSupabaseClient();

export { supabase };

export async function ensureAnonymousAuth() {
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.user) {
    return session.user;
  }

  const { data, error } = await supabase.auth.signInAnonymously();
  if (error) {
    console.error('Failed to sign in anonymously:', error);
    return null;
  }
  return data.user;
}

export async function signInWithEmail(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function createUserWithEmail(
  email: string,
  password: string,
  displayName?: string
) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${window.location.origin}/join`,
      data: {
        display_name: displayName,
      },
    },
  });
  if (error) throw error;
  return data;
}

export async function signOutUser() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function signInAnonymouslyUser() {
  const { data, error } = await supabase.auth.signInAnonymously();
  if (error) {
    console.error('Failed to sign in anonymously:', error);
    // Re-throw so callers (AuthProvider, SignedOutPrompt, etc.) can react.
    // Previously this swallowed the error and returned null, which made
    // "Continue as guest" silently no-op when the Supabase project has
    // anonymous sign-ins disabled.
    throw error;
  }
  return data.user;
}

export async function ensureVenueAccountProfile(options?: { fullName?: string; phone?: string }) {
  const { data, error } = await supabase.functions.invoke('venue-accounts-register', {
    body: {
      fullName: options?.fullName,
      phone: options?.phone,
    },
  });

  if (error) {
    console.error('Edge function error:', error);
    throw error;
  }

  // Return the venue account data from the edge function
  return data;
}

