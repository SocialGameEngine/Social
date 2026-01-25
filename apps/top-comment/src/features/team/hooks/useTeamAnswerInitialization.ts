import { useEffect } from "react";

interface UseTeamAnswerInitializationProps {
  session: any;
  myAnswer: any;
  answerText: string;
  setAnswerText: (text: string) => void;
  lastInitializedRoundRef: React.MutableRefObject<number | null>;
}

export function useTeamAnswerInitialization({
  session,
  myAnswer,
  answerText,
  setAnswerText,
  lastInitializedRoundRef,
}: UseTeamAnswerInitializationProps) {
  // Initialize answerText with existing answer when available
  useEffect(() => {
    if (!session || session.status !== "answer") {
      return;
    }
    const currentRoundIndex = session.roundIndex;
    const lastRound = lastInitializedRoundRef.current;

    // If round changed, always clear answer text first
    if (lastRound !== null && lastRound !== currentRoundIndex) {
      lastInitializedRoundRef.current = currentRoundIndex;
      setAnswerText("");
    }

    // Initialize for the first time
    if (lastRound === null) {
      lastInitializedRoundRef.current = currentRoundIndex;
    }

    // Initialize with answer for current round if it exists and input is empty
    // Only initialize if myAnswer exists and matches current round
    if (
      myAnswer &&
      myAnswer.roundIndex === currentRoundIndex &&
      !answerText.trim()
    ) {
      setAnswerText(myAnswer.text);
    }
  }, [
    session?.status,
    session?.roundIndex,
    myAnswer?.id,
    myAnswer?.roundIndex,
    myAnswer?.text,
    setAnswerText,
  ]);
}
