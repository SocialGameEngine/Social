import { useEffect, useState } from "react";
import type { Answer, Team, Session, Vote } from "../../shared/types";
import {
  subscribeToAnswers,
  subscribeToTeams,
  subscribeToSession,
  subscribeToVotes,
} from "./sessionService";

export function useSession(sessionId?: string) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasSnapshot, setHasSnapshot] = useState(false);

  useEffect(() => {
    if (!sessionId) {
      setSession(null);
      setLoading(false);
      setHasSnapshot(false);
      return;
    }
    setSession(null);
    setLoading(true);
    setHasSnapshot(false);
    return subscribeToSession(sessionId, (data) => {
      setSession(data);
      setLoading(false);
      setHasSnapshot(true);
    });
  }, [sessionId]);

  return { session, loading, hasSnapshot };
}

export function useTeams(sessionId?: string) {
  const [teams, setTeams] = useState<Team[]>([]);

  useEffect(() => {
    if (!sessionId) {
      setTeams([]);
      return;
    }
    return subscribeToTeams(sessionId, setTeams);
  }, [sessionId]);

  return teams;
}

export function useAnswers(sessionId?: string, roundIndex?: number) {
  const [answers, setAnswers] = useState<Answer[]>([]);

  useEffect(() => {
    if (!sessionId || roundIndex === undefined) {
      setAnswers([]);
      return;
    }
    return subscribeToAnswers(sessionId, roundIndex, setAnswers);
  }, [sessionId, roundIndex]);

  return answers;
}

export function useVotes(sessionId?: string, roundIndex?: number) {
  const [votes, setVotes] = useState<Vote[]>([]);

  useEffect(() => {
    if (!sessionId || roundIndex === undefined) {
      setVotes([]);
      return;
    }
    return subscribeToVotes(sessionId, roundIndex, setVotes);
  }, [sessionId, roundIndex]);

  return votes;
}
