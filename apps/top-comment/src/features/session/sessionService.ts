import { supabase } from "../../supabase/client";

import type {
  CreateSessionRequest,
  CreateSessionResponse,
  UpdateSessionRequest,
  UpdateSessionResponse,
  JoinSessionRequest,
  JoinSessionResponse,
  SessionAnalyticsResponse,
  StartGameRequest,
  SubmitAnswerRequest,
  SubmitAnswerResponse,
  SubmitVoteRequest,
  TransitionPhaseRequest,
  SetPromptLibraryRequest,
  SetPromptLibraryResponse,
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
  
  const mappedSession = {
    id: data.id,
    code: data.code,
    hostUid: data.host_uid,
    status: data.status,
    roundIndex: data.round_index ?? 0,
    rounds: Array.isArray(data.rounds)
      ? data.rounds.map((round: any) => {
          if (round && typeof round === "object" && Array.isArray(round.groups)) {
            const groups = round.groups.map((group: any, index: number) => {
              
              return {
                id: typeof group.id === "string" ? group.id : `g${index}`,
                prompt: typeof group.prompt === "string" ? group.prompt : "",
                teamIds: Array.isArray(group.teamIds) ? group.teamIds.filter((value: any): value is string => typeof value === "string") : [],
                selectingTeamId: group.selectingTeamId,
                promptLibraryId: group.promptLibraryId,
              };
            });
            
            const mappedRound = {
              prompt: typeof round.prompt === "string" ? round.prompt : groups[0]?.prompt,
              groups,
            };
            
            return mappedRound;
          }
          if (round && typeof round === "object" && "prompt" in round && typeof round.prompt === "string") {
            return { prompt: round.prompt, groups: [] };
          }
          if (typeof round === "string") {
            return { prompt: round, groups: [] };
          }
          return { prompt: "", groups: [] };
        })
      : data.rounds || [],
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
    selectedLibraries: data.selected_libraries,
    currentLibraryIndex: data.current_library_index,
    paused: data.paused ?? false,
    pausedAt: data.paused_at,
    totalPausedMs: data.total_paused_ms ?? 0,
    endedByHost: data.ended_by_host ?? false,
  };
  
  return mappedSession;
}

// Helper to convert Supabase player to our Team type
function mapTeam(data: any): Team | null {
  if (!data) return null;
  
  return {
    id: data.id,
    uid: data.user_id || null,
    teamName: data.display_name,
    isHost: false,
    score: data.score ?? 0,
    joinedAt: data.joined_at ?? new Date().toISOString(),
    lastActiveAt: data.last_active_at,
    mascotId: undefined,
  };
}

// Helper to convert Supabase answer to our Answer type
function mapAnswer(data: any): Answer | null {
  if (!data) return null;
  
  return {
    id: data.id,
    teamId: data.player_id,
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
    voterId: data.player_id,
    roundIndex: data.round_index,
    groupId: typeof data.group_id === "string" ? data.group_id : "g0",
    answerId: data.answer_id,
    createdAt: data.created_at ?? new Date().toISOString(),
  };
}

export async function fetchSession(sessionId: string) {
  const { data, error } = await supabase
    .from("top_comment_sessions")
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
        table: "top_comment_sessions",
        filter: `id=eq.${sessionId}`,
      },
      (payload) => {
        const mappedSession = mapSession(payload.new);
        callback(mappedSession);
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
    supabase
      .from("top_comment_players")
      .select("*")
      .eq("session_id", sessionId)
      .order("joined_at", { ascending: true })
      .then(({ data, error }) => {
        if (error) {
          console.error("Error fetching players:", error);
          callback([]);
        } else {
          const teams = data?.map(mapTeam).filter((team): team is Team => !!team) ?? [];
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
        table: "top_comment_players",
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

  // Subscribe to teams table changes
  teamsChannel.subscribe((status) => {
    if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
      console.error("Failed to subscribe to teams:", status);
    }
  });
  
  return () => {
    // Clear fallback polling if it exists
    const teamsFallbackInterval = (teamsChannel as any)._fallbackInterval;
    if (teamsFallbackInterval) {
      clearInterval(teamsFallbackInterval);
    }
    teamsChannel.unsubscribe();
  };
}

export function subscribeToAnswers(
  sessionId: string,
  roundIndex: number,
  callback: (answers: Answer[]) => void,
) {
  // Initial fetch
  supabase
    .from("top_comment_answers")
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
        table: "top_comment_answers",
        filter: `session_id=eq.${sessionId}`,
      },
      () => {
        // Refetch answers for this round
        supabase
          .from("top_comment_answers")
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
    .from("top_comment_votes")
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
        table: "top_comment_votes",
        filter: `session_id=eq.${sessionId}`,
      },
      () => {
        // Refetch votes for this round
        supabase
          .from("top_comment_votes")
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
    "top-comment-sessions-create",
    { body: payload }
  );

  if (error) throw error;
  if (!data) throw new Error("No data returned from createSession");
  return data;
};

export const updateSession = async (payload: UpdateSessionRequest) => {
  const { data, error } = await supabase.functions.invoke<UpdateSessionResponse>(
    "top-comment-sessions-update",
    { body: payload }
  );

  if (error) throw error;
  if (!data) throw new Error("No data returned from updateSession");
  return data;
};

export const setPromptLibrary = async (payload: SetPromptLibraryRequest) => {
  const { data, error } = await supabase.functions.invoke<SetPromptLibraryResponse>(
    "top-comment-sessions-set-prompt-library",
    { body: payload }
  );
  if (error) throw error;
  return data;
};

export const joinSession = async (payload: JoinSessionRequest) => {
  const { data, error } = await supabase.functions.invoke<JoinSessionResponse>(
    "top-comment-sessions-join",
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
          throw new Error("Invalid request. Please check your session code and display name.");
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
      throw new Error("Invalid request. Please check your session code and display name.");
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

  const response = await fetch(`${supabaseUrl}/functions/v1/top-comment-sessions-start`, {
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
    "top-comment-sessions-advance",
    { body: payload }
  );
  
  if (response.error) {
    throw response.error;
  }
  
  return response.data;
};

export const submitAnswer = async (payload: SubmitAnswerRequest) => {
  const { data, error } = await supabase.functions.invoke<SubmitAnswerResponse>(
    "top-comment-answers-submit",
    { body: payload }
  );

  if (error) throw error;
  return data;
};

export const submitVote = async (payload: SubmitVoteRequest) => {
  const { data, error } = await supabase.functions.invoke<{ success: boolean }>(
    "top-comment-votes-submit",
    { body: payload }
  );
  if (error) throw error;
  return data;
};

export const kickPlayer = async (payload: { sessionId: string; teamId: string; userId: string }) => {
  const { data, error } = await supabase.functions.invoke<{ success: boolean }>(
    "top-comment-sessions-kick-player",
    { body: payload }
  );
  if (error) throw error;
  return data;
};

export const banPlayer = async (payload: { sessionId: string; teamId: string; userId: string }) => {
  const { data, error } = await supabase.functions.invoke<{ success: boolean }>(
    "top-comment-sessions-ban-player",
    { body: payload }
  );
  if (error) throw error;
  return data;
};

export const captainKickMember = async (payload: { sessionId: string; teamId: string; userIdToKick: string }) => {
  const { data, error } = await supabase.functions.invoke<{ success: boolean }>(
    "top-comment-captain-kick-member",
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
    "top-comment-host-kick-member",
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
    "top-comment-captain-promote-member",
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
      "top-comment-captain-update-team-name",
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
    "top-comment-sessions-end",
    { body: payload }
  );
  if (error) throw error;
  return data;
};

export const fetchAnalytics = async (
  sessionId: string,
): Promise<SessionAnalytics | null> => {
  const { data, error } = await supabase.functions.invoke<SessionAnalyticsResponse>(
    "top-comment-sessions-analytics",
    { body: { sessionId } }
  );
  if (error) throw error;
  if (!data) return null;
  return data.analytics;
};

export const pauseSession = async (payload: { sessionId: string; pause: boolean }) => {
  const { data, error } = await supabase.functions.invoke<{ session: Session }>(
    "top-comment-sessions-pause",
    { body: payload }
  );
  if (error) throw error;
  return data;
};

export const leaveSession = async (payload: { sessionId: string; teamId: string }) => {
  const { data, error } = await supabase.functions.invoke<{ success: boolean }>(
    "top-comment-sessions-leave",
    { body: payload }
  );

  if (error) throw error;
  if (!data) throw new Error("No response data from leave session");
  return data;
};
