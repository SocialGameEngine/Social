import { useState, useRef } from "react";
import type { Session, Team } from "../../../shared/types";

const HAS_MANUALLY_LEFT_KEY = "social-has-manually-left";

/**
 * Manages all state for the TeamPage component
 * Consolidates 15 useState and 2 useRef declarations
 */
export function useTeamState(teamSession: { sessionId: string; code: string; teamName: string } | null) {
  const [sessionId, setSessionId] = useState<string | null>(
    teamSession?.sessionId ?? null
  );
  const [joinForm, setJoinForm] = useState({
    code: teamSession?.code ?? "",
    teamName: teamSession?.teamName ?? "",
  });
  const [joinErrors, setJoinErrors] = useState<Record<string, string>>({});
  const [isJoining, setIsJoining] = useState(false);
  const [answerText, setAnswerText] = useState("");
  const [isSubmittingAnswer, setIsSubmittingAnswer] = useState(false);
  const [isSubmittingVote, setIsSubmittingVote] = useState(false);
  const [isSubmittingCategorySelection, setIsSubmittingCategorySelection] = useState(false);
  const [autoJoinAttempted, setAutoJoinAttempted] = useState(false);
  const [showHowToPlay, setShowHowToPlay] = useState(false);
  const [howToPlayInitialPhase, setHowToPlayInitialPhase] = useState<Session["status"] | null>(null);
  
  const [hasManuallyLeft, setHasManuallyLeft] = useState(() => {
    if (typeof window === "undefined") return false;
    try {
      return window.sessionStorage.getItem(HAS_MANUALLY_LEFT_KEY) === "true";
    } catch {
      return false;
    }
  });
  
  const [finalSession, setFinalSession] = useState<Session | null>(null);
  const [finalTeams, setFinalTeams] = useState<Team[]>([]);
  const [showKickedModal, setShowKickedModal] = useState(false);
  const [showSessionEndedModal, setShowSessionEndedModal] = useState(false);
  const [showVIBoxModal, setShowVIBoxModal] = useState(false);
  const [now, setNow] = useState(Date.now());
  
  const scoreboardRef = useRef<HTMLDivElement | null>(null);
  const lastInitializedRoundRef = useRef<number | null>(null);

  return {
    sessionId,
    setSessionId,
    joinForm,
    setJoinForm,
    joinErrors,
    setJoinErrors,
    isJoining,
    setIsJoining,
    answerText,
    setAnswerText,
    isSubmittingAnswer,
    setIsSubmittingAnswer,
    isSubmittingVote,
    setIsSubmittingVote,
    isSubmittingCategorySelection,
    setIsSubmittingCategorySelection,
    autoJoinAttempted,
    setAutoJoinAttempted,
    showHowToPlay,
    setShowHowToPlay,
    howToPlayInitialPhase,
    setHowToPlayInitialPhase,
    hasManuallyLeft,
    setHasManuallyLeft,
    finalSession,
    setFinalSession,
    finalTeams,
    setFinalTeams,
    showKickedModal,
    setShowKickedModal,
    showSessionEndedModal,
    setShowSessionEndedModal,
    showVIBoxModal,
    setShowVIBoxModal,
    now,
    setNow,
    scoreboardRef,
    lastInitializedRoundRef,
  };
}
