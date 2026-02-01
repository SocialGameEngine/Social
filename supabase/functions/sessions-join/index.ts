// @ts-nocheck - Deno runtime types not available in IDE
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { corsHeaders } from "../_shared/cors.ts"

class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public code?: string
  ) {
    super(message);
    this.name = 'AppError';
  }
}

const supabaseUrl = Deno.env.get("SUPABASE_URL")!
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!

interface JoinSessionRequest {
  code: string;
  teamName: string;
  playerName?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    console.log("CORS preflight request detected");
    return new Response("ok", { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    console.log("Method not allowed:", req.method);
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const body = await req.json();
    const { code, teamName, playerName }: JoinSessionRequest = body;

    if (!code || !teamName) {
      console.error("Missing required fields:", { code, teamName })
      return new Response(
        JSON.stringify({ error: "code and teamName are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    // Normalize inputs
    const normalizedCode = code.trim().toUpperCase()
    const normalizedTeamName = teamName.trim()

    // Create service role client for admin operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    // Get the authenticated user from the request
    const authHeader = req.headers.get('Authorization')
    let userId = null
    let isAuthenticated = false
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '')
      const { data: { user } } = await supabase.auth.getUser(token)
      userId = user?.id
      isAuthenticated = !!user
    }

    // Detect code type: 6 digits = session code, 4 digits = team code
    const isSessionCode = normalizedCode.length === 6;
    const isTeamCode = normalizedCode.length === 4;
    
    let session: any = null;
    let teamCodeData: any = null;
    console.log("Starting session lookup...");
    
    if (isSessionCode) {
      // Traditional flow: Find session by 6-digit code
      console.log("Looking for session with code:", normalizedCode);
      const { data: sessionData, error: sessionError } = await supabase
        .from("sessions")
        .select("id, code, status, settings, ended_by_host")
        .eq("code", normalizedCode)
        .single();
        
      if (sessionError || !sessionData) {
        console.error("Session not found:", sessionError);
        return new Response(
          JSON.stringify({ error: "Session not found" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      session = sessionData;
    } else if (isTeamCode) {
      // New flow: Find team code and get session
      const { data: codeData, error: codeError } = await supabase
        .from("team_codes")
        .select("session_id, team_id, is_used")
        .eq("code", normalizedCode)
        .single();
        
      if (codeError || !codeData) {
        console.error("Team code not found:", codeError);
        return new Response(
          JSON.stringify({ error: "Team code not found" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      teamCodeData = codeData;
      
      // Get session details
      const { data: sessionData, error: sessionError } = await supabase
        .from("sessions")
        .select("id, code, status, settings, ended_by_host")
        .eq("id", teamCodeData.session_id)
        .single();
        
      if (sessionError || !sessionData) {
        console.error("Session not found for team code:", sessionError);
        return new Response(
          JSON.stringify({ error: "Session not found" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      session = sessionData;
    } else {
      return new Response(
        JSON.stringify({ error: "Invalid code format" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Session found:", { id: session.id, status: session.status })

    let existingTeam: any = null;
    let isRejoining = false;
    
    if (isTeamCode && teamCodeData.team_id) {
      // Team code flow: Check if team exists
      console.log("Checking existing team for team code...");
      const { data: teamData, error: teamError } = await supabase
        .from("teams")
        .select("id, team_name")
        .eq("id", teamCodeData.team_id)
        .single();
        
      if (!teamError && teamData) {
        existingTeam = teamData;
        console.log("Found existing team for team code:", teamData);
        
        // Check if user is already a member of this team
        let userIsAlreadyMember = false;
        if (userId) {
          console.log("Checking if user is already member:", { 
            teamId: teamData.id, 
            userId: userId 
          });
          
          const { data: memberCheck, error: memberCheckError } = await supabase
            .from("team_members")
            .select("id, user_id")
            .eq("team_id", teamData.id)
            .eq("user_id", userId)
            .single();
          
          console.log("Member check result:", { 
            memberCheck, 
            memberCheckError, 
            isMember: !!memberCheck 
          });
          
          userIsAlreadyMember = !!memberCheck;
        }
        
        isRejoining = userIsAlreadyMember;
        console.log("Rejoin detection result:", { 
          userId, 
          isRejoining, 
          userIsAlreadyMember 
        });
      }
    } else {
      // Session code flow: Check if team with this name exists
      console.log("Checking if team already exists...");
      const { data: teamData, error: existingTeamError } = await supabase
        .from("teams")
        .select("id, team_name")
        .eq("session_id", session.id)
        .eq("team_name", normalizedTeamName)
        .single();

      // Check if user is already a member of this team
      let userIsAlreadyMember = false;
      if (teamData && !existingTeamError && userId) {
        const { data: memberCheck } = await supabase
          .from("team_members")
          .select("id")
          .eq("team_id", teamData.id)
          .eq("user_id", userId)
          .single();
        
        userIsAlreadyMember = !!memberCheck;
      }
      
      isRejoining = userIsAlreadyMember;
      existingTeam = teamData;
    }

    // If rejoining, allow it regardless of session status
    if (isRejoining) {
      console.log("Team is rejoining - allowing access")
      
      // Add user to team_members if not already there
      if (userId && existingTeam) {
        // Check if user is already a member
        const { data: existingMember } = await supabase
          .from("team_members")
          .select("id")
          .eq("team_id", existingTeam.id)
          .eq("user_id", userId)
          .single();
          
        if (!existingMember) {
          console.log("Adding user to team_members for existing team:", {
            team_id: existingTeam.id,
            user_id: userId,
            player_name: playerName
          });
          
          const { error: memberError } = await supabase
            .from("team_members")
            .insert({
              team_id: existingTeam.id,
              user_id: userId,
              device_id: null,
              player_name: playerName || null,
              is_captain: false, // Rejoining users are not captains
              joined_at: new Date().toISOString()
            });
            
          if (memberError) {
            console.error("Error adding team member on rejoin:", memberError);
            // Don't fail the join, just log the error
          } else {
            console.log("Successfully added user to team_members");
          }
        } else {
          console.log("User already a member, updating player name if needed");
          
          // Update player name if it's different
          if (playerName) {
            const { error: updateError } = await supabase
              .from("team_members")
              .update({ player_name: playerName })
              .eq("id", existingMember.id);
              
            if (updateError) {
              console.error("Error updating player name on rejoin:", updateError);
            } else {
              console.log("Updated player name to:", playerName);
            }
          }
        }
      }
      
      return new Response(
        JSON.stringify({ 
          sessionId: session.id,
          session: {
            id: session.id,
            code: session.code,
            status: session.status,
            settings: session.settings
          },
          team: {
            id: existingTeam.id,
            teamName: normalizedTeamName,
            uid: userId || null
          }
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    // For team code joins, skip session status and capacity checks
    // Teams are pre-created, so we just need to join the specific team
    console.log("Team code flow - skipping session capacity checks")

    // For team codes, skip duplicate validation since teams are pre-created
    // For session codes, we could add validation here if needed

    // Check if this user (by UID) is banned from this session
    try {
      const { data: bannedUsers, error: bannedError } = await supabase
        .from("banned_teams" as any)
        .select("id, uid")
        .eq("session_id", session.id)
        .eq("uid", userId)

      // Only block if we successfully got data and found a ban
      if (!bannedError && bannedUsers && bannedUsers.length > 0) {
        return new Response(
          JSON.stringify({ error: "You were banned from this session and cannot rejoin." }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        )
      }
      
      // Log errors but don't block join
      if (bannedError) {
        console.log("Banned check error (table might not exist yet):", bannedError)
      }
    } catch (banCheckError) {
      console.log("Ban check failed, continuing join:", banCheckError)
    }

    // Create the new team
    console.log("Creating team with userId:", userId)
    
    // Allow anonymous users (userId can be null)
    console.log("User authentication status:", { userId, isAuthenticated })
    
    let newTeam: any = null;
    
    if (isTeamCode && teamCodeData.team_id) {
      // Team code flow: Join existing team
      console.log("Joining existing team from team code:", teamCodeData.team_id);
      
      // Get the existing team
      const { data: teamData, error: teamError } = await supabase
        .from("teams")
        .select("id, team_name, captain_id")
        .eq("id", teamCodeData.team_id)
        .single();
        
      if (teamError || !teamData) {
        console.error("Team not found for team code:", teamError);
        return new Response(
          JSON.stringify({ error: "Team not found" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      // Check if user is already a member of this team
      if (userId) {
        const { data: existingMember } = await supabase
          .from("team_members")
          .select("id")
          .eq("team_id", teamCodeData.team_id)
          .eq("user_id", userId)
          .single();
          
        if (existingMember) {
          console.log("User already a member of this team, updating player name if needed");
          
          // Update player name if it's different
          if (playerName) {
            const { error: updateError } = await supabase
              .from("team_members")
              .update({ player_name: playerName })
              .eq("id", existingMember.id);
              
            if (updateError) {
              console.error("Error updating player name:", updateError);
            } else {
              console.log("Updated player name to:", playerName);
            }
          }
          
          newTeam = teamData;
          console.log("Successfully rejoined existing team");
          // Skip to response
        } else {
          // Check if user is banned from this session
          const { data: isBanned } = await supabase
            .from('banned_teams')
            .select('id')
            .eq('session_id', teamCodeData.session_id)
            .eq('uid', userId)
            .single();
          
          if (isBanned) {
            console.log('User is banned from this session:', userId);
            return new Response(
              JSON.stringify({ error: 'You are banned from this session' }),
              { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }
          
          // User is not a member yet, check if team has any members
          const { data: existingMembers, error: countError } = await supabase
            .from("team_members")
            .select("id")
            .eq("team_id", teamCodeData.team_id);
          
          const teamHasMembers = !countError && existingMembers && existingMembers.length > 0;
          const shouldBecomeCaptain = !teamHasMembers;
          
          console.log("Team member check for captain assignment", {
            teamId: teamCodeData.team_id,
            existingMembersCount: existingMembers?.length || 0,
            teamHasMembers,
            shouldBecomeCaptain,
            userId: userId
          });
          
          // Generate a device ID for unauthenticated users to track them
          const deviceId = userId ? null : `device_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
          
          let isCaptain = false;
          if (shouldBecomeCaptain) {
            console.log("Setting first member as captain:", userId || deviceId);
            
            // Set both captain_id and uid on the team, and update team name
            // For unauthenticated users, use device_id or null
            const { error: captainError } = await supabase
              .from("teams")
              .update({ 
                captain_id: userId, // Can be null for unauthenticated users
                uid: userId || deviceId,  // Use deviceId if userId is null
                team_name: normalizedTeamName  // Update team name with user input
              })
              .eq("id", teamCodeData.team_id);
            
            if (captainError) {
              console.error("Error setting captain:", captainError);
            } else {
              isCaptain = true;
              console.log("Successfully set as team captain:", userId || deviceId);
            }
          } else {
            console.log("NOT setting as captain (shouldBecomeCaptain=false):", userId || deviceId);
          }
          
          // Add player as team member
          const memberData = {
            team_id: teamCodeData.team_id,
            user_id: userId, // Can be null for unauthenticated users
            device_id: deviceId,
            player_name: playerName || null,
            is_captain: isCaptain,
            joined_at: new Date().toISOString()
          };
          
          console.log("Adding player as team member:", memberData);
          
          const { error: memberError } = await supabase
            .from("team_members")
            .insert(memberData);
          
          if (memberError) {
            console.error("CRITICAL: Failed to insert team member:", {
              error: memberError,
              message: memberError.message,
              details: memberError.details,
              hint: memberError.hint,
              code: memberError.code
            });
          }
          
          // Verify what was actually inserted and fix if needed
          if (!memberError) {
            // Query by user_id if authenticated, otherwise by device_id
            const query = supabase
              .from("team_members")
              .select("id, user_id, device_id, player_name, is_captain, joined_at")
              .eq("team_id", teamCodeData.team_id);
            
            if (userId) {
              query.eq("user_id", userId);
            } else {
              query.eq("device_id", deviceId);
            }
            
            const { data: insertedMember } = await query.single();
            
            console.log("Verification - what was actually inserted:", insertedMember);
            
            // Fix: If database incorrectly set is_captain to true, override it
            if (insertedMember && insertedMember.is_captain !== isCaptain) {
              console.log("DATABASE OVERRIDE DETECTED - Fixing incorrect is_captain value:", {
                expected: isCaptain,
                actual: insertedMember.is_captain,
                userId: userId
              });
              
              const { error: fixError } = await supabase
                .from("team_members")
                .update({ is_captain: isCaptain })
                .eq("id", insertedMember.id);
              
              if (fixError) {
                console.error("Failed to fix is_captain value:", fixError);
              } else {
                console.log("Successfully fixed is_captain value to:", isCaptain);
                
                // Verify the fix worked
                const { data: fixedMember } = await supabase
                  .from("team_members")
                  .select("id, user_id, player_name, is_captain")
                  .eq("id", insertedMember.id)
                  .single();
                
                console.log("Post-fix verification:", fixedMember);
              }
            }
          }
        
          if (memberError) {
            console.error("Error adding team member:", memberError);
            console.error("Error details:", {
              message: memberError.message,
              details: memberError.details,
              hint: memberError.hint,
              code: memberError.code
            });
            // Don't fail the join, just log the error
            console.log("Continuing with join despite team member error");
          }
          
          newTeam = {
            ...teamData,
            team_name: normalizedTeamName  // Use the updated team name
          };
          console.log("Successfully added player to existing team");
        }
      }
    } else {
      // Session code flow: Find an available team to join
      console.log("Session code flow - finding available team");
      
      // Get all teams for this session
      const { data: availableTeams, error: teamsError } = await supabase
        .from("teams")
        .select("id, team_name, captain_id")
        .eq("session_id", session.id)
        .is("captain_id", null) // Find teams without a captain
        .limit(1);
      
      if (teamsError || !availableTeams || availableTeams.length === 0) {
        console.error("No available teams found:", teamsError);
        return new Response(
          JSON.stringify({ error: "No available teams. All teams are full." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      // Join the first available team
      const teamToJoin = availableTeams[0];
      console.log("Joining available team:", teamToJoin);
      
      // Set this user as captain
      // For unauthenticated users, use device_id or null
      const { error: captainError } = await supabase
        .from("teams")
        .update({ 
          captain_id: userId, // Can be null for unauthenticated users
          uid: userId || deviceId, // Use deviceId if userId is null
          team_name: normalizedTeamName // Update team name
        })
        .eq("id", teamToJoin.id);
      
      if (captainError) {
        console.error("Error setting captain:", captainError);
      }
      
      // Add player as team member
      // Generate a device ID for unauthenticated users to track them
      const deviceId = userId ? null : `device_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      
      const memberData = {
        team_id: teamToJoin.id,
        user_id: userId, // Can be null for unauthenticated users
        device_id: deviceId,
        player_name: playerName || null,
        is_captain: true,
        joined_at: new Date().toISOString()
      };
      
      console.log("Adding player as team captain:", memberData);
      
      const { error: memberError } = await supabase
        .from("team_members")
        .insert(memberData);
      
      if (memberError) {
        console.error("Error adding team member:", memberError);
      }
      
      newTeam = {
        ...teamToJoin,
        team_name: normalizedTeamName
      };
      console.log("Successfully joined team via session code");
    }

    console.log(`Team ${newTeam.team_name || normalizedTeamName} joined session ${session.id}`)
    console.log('Team data being returned:', {
      teamId: newTeam.id,
      teamName: newTeam.team_name || normalizedTeamName,
      teamUid: newTeam.uid
    });

    // Return format matching frontend expectations
    const response = {
      sessionId: session.id,
      session: {
        id: session.id,
        code: session.code,
        status: session.status,
        settings: session.settings,
        endedByHost: session.ended_by_host || false
      },
      team: {
        id: newTeam.id,
        teamName: newTeam.team_name || normalizedTeamName,
        uid: newTeam.uid || null
      }
    };
    
    console.log('Full response:', JSON.stringify(response, null, 2));
    
    return new Response(
      JSON.stringify(response),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )

  } catch (error) {
    console.error("Join session error:", error)
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  }
})
