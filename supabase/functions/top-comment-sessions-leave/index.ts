// Leave session and remove user from team
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

interface LeaveSessionRequest {
  sessionId: string;
  teamId: string;
}

Deno.serve(async (req) => {
  console.log('≡ƒöÑ sessions-leave function called:', req.method, req.url);
  
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    console.log('≡ƒöÑ Handling CORS preflight');
    return new Response('ok', { headers: corsHeaders })
  }
  
  // Simple test endpoint (no auth required)
  if (req.url.includes('/health')) {
    console.log('≡ƒöÑ Health check accessed');
    return new Response('OK', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Get auth token from header
    const authHeader = req.headers.get('Authorization')
    console.log('≡ƒöÑ Auth header:', authHeader ? 'present' : 'missing');
    
    if (!authHeader) {
      console.log('Γ¥î No authorization header found');
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get user from auth
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    )

    console.log('≡ƒöÑ Auth result:', { hasUser: !!user, authError, userId: user?.id });

    if (authError || !user) {
      console.log('Γ¥î Invalid authentication:', authError);
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { sessionId, teamId } = await req.json() as LeaveSessionRequest
    console.log('≡ƒöÑ Leave session request:', { sessionId, teamId, userId: user.id })

    // Remove player record
    const { error: deleteError } = await supabase
      .from('top_comment_players')
      .delete()
      .eq('id', teamId)
      .eq('session_id', sessionId)
      .eq('user_id', user.id)

    if (deleteError) {
      console.error('Error removing player:', deleteError)
      return new Response(
        JSON.stringify({ error: 'Failed to leave session' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Successfully left session:', { teamId, userId: user.id })

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Leave session error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
