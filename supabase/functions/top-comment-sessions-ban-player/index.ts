import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { corsHeaders } from "../_shared/cors.ts"

const supabaseUrl = Deno.env.get("SUPABASE_URL")!
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!

interface BanPlayerRequest {
  sessionId: string;
  teamId: string;
  userId: string;
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

    const { sessionId, teamId, userId }: BanPlayerRequest = await req.json()

    if (!sessionId || !teamId || !userId) {
      return new Response(
        JSON.stringify({ error: "sessionId, teamId, and userId are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    // Create service role client for admin operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // First, verify the session exists and get the host
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

    // Verify the player exists in this session
    const { data: team, error: teamError } = await supabase
      .from("top_comment_players")
      .select("id, display_name, user_id")
      .eq("id", teamId)
      .eq("session_id", sessionId)
      .single()

    if (teamError || !team) {
      return new Response(
        JSON.stringify({ error: "Player not found in session" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    console.log("Player to ban:", { userId, playerName: team.display_name })

    // Check if user is already banned
    const { data: existingBan } = await supabase
      .from("top_comment_banned_players")
      .select("id")
      .eq("session_id", sessionId)
      .eq("user_id", userId)
      .single()

    console.log("Existing ban check:", { existingBan })

    if (existingBan) {
      return new Response(
        JSON.stringify({ error: "User is already banned from this session" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    // 1. Remove the player record
    const { error: deleteError } = await supabase
      .from("top_comment_players")
      .delete()
      .eq("id", teamId)
      .eq("session_id", sessionId)

    if (deleteError) {
      console.error("Error removing player:", deleteError)
      return new Response(
        JSON.stringify({ error: "Failed to remove player" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    // 2. Add the user to banned_teams table
    const { error: banError } = await supabase
      .from("top_comment_banned_players")
      .insert({
        session_id: sessionId,
        user_id: userId,
        display_name: team.display_name,
        created_at: new Date().toISOString()
      })

    if (banError) {
      console.error("Error adding player to banned list:", banError)
      return new Response(
        JSON.stringify({ error: "Player was removed but ban could not be recorded" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    console.log(`Player ${team.display_name} (${userId}) banned from session ${sessionId}`)

    return new Response(
      JSON.stringify({ 
        success: true,
        message: "Player banned successfully"
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )

  } catch (error) {
    console.error("Ban player error:", error)
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  }
})
