import { supabase } from "../../supabase/client";

// Define team member interface
interface TeamMember {
  id: string;
  team_id: string;
  user_id: string;
  is_captain: boolean;
  joined_at: string;
  player_name?: string;
}
import type {
  CreateSessionRequest,
  CreateSessionResponse,
  JoinSessionRequest,
  JoinSessionResponse,
  KickTeamRequest,
  SessionAnalyticsResponse,
  StartGameRequest,
  SubmitAnswerRequest,
  SubmitAnswerResponse,
  SubmitVoteRequest,
  TransitionPhaseRequest,
  SetPromptLibraryRequest,
  SetPromptLibraryResponse,
  CategorySelectionRequest,
  CategorySelectionResponse,
  Answer,
  Team,
  Session,
  SessionSettings,
  SessionAnalytics,
  Vote,
} from "../../shared/types";

// Helper to convert Supabase session to our Session type
function mapSession(data: any): Session | null {
  if (!data) return null;
  
  return {
    id: data.id,
    code: data.code,
    hostUid: data.host_uid,
    status: data.status,
    roundIndex: data.round_index ?? 0,
    rounds: Array.isArray(data.rounds)
      ? data.rounds.map((round: any) => {
          if (round && typeof round === "object" && Array.isArray(round.groups)) {
            const groups = round.groups.map((group: any, index: number) => ({
              id: typeof group.id === "string" ? group.id : `g${index}`,
              prompt: typeof group.prompt === "string" ? group.prompt : "",
              teamIds: Array.isArray(group.teamIds) ? group.teamIds.filter((value: any): value is string => typeof value === "string") : [],
              selectingTeamId: group.selectingTeamId,
              promptLibraryId: group.promptLibraryId,
            }));
            return {
              prompt: typeof round.prompt === "string" ? round.prompt : groups[0]?.prompt,
              groups,
            };
          }
          if (round && typeof round === "object" && "prompt" in round && typeof round.prompt === "string") {
            return { prompt: round.prompt, groups: [] };
          }
          if (typeof round === "string") {
            return { prompt: round, groups: [] };
          }
          return { prompt: undefined, groups: [] };
        })
      : [],
    voteGroupIndex: typeof data.vote_group_index === "number" ? data.vote_group_index : null,
    createdAt: data.created_at ?? new Date().toISOString(),
    startedAt: data.started_at,
    endsAt: data.ends_at,
    settings: (data.settings ?? {
      answerSecs: 90,
      voteSecs: 30,
      resultsSecs: 12,
      maxTeams: 24,
    }) as SessionSettings,
    venueName: data.venue_name,
    promptLibraryId: typeof data.prompt_library_id === "string" ? data.prompt_library_id : undefined,
    categoryGrid: data.category_grid,
    paused: data.paused ?? false,
    pausedAt: data.paused_at,
    totalPausedMs: data.total_paused_ms ?? 0,
    endedByHost: data.ended_by_host ?? false,
  };
}

// Helper to convert Supabase team to our Team type
function mapTeam(data: any): Team | null {
  if (!data) return null;
  
  // Ensure team_members is always an array (never null/undefined)
  const teamMembers = Array.isArray(data.team_members) ? data.team_members : [];
  
  return {
    id: data.id,
    uid: data.uid || null, // Handle nullable uid for teams without captains
    teamName: data.team_name,
    isHost: data.is_host ?? false,
    score: data.score ?? 0,
    joinedAt: data.joined_at ?? new Date().toISOString(),
    lastActiveAt: data.last_active_at,
    mascotId: typeof data.mascot_id === "number" ? data.mascot_id : undefined,
    team_members: teamMembers, // Always an array, never null/undefined
  };
}

// Helper to convert Supabase answer to our Answer type
function mapAnswer(data: any): Answer | null {
  if (!data) return null;
  
  return {
    id: data.id,
    teamId: data.team_id,
    roundIndex: data.round_index,
    text: data.text,
    createdAt: data.created_at ?? new Date().toISOString(),
    masked: data.masked ?? false,
    groupId: typeof data.group_id === "string" ? data.group_id : "g0",
  };
}

// Helper to convert Supabase vote to our Vote type
function mapVote(data: any): Vote | null {
  if (!data) return null;
  
  return {
    id: data.id,
    voterId: data.voter_id,
    roundIndex: data.round_index,
    groupId: typeof data.group_id === "string" ? data.group_id : "g0",
    answerId: data.answer_id,
    createdAt: data.created_at ?? new Date().toISOString(),
  };
}

export async function fetchSession(sessionId: string) {
  const { data, error } = await supabase
    .from("sessions")
    .select("*")
    .eq("id", sessionId)
    .single();
  
  if (error) throw error;
  if (!data) throw new Error("Session not found");
  
    
  return mapSession(data);
}

export function subscribeToSession(
  sessionId: string,
  callback: (session: Session | null) => void,
) {
  // Initial fetch
  fetchSession(sessionId).then(callback);
  
  // Subscribe to changes
  const channel = supabase
    .channel(`session:${sessionId}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "sessions",
        filter: `id=eq.${sessionId}`,
      },
      (payload) => {
        callback(mapSession(payload.new));
      }
    )
    .subscribe();
  
  return () => {
    channel.unsubscribe();
  };
}

export function subscribeToTeams(
  sessionId: string,
  callback: (teams: Team[]) => void,
) {
  // Initial fetch
  const fetchTeams = () => {
    // First, get all teams with their members
    supabase
      .from("teams")
      .select(`
        *,
        team_members (
          id,
          user_id,
          player_name,
          is_captain,
          joined_at
        )
      `)
      .eq("session_id", sessionId)
      .not("uid", "is", null) // Only fetch teams with captains (but they might have no members)
      .order("joined_at", { ascending: true })
      .then(({ data, error }) => {
        if (error) {
          console.error("Error fetching teams:", error);
          callback([]);
        } else {
          if (!data || data.length === 0) {
            callback([]);
            return;
          }
          
          // Filter out teams with no members at the raw data level
          // This catches cases where Supabase returns null or empty arrays for team_members
          const teamsWithMembers = data.filter((rawTeam: any) => {
            const rawMembers = rawTeam.team_members;
            // Exclude teams with null, undefined, non-array, or empty team_members
            return rawMembers && Array.isArray(rawMembers) && rawMembers.length > 0;
          });
          
          // Map and filter the teams
          const teams = teamsWithMembers
            .map(mapTeam)
            .filter((team): team is Team => {
              if (!team) return false;
              // Final check after mapping
              const members = team.team_members;
              return members && Array.isArray(members) && members.length > 0;
            });
          
          callback(teams);
        }
      });
  };

  // Initial fetch
  fetchTeams();
  
  // Subscribe to teams table changes
  const teamsChannel = supabase
    .channel(`teams:${sessionId}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "teams",
        filter: `session_id=eq.${sessionId}`,
      },
      (payload) => {
        // Handle different event types
        if (payload.eventType === 'DELETE') {
          // Team deleted - refetch immediately
          fetchTeams();
        } else if (payload.eventType === 'UPDATE') {
          // Team updated - check if uid was set to null (all players left)
          const newData = payload.new as any;
          const oldData = payload.old as any;
          
          // If uid changed from non-null to null, team is now empty - refetch immediately
          if (oldData?.uid && !newData?.uid) {
            setTimeout(() => fetchTeams(), 50);
          } else {
            // Other updates can use a small delay
            setTimeout(() => fetchTeams(), 100);
          }
        } else if (payload.eventType === 'INSERT') {
          // New team added
          setTimeout(() => fetchTeams(), 100);
        } else {
          // Unknown event type, refetch anyway
          fetchTeams();
        }
      }
    );

  // Subscribe to team_members table changes
  // We need to listen to all team_members changes and refetch teams
  // This ensures that when players leave, the teams list updates immediately
  const membersChannel = supabase
    .channel(`team_members:${sessionId}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "team_members",
      },
      (payload) => {
        // Always refetch teams when team_members change
        // This ensures empty teams are removed immediately and member lists update
        // Use a delay to allow database transaction to complete
        // For DELETE events, refetch immediately; for others, use a small delay
        if (payload.eventType === 'DELETE') {
          // DELETE events need immediate refetch to remove players from UI
          setTimeout(() => {
            fetchTeams();
          }, 100);
        } else {
          // INSERT/UPDATE events can use a shorter delay
          setTimeout(() => {
            fetchTeams();
          }, 50);
        }
      }
    );

  // Subscribe both channels
  teamsChannel.subscribe((status) => {
    if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
      console.error("Failed to subscribe to teams:", status);
    }
  });

  membersChannel.subscribe((status) => {
    if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
      console.error("Failed to subscribe to team members:", status);
    }
  });
  
  return () => {
    // Clear fallback polling if it exists
    const teamsFallbackInterval = (teamsChannel as any)._fallbackInterval;
    if (teamsFallbackInterval) {
      clearInterval(teamsFallbackInterval);
    }
    teamsChannel.unsubscribe();
    membersChannel.unsubscribe();
  };
}

export function subscribeToAnswers(
  sessionId: string,
  roundIndex: number,
  callback: (answers: Answer[]) => void,
) {
  // Initial fetch
  supabase
    .from("answers")
    .select("*")
    .eq("session_id", sessionId)
    .eq("round_index", roundIndex)
    .order("created_at", { ascending: true })
    .then(({ data, error }) => {
      if (error) {
        console.error("Error fetching answers:", error);
        callback([]);
      } else {
        callback(data?.map(mapAnswer).filter((answer): answer is Answer => Boolean(answer)) ?? []);
      }
    });
  
  // Subscribe to changes
  const channel = supabase
    .channel(`answers:${sessionId}:${roundIndex}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "answers",
        filter: `session_id=eq.${sessionId}`,
      },
      () => {
        // Refetch answers for this round
        supabase
          .from("answers")
          .select("*")
          .eq("session_id", sessionId)
          .eq("round_index", roundIndex)
          .order("created_at", { ascending: true })
          .then(({ data, error }) => {
            if (!error && data) {
              callback(data.map(mapAnswer).filter((answer): answer is Answer => Boolean(answer)));
            }
          });
      }
    )
    .subscribe();
  
  return () => {
    channel.unsubscribe();
  };
}

export function subscribeToVotes(
  sessionId: string,
  roundIndex: number,
  callback: (votes: Vote[]) => void,
) {
  // Initial fetch
  supabase
    .from("votes")
    .select("*")
    .eq("session_id", sessionId)
    .eq("round_index", roundIndex)
    .order("created_at", { ascending: true })
    .limit(200)
    .then(({ data, error }) => {
      if (error) {
        console.error("Error fetching votes:", error);
        callback([]);
      } else {
        callback(data?.map(mapVote).filter((vote): vote is Vote => Boolean(vote)) ?? []);
      }
    });
  
  // Subscribe to changes
  const channel = supabase
    .channel(`votes:${sessionId}:${roundIndex}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "votes",
        filter: `session_id=eq.${sessionId}`,
      },
      () => {
        // Refetch votes for this round
        supabase
          .from("votes")
          .select("*")
          .eq("session_id", sessionId)
          .eq("round_index", roundIndex)
          .order("created_at", { ascending: true })
          .limit(200)
          .then(({ data, error }) => {
            if (!error && data) {
              callback(data.map(mapVote).filter((vote): vote is Vote => Boolean(vote)));
            }
          });
      }
    )
    .subscribe();
  
  return () => {
    channel.unsubscribe();
  };
}

// Edge Function calls (replacing Firebase Functions)
export const createSession = async (payload: CreateSessionRequest) => {
  const { data, error } = await supabase.functions.invoke<CreateSessionResponse>(
    "sessions-create",
    { body: payload }
  );

  if (error) throw error;
  if (!data) throw new Error("No data returned from createSession");
  return data;
};

export const setPromptLibrary = async (payload: SetPromptLibraryRequest) => {
  const { data, error } = await supabase.functions.invoke<SetPromptLibraryResponse>(
    "sessions-set-prompt-library",
    { body: payload }
  );
  if (error) throw error;
  return data;
};

export const joinSession = async (payload: JoinSessionRequest) => {
  const { data, error } = await supabase.functions.invoke<JoinSessionResponse>(
    "sessions-join",
    { body: payload }
  );
  
  // Check if data contains an error field (from our Edge Function)
  // This happens when the function returns a non-2xx status with JSON body
  if (data && 'error' in data) {
    console.error("Join session returned error:", data.error);
    throw new Error((data as any).error);
  }
  
  if (error) {
    console.error("Join session error details:", error);
    console.error("Error object:", JSON.stringify(error, null, 2));
    
    // Try to extract context from the error
    const context = (error as any)?.context;
    if (context) {
      console.error("Error context:", context);
      
      // Check if context is a Response object with status
      if (context instanceof Response) {
        console.error("Response status:", context.status);
        if (context.status === 403) {
          throw new Error("You were banned from this session and cannot rejoin.");
        } else if (context.status === 400) {
          throw new Error("Invalid request. Please check your session code and team name.");
        } else if (context.status === 404) {
          throw new Error("Session not found. Please check the session code.");
        }
      }
      
      // If there's context with an error message, use it
      if (context.error) {
        throw new Error(context.error);
      }
      // If there's a body with error, parse it
      if (context.body) {
        try {
          const body = typeof context.body === 'string' ? JSON.parse(context.body) : context.body;
          console.error("Error body:", body);
          if (body.error) {
            throw new Error(body.error);
          }
        } catch (e) {
          console.error("Failed to parse error body:", e);
        }
      }
    }
    
    // Default error messages based on status
    const status = (error as any)?.status;
    console.error("Error status:", status);
    if (status === 403) {
      throw new Error("You were banned from this session and cannot rejoin.");
    } else if (status === 400) {
      throw new Error("Invalid request. Please check your session code and team name.");
    } else if (status === 404) {
      throw new Error("Session not found. Please check the session code.");
    }
    
    // Generic error
    throw new Error("Failed to join session. Please try again.");
  }
  
  if (!data) {
    throw new Error("No response data from join session");
  }
  return data;
};

export const startGame = async (payload: StartGameRequest) => {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  // Get current session for auth token
  const { data: { session } } = await supabase.auth.getSession();
  const authToken = session?.access_token || supabaseKey;

  const response = await fetch(`${supabaseUrl}/functions/v1/sessions-start`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`,
      'apikey': supabaseKey,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Failed to start game' }));
    throw new Error(errorData.message || errorData.error || 'Failed to start game');
  }

  return response.json();
};

export const advancePhase = async (payload: TransitionPhaseRequest) => {
  const response = await supabase.functions.invoke<{ session: Session }>(
    "sessions-advance",
    { body: payload }
  );
  
  if (response.error) {
    throw response.error;
  }
  
  return response.data;
};

export const submitAnswer = async (payload: SubmitAnswerRequest) => {
  const { data, error } = await supabase.functions.invoke<SubmitAnswerResponse>(
    "answers-submit",
    { body: payload }
  );

  if (error) throw error;
  return data;
};

export const submitVote = async (payload: SubmitVoteRequest) => {
  const { data, error } = await supabase.functions.invoke<{ success: boolean }>(
    "votes-submit",
    { body: payload }
  );
  if (error) throw error;
  return data;
};

export const kickPlayer = async (payload: { sessionId: string; teamId: string; userId: string }) => {
  const { data, error } = await supabase.functions.invoke<{ success: boolean }>(
    "sessions-kick-player",
    { body: payload }
  );
  if (error) throw error;
  return data;
};

export const banPlayer = async (payload: { sessionId: string; teamId: string; userId: string }) => {
  const { data, error } = await supabase.functions.invoke<{ success: boolean }>(
    "sessions-ban-player",
    { body: payload }
  );
  if (error) throw error;
  return data;
};

export const captainKickMember = async (payload: { sessionId: string; teamId: string; userIdToKick: string }) => {
  const { data, error } = await supabase.functions.invoke<{ success: boolean }>(
    "captain-kick-member",
    { body: payload }
  );

  if (error) {
    console.error('Error kicking member:', error);
    throw new Error('Failed to kick team member');
  }

  return data;
};

export const hostKickMember = async (payload: { sessionId: string; teamId: string; userIdToKick: string }) => {
  const { data, error } = await supabase.functions.invoke<{ success: boolean }>(
    "host-kick-member",
    { body: payload }
  );

  if (error) {
    console.error('Error kicking member:', error);
    throw new Error('Failed to kick team member');
  }

  return data;
};

export const captainPromoteMember = async (payload: { sessionId: string; teamId: string; userIdToPromote: string }) => {
  const { data, error } = await supabase.functions.invoke<{ success: boolean }>(
    "captain-promote-member",
    { body: payload }
  );

  if (error) {
    console.error('Error promoting member:', error);
    throw new Error('Failed to promote team member');
  }

  return data;
};

export const captainUpdateTeamName = async (payload: { sessionId: string; teamId: string; teamName: string }) => {
  try {
    const { data, error } = await supabase.functions.invoke<{ success: boolean } | { error: string }>(
      "captain-update-team-name",
      { body: payload }
    );

    // Check if data contains an error field (from our Edge Function)
    if (data && 'error' in data) {
      console.error("Update team name returned error:", data.error);
      throw new Error((data as any).error);
    }

    if (error) {
      console.error('Error updating team name:', error);
      
      // Check if it's a function not found error
      const errorMessage = (error as any)?.message || (error as any)?.error || '';
      if (errorMessage.includes('Function not found') || errorMessage.includes('Failed to send a request')) {
        throw new Error('Edge function not deployed. Please deploy captain-update-team-name function to Supabase.');
      }
      
      // Try to extract error message from error object
      const finalErrorMessage = errorMessage || 'Failed to update team name';
      throw new Error(finalErrorMessage);
    }

    return data;
  } catch (err) {
    // Re-throw if it's already an Error with a message
    if (err instanceof Error) {
      throw err;
    }
    // Otherwise wrap it
    throw new Error('Failed to update team name. Please ensure the edge function is deployed.');
  }
};

export const endSession = async (payload: TransitionPhaseRequest) => {
  const { data, error } = await supabase.functions.invoke<{ session: Session }>(
    "sessions-end",
    { body: payload }
  );
  if (error) throw error;
  return data;
};

export const fetchAnalytics = async (
  sessionId: string,
): Promise<SessionAnalytics | null> => {
  const { data, error } = await supabase.functions.invoke<SessionAnalyticsResponse>(
    "sessions-analytics",
    { body: { sessionId } }
  );
  if (error) throw error;
  if (!data) return null;
  return data.analytics;
};

export const pauseSession = async (payload: { sessionId: string; pause: boolean }) => {
  const { data, error } = await supabase.functions.invoke<{ session: Session }>(
    "sessions-pause",
    { body: payload }
  );
  if (error) throw error;
  return data;
};

export const leaveSession = async (payload: { sessionId: string; teamId: string }) => {
  const { data, error } = await supabase.functions.invoke<{ success: boolean }>(
    "sessions-leave",
    { body: payload }
  );

  if (error) throw error;
  if (!data) throw new Error("No response data from leave session");
  return data;
};

export const selectCategory = async (
  payload: CategorySelectionRequest
): Promise<CategorySelectionResponse> => {
  const { data, error } = await supabase.functions.invoke<CategorySelectionResponse>(
    "sessions-select-category",
    { body: payload }
  );

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    throw new Error("No data returned from category selection");
  }

  return data;
};
