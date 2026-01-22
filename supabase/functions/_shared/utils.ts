// Shared utilities for Edge Functions

// @ts-ignore - ESM import from URL is valid in Supabase Edge Functions runtime
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

export class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public code?: string
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export function createSupabaseClient(req: Request) {
  return createClient(
    // @ts-ignore - Deno global is available in Supabase Edge Functions runtime
    Deno.env.get('SUPABASE_URL') ?? '',
    // @ts-ignore - Deno global is available in Supabase Edge Functions runtime
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    {
      global: {
        headers: { Authorization: req.headers.get('Authorization')! },
      },
    }
  );
}

export function createServiceClient() {
  return createClient(
    // @ts-ignore - Deno global is available in Supabase Edge Functions runtime
    Deno.env.get('SUPABASE_URL') ?? '',
    // @ts-ignore - Deno global is available in Supabase Edge Functions runtime
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );
}

// Helper function to decode base64url
function base64UrlDecode(str: string): string {
  let output = str.replace(/-/g, '+').replace(/_/g, '/');
  switch (output.length % 4) {
    case 0:
      break;
    case 2:
      output += '==';
      break;
    case 3:
      output += '=';
      break;
    default:
      throw new Error('Invalid base64url string');
  }
  return atob(output);
}

export async function getUserId(req: Request): Promise<string> {
  console.log('getUserId: Starting authentication check');
  const authHeader = req.headers.get('Authorization');
  console.log('getUserId: Auth header present:', !!authHeader);

  if (!authHeader) {
    console.log('getUserId: No auth header found');
    throw new AppError(401, 'Authentication required', 'unauthenticated');
  }

  const token = authHeader.replace('Bearer ', '');
  console.log('getUserId: Token extracted, length:', token.length);

  try {
    // Decode JWT payload (second part)
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid JWT format');
    }

    const payload = JSON.parse(base64UrlDecode(parts[1]));
    console.log('getUserId: Decoded payload - sub:', payload.sub, 'exp:', payload.exp);

    if (!payload.sub) {
      throw new Error('No user ID in token');
    }

    // Check if token is expired
    if (payload.exp && payload.exp * 1000 < Date.now()) {
      throw new Error('Token expired');
    }

    console.log('getUserId: Authentication successful, user ID:', payload.sub);
    return payload.sub;
  } catch (error) {
    console.log('getUserId: Token decode/validation failed:', error);
    throw new AppError(401, 'Invalid token', 'unauthenticated');
  }
}

export function requireString(value: unknown, field: string): string {
  if (typeof value !== 'string' || !value.trim()) {
    throw new AppError(400, `${field} is required`, 'invalid-argument');
  }
  return value.trim();
}

export function cleanTeamName(name: string): string {
  return name.trim().slice(0, 50);
}

export function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export function shuffleArray<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export async function corsResponse(
  data: unknown,
  status = 200
): Promise<Response> {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    },
  });
}

export async function handleError(error: unknown): Promise<Response> {
  console.error('Function error:', error);
  
  if (error instanceof AppError) {
    return corsResponse(
      { error: error.message, code: error.code },
      error.statusCode
    );
  }
  
  return corsResponse(
    { error: 'Internal server error' },
    500
  );
}

export function handleCors(req: Request): Response | null {
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    });
  }
  return null;
}

// Base handler that wraps common patterns for Edge Functions
export function createHandler(
  handlerFn: (req: Request, uid: string, supabase: any) => Promise<Response>
) {
  return async (req: Request): Promise<Response> => {
    // Handle CORS preflight
    const corsRes = handleCors(req);
    if (corsRes) return corsRes;

    try {
      // Authenticate user
      const uid = await getUserId(req);
      const supabase = createServiceClient();

      // Call the specific handler logic
      return await handlerFn(req, uid, supabase);
    } catch (error) {
      return handleError(error);
    }
  };
}

// Handler for functions that don't require authentication (like session creation)
export function createPublicHandler(
  handlerFn: (req: Request, supabase: any) => Promise<Response>
) {
  return async (req: Request): Promise<Response> => {
    // Handle CORS preflight
    const corsRes = handleCors(req);
    if (corsRes) return corsRes;

    try {
      const supabase = createServiceClient();

      // Call the specific handler logic (no auth required)
      return await handlerFn(req, supabase);
    } catch (error) {
      return handleError(error);
    }
  };
}

// Shared utility functions for common database operations
export async function getSession(supabase: any, sessionId: string) {
  const { data: session, error } = await supabase
    .from('sessions')
    .select('*')
    .eq('id', sessionId)
    .single();

  if (error || !session) {
    throw new AppError(404, 'Session not found', 'not-found');
  }

  return session;
}

export async function validateSessionPhase(session: any, requiredPhase: string) {
  if (session.status !== requiredPhase) {
    throw new AppError(400, `Session must be in ${requiredPhase} phase`, 'failed-precondition');
  }
}

/**
 * Returns "active" (joined) non-host teams for a session.
 * Definition: a team is active if it has at least one row in team_members.
 *
 * This avoids including pre-created empty teams in grouping/round logic.
 */
export async function getActiveTeamIds(
  supabase: any,
  sessionId: string,
): Promise<string[]> {
  const { data: teams, error: teamsError } = await supabase
    .from('teams')
    .select('id')
    .eq('session_id', sessionId)
    .eq('is_host', false);

  if (teamsError) {
    throw teamsError;
  }

  const teamIds: string[] = (teams ?? []).map((t: { id: string }) => t.id);
  if (teamIds.length === 0) {
    return [];
  }

  const { data: members, error: membersError } = await supabase
    .from('team_members')
    .select('team_id')
    .in('team_id', teamIds);

  if (membersError) {
    throw membersError;
  }

  const activeSet = new Set<string>(
    (members ?? []).map((m: { team_id: string }) => m.team_id),
  );

  return teamIds.filter((id) => activeSet.has(id));
}

/**
 * Verify that the user has an active venue account
 * Throws AppError if verification fails
 */
export async function verifyVenueAccount(uid: string, supabase: any): Promise<void> {
  const { data: venueAccount, error: venueError } = await supabase
    .from('venue_accounts')
    .select('id, is_active')
    .eq('auth_user_id', uid)
    .maybeSingle();

  if (venueError) {
    console.error('Failed to verify venue account', venueError);
    throw new AppError(500, 'Unable to verify venue account', 'venue-verification-failed');
  }

  if (!venueAccount || !venueAccount.is_active) {
    throw new AppError(403, 'Venue login required', 'venue-required');
  }
}


