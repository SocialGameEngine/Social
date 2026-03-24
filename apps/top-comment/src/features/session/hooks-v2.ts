/**
 * Enhanced Session Hooks with Async State Architecture
 * 
 * Refactored hooks using standardized async contracts for:
 * - useSession - Session data with subscription
 * - useMemberships - Session memberships with subscription
 * - useAnswers - Round answers with subscription
 * - useVotes - Round votes with subscription
 */

import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "../../supabase/client";
import type { Answer, Session, Vote } from "../../shared/types";
import type { AsyncSubscriptionResult } from "../../hooks/async/types";
import { fetchSession } from "./sessionService";

export function useSession(sessionId?: string): AsyncSubscriptionResult<Session> {
  const [data, setData] = useState<Session | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<"connecting" | "connected" | "disconnected" | "reconnecting" | "error">("disconnected");
  const [error, setError] = useState<Error | null>(null);
  const [subscriptionError, setSubscriptionError] = useState<Error | null>(null);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<number | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  const cleanup = useCallback(() => {
    if (channelRef.current) {
      channelRef.current.unsubscribe();
      channelRef.current = null;
    }
    setConnectionStatus("disconnected");
  }, []);

  const reconnect = useCallback(() => {
    if (!sessionId || reconnectAttempts.current >= maxReconnectAttempts) {
      setConnectionStatus("error");
      setError(new Error("Max reconnection attempts reached"));
      return;
    }

    reconnectAttempts.current += 1;
    setConnectionStatus("reconnecting");
    cleanup();
    
    setTimeout(() => {
      if (sessionId) {
        setConnectionStatus("connecting");
      }
    }, 1000 * reconnectAttempts.current);
  }, [sessionId, cleanup]);

  useEffect(() => {
    if (!sessionId) {
      setData(null);
      setConnectionStatus("disconnected");
      setError(null);
      setLastUpdatedAt(null);
      return;
    }

    let cancelled = false;
    setConnectionStatus("connecting");
    setError(null);

    fetchSession(sessionId)
      .then((session) => {
        if (!cancelled) {
          setData(session);
          setLastUpdatedAt(Date.now());
          setError(null);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err);
          setSubscriptionError(err);
          setConnectionStatus("error");
        }
      });

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
        () => {
          if (!cancelled) {
            fetchSession(sessionId)
              .then((session) => {
                if (!cancelled) {
                  setData(session);
                  setLastUpdatedAt(Date.now());
                }
              })
              .catch((err) => {
                if (!cancelled) {
                  setSubscriptionError(err);
                }
              });
          }
        }
      )
      .subscribe((status) => {
        if (!cancelled) {
          if (status === "SUBSCRIBED") {
            setConnectionStatus("connected");
            reconnectAttempts.current = 0;
          } else if (status === "CHANNEL_ERROR") {
            setConnectionStatus("error");
            setSubscriptionError(new Error("Subscription channel error"));
          } else if (status === "TIMED_OUT") {
            reconnect();
          }
        }
      });

    channelRef.current = channel;

    return () => {
      cancelled = true;
      cleanup();
    };
  }, [sessionId, cleanup, reconnect]);

  const getStatus = () => {
    if (connectionStatus === "connecting") return "loading" as const;
    if (connectionStatus === "reconnecting") return "reconnecting" as const;
    if (connectionStatus === "error") return "error" as const;
    if (connectionStatus === "disconnected") return "degraded" as const;
    if (!data) return "empty" as const;
    
    const isStale = lastUpdatedAt ? Date.now() - lastUpdatedAt > 30000 : false;
    if (isStale) return "stale" as const;
    
    return "ready" as const;
  };

  const isStale = lastUpdatedAt ? Date.now() - lastUpdatedAt > 30000 : false;
  const canInteract = connectionStatus === "connected" || !!data;

  return {
    status: getStatus(),
    data,
    error,
    retry: reconnect,
    lastUpdatedAt,
    isStale,
    canInteract,
    connectionStatus,
    reconnect,
    subscriptionError,
  };
}

export function useMemberships(sessionId?: string): AsyncSubscriptionResult<any[]> {
  const [data, setData] = useState<any[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<"connecting" | "connected" | "disconnected" | "reconnecting" | "error">("disconnected");
  const [error, setError] = useState<Error | null>(null);
  const [subscriptionError, setSubscriptionError] = useState<Error | null>(null);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<number | null>(null);

  useEffect(() => {
    if (!sessionId) {
      setData([]);
      setConnectionStatus("disconnected");
      return;
    }

    setConnectionStatus("connecting");
    
    const fetchMemberships = async () => {
      try {
        const { data: memberships, error: fetchError } = await supabase
          .from("room_memberships")
          .select("*")
          .eq("session_id", sessionId);

        if (fetchError) throw fetchError;
        
        setData(memberships || []);
        setLastUpdatedAt(Date.now());
        setConnectionStatus("connected");
      } catch (err) {
        setError(err as Error);
        setConnectionStatus("error");
      }
    };

    fetchMemberships();

    const channel = supabase
      .channel(`memberships:${sessionId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "room_memberships",
          filter: `session_id=eq.${sessionId}`,
        },
        () => {
          fetchMemberships();
        }
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          setConnectionStatus("connected");
        } else if (status === "CHANNEL_ERROR") {
          setConnectionStatus("error");
          setSubscriptionError(new Error("Membership subscription error"));
        }
      });

    return () => {
      channel.unsubscribe();
      setConnectionStatus("disconnected");
    };
  }, [sessionId]);

  const getStatus = () => {
    if (connectionStatus === "connecting") return "loading" as const;
    if (connectionStatus === "reconnecting") return "reconnecting" as const;
    if (connectionStatus === "error") return "error" as const;
    if (connectionStatus === "disconnected") return "degraded" as const;
    if (data.length === 0) return "empty" as const;
    return "ready" as const;
  };

  const isStale = lastUpdatedAt ? Date.now() - lastUpdatedAt > 30000 : false;
  const canInteract = connectionStatus === "connected" || data.length > 0;

  return {
    status: getStatus(),
    data,
    error,
    retry: () => {},
    lastUpdatedAt,
    isStale,
    canInteract,
    connectionStatus,
    reconnect: () => {},
    subscriptionError,
  };
}

export function useAnswers(sessionId?: string, roundIndex?: number): AsyncSubscriptionResult<Answer[]> {
  const [data, setData] = useState<Answer[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<"connecting" | "connected" | "disconnected" | "reconnecting" | "error">("disconnected");
  const [error, setError] = useState<Error | null>(null);
  const [subscriptionError, setSubscriptionError] = useState<Error | null>(null);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<number | null>(null);

  useEffect(() => {
    if (!sessionId || roundIndex === undefined) {
      setData([]);
      setConnectionStatus("disconnected");
      return;
    }

    setConnectionStatus("connecting");

    const fetchAnswers = async () => {
      try {
        const { data: answers, error: fetchError } = await supabase
          .from("top_comment_answers")
          .select("*")
          .eq("session_id", sessionId)
          .eq("round_index", roundIndex)
          .order("created_at", { ascending: true });

        if (fetchError) throw fetchError;

        const mappedAnswers = (answers || []).map((a: any) => ({
          id: a.id,
          membershipId: a.player_id,
          roundIndex: a.round_index,
          text: a.text,
          createdAt: a.created_at,
          masked: a.masked ?? false,
          groupId: a.group_id ?? "g0",
        }));

        setData(mappedAnswers);
        setLastUpdatedAt(Date.now());
        setConnectionStatus("connected");
      } catch (err) {
        setError(err as Error);
        setConnectionStatus("error");
      }
    };

    fetchAnswers();

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
          fetchAnswers();
        }
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          setConnectionStatus("connected");
        } else if (status === "CHANNEL_ERROR") {
          setConnectionStatus("error");
          setSubscriptionError(new Error("Answers subscription error"));
        }
      });

    return () => {
      channel.unsubscribe();
      setConnectionStatus("disconnected");
    };
  }, [sessionId, roundIndex]);

  const getStatus = () => {
    if (connectionStatus === "connecting") return "loading" as const;
    if (connectionStatus === "reconnecting") return "reconnecting" as const;
    if (connectionStatus === "error") return "error" as const;
    if (connectionStatus === "disconnected") return "degraded" as const;
    if (data.length === 0) return "empty" as const;
    return "ready" as const;
  };

  const isStale = lastUpdatedAt ? Date.now() - lastUpdatedAt > 30000 : false;
  const canInteract = connectionStatus === "connected" || data.length > 0;

  return {
    status: getStatus(),
    data,
    error,
    retry: () => {},
    lastUpdatedAt,
    isStale,
    canInteract,
    connectionStatus,
    reconnect: () => {},
    subscriptionError,
  };
}

export function useVotes(sessionId?: string, roundIndex?: number): AsyncSubscriptionResult<Vote[]> {
  const [data, setData] = useState<Vote[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<"connecting" | "connected" | "disconnected" | "reconnecting" | "error">("disconnected");
  const [error, setError] = useState<Error | null>(null);
  const [subscriptionError, setSubscriptionError] = useState<Error | null>(null);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<number | null>(null);

  useEffect(() => {
    if (!sessionId || roundIndex === undefined) {
      setData([]);
      setConnectionStatus("disconnected");
      return;
    }

    setConnectionStatus("connecting");

    const fetchVotes = async () => {
      try {
        const { data: votes, error: fetchError } = await supabase
          .from("top_comment_votes")
          .select("*")
          .eq("session_id", sessionId)
          .eq("round_index", roundIndex)
          .order("created_at", { ascending: true })
          .limit(200);

        if (fetchError) throw fetchError;

        const mappedVotes = (votes || []).map((v: any) => ({
          id: v.id,
          voterId: v.player_id,
          roundIndex: v.round_index,
          groupId: v.group_id ?? "g0",
          answerId: v.answer_id,
          createdAt: v.created_at,
        }));

        setData(mappedVotes);
        setLastUpdatedAt(Date.now());
        setConnectionStatus("connected");
      } catch (err) {
        setError(err as Error);
        setConnectionStatus("error");
      }
    };

    fetchVotes();

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
          fetchVotes();
        }
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          setConnectionStatus("connected");
        } else if (status === "CHANNEL_ERROR") {
          setConnectionStatus("error");
          setSubscriptionError(new Error("Votes subscription error"));
        }
      });

    return () => {
      channel.unsubscribe();
      setConnectionStatus("disconnected");
    };
  }, [sessionId, roundIndex]);

  const getStatus = () => {
    if (connectionStatus === "connecting") return "loading" as const;
    if (connectionStatus === "reconnecting") return "reconnecting" as const;
    if (connectionStatus === "error") return "error" as const;
    if (connectionStatus === "disconnected") return "degraded" as const;
    if (data.length === 0) return "empty" as const;
    return "ready" as const;
  };

  const isStale = lastUpdatedAt ? Date.now() - lastUpdatedAt > 30000 : false;
  const canInteract = connectionStatus === "connected" || data.length > 0;

  return {
    status: getStatus(),
    data,
    error,
    retry: () => {},
    lastUpdatedAt,
    isStale,
    canInteract,
    connectionStatus,
    reconnect: () => {},
    subscriptionError,
  };
}
