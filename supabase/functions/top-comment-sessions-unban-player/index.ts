import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { corsHeaders } from "../_shared/cors.ts"

const supabaseUrl = Deno.env.get("SUPABASE_URL")!
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!

interface UnbanPlayerRequest {
  sessionId: string;
  bannedTeamId: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    // Only allow POST requests
    if (req.method !== "POST") {
      return new Response(
        JSON.stringify({ error: "Method not allowed" }),
        { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    const { sessionId, bannedTeamId }: UnbanPlayerRequest = await req.json()

    if (!sessionId || !bannedTeamId) {
      return new Response(
        JSON.stringify({ error: "sessionId and bannedTeamId are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    // Create service role client for admin operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Verify the session exists and get the host
    const { data: session, error: sessionError } = await supabase
      .from("top_comment_sessions")
      .select("host_uid")
      .eq("id", sessionId)
      .single()

    if (sessionError || !session) {
      return new Response(
        JSON.stringify({ error: "Session not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    // Verify the banned player entry exists
    const { data: bannedTeam, error: bannedError } = await supabase
      .from("top_comment_banned_players")
      .select("id")
      .eq("id", bannedTeamId)
      .eq("session_id", sessionId)
      .single()

    if (bannedError || !bannedTeam) {
      return new Response(
        JSON.stringify({ error: "Banned player not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    // Remove the ban
    const { error: deleteError } = await supabase
      .from("top_comment_banned_players")
      .delete()
      .eq("id", bannedTeamId)
      .eq("session_id", sessionId)

    if (deleteError) {
      console.error("Error unbanning player:", deleteError)
      return new Response(
        JSON.stringify({ error: "Failed to unban player" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    console.log(`Player unbanned from session ${sessionId}`)

    return new Response(
      JSON.stringify({ 
        success: true,
        message: "Player unbanned successfully"
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )

  } catch (error) {
    console.error("Unban player error:", error)
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  }
})
