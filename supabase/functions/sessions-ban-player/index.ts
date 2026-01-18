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
      .from("sessions")
      .select("host_uid")
      .eq("id", sessionId)
      .single()

    if (sessionError || !session) {
      return new Response(
        JSON.stringify({ error: "Session not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    // Verify the team exists in this session
    const { data: team, error: teamError } = await supabase
      .from("teams")
      .select("id, team_name, uid")
      .eq("id", teamId)
      .eq("session_id", sessionId)
      .single()

    if (teamError || !team) {
      return new Response(
        JSON.stringify({ error: "Team not found in session" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    // Get the team member to check if they exist and if they're captain
    const { data: member, error: memberError } = await supabase
      .from("team_members")
      .select("user_id, player_name, is_captain")
      .eq("team_id", teamId)
      .eq("user_id", userId)
      .single()

    if (memberError || !member) {
      return new Response(
        JSON.stringify({ error: "Player not found in team" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    console.log("Player to ban:", { userId, playerName: member.player_name, isCaptain: member.is_captain })

    // Check if user is already banned
    const { data: existingBan } = await supabase
      .from("banned_teams")
      .select("id")
      .eq("session_id", sessionId)
      .eq("uid", userId)
      .single()

    console.log("Existing ban check:", { existingBan })

    if (existingBan) {
      return new Response(
        JSON.stringify({ error: "User is already banned from this session" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    // 1. Remove the player from team_members
    const { error: deleteError } = await supabase
      .from("team_members")
      .delete()
      .eq("team_id", teamId)
      .eq("user_id", userId)

    if (deleteError) {
      console.error("Error removing player from team:", deleteError)
      return new Response(
        JSON.stringify({ error: "Failed to remove player from team" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    // 2. Add the user to banned_teams table
    const { error: banError } = await supabase
      .from("banned_teams")
      .insert({
        session_id: sessionId,
        team_id: teamId,
        team_name: team.team_name,
        uid: userId,  // Ban by user_id
        banned_by: session.host_uid,
        reason: "Banned by host"
      })

    if (banError) {
      console.error("Error adding player to banned list:", banError)
      return new Response(
        JSON.stringify({ error: "Player was removed but ban could not be recorded" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    // 3. If banned player was captain, handle captain promotion
    if (member.is_captain) {
      console.log("Banned player was captain, checking for remaining members")
      
      // Get remaining team members
      const { data: remainingMembers } = await supabase
        .from("team_members")
        .select("id, user_id")
        .eq("team_id", teamId)
        .order("joined_at", { ascending: true })
      
      if (remainingMembers && remainingMembers.length > 0) {
        // Promote first remaining member to captain
        const newCaptain = remainingMembers[0]
        console.log("Promoting new captain:", newCaptain.user_id)
        
        await supabase
          .from("teams")
          .update({
            captain_id: newCaptain.user_id,
            uid: newCaptain.user_id
          })
          .eq("id", teamId)
        
        await supabase
          .from("team_members")
          .update({ is_captain: true })
          .eq("id", newCaptain.id)
        
        console.log("Successfully promoted new captain")
      } else {
        // No members left, clear captain fields
        console.log("No members left, clearing captain fields")
        
        await supabase
          .from("teams")
          .update({
            captain_id: null,
            uid: null
          })
          .eq("id", teamId)
        
        console.log("Team is now empty and invisible")
      }
    }

    console.log(`Player ${member.player_name} (${userId}) banned from session ${sessionId}`)

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
