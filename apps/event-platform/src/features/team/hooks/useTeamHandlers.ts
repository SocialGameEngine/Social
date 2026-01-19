import { useCallback } from "react";
import type { Session, Answer, RoundGroup } from "../../../shared/types";
import { joinSession, submitAnswer, submitVote, selectCategory } from "../../session/sessionService";
import { maskProfanity, containsProfanity } from "../../../shared/utils/profanity";
import { answerSchema, joinSchema } from "../../../shared/schemas";
import { isBannedFromCode } from "../utils/teamConstants";

interface UseTeamHandlersProps {
  sessionId: string | null;
  session: Session | null;
  joinForm: { code: string; teamName: string };
  setJoinForm: (form: { code: string; teamName: string }) => void;
  setJoinErrors: (errors: Record<string, string>) => void;
  setIsJoining: (joining: boolean) => void;
  setSessionId: (id: string | null) => void;
  setTeamSession: (session: any) => void;
  clearTeamSession: () => void;
  setHasManuallyLeft: (hasLeft: boolean) => void;
  setAutoJoinAttempted: (attempted: boolean) => void;
  answerText: string;
  setAnswerText: (text: string) => void;
  myAnswer: Answer | null;
  myGroup: RoundGroup | null;
  setIsSubmittingAnswer: (submitting: boolean) => void;
  setIsSubmittingVote: (submitting: boolean) => void;
  setIsSubmittingCategorySelection: (submitting: boolean) => void;
  toast: (options: { title: string; variant: "success" | "error" | "info" }) => void;
}

export function useTeamHandlers({
  sessionId,
  session,
  joinForm,
  setJoinForm,
  setJoinErrors,
  setIsJoining,
  setSessionId,
  setTeamSession,
  clearTeamSession,
  setHasManuallyLeft,
  setAutoJoinAttempted,
  answerText,
  setAnswerText,
  myAnswer,
  myGroup,
  setIsSubmittingAnswer,
  setIsSubmittingVote,
  setIsSubmittingCategorySelection,
  toast,
}: UseTeamHandlersProps) {
  const handleJoin = useCallback(
    async (values: { code: string; teamName: string }) => {
      setIsJoining(true);
      setJoinErrors({});

      // Validate inputs before attempting to join
      const parsed = joinSchema.safeParse({
        code: values.code.trim().toUpperCase(),
        teamName: values.teamName.trim(),
      });

      if (!parsed.success) {
        const fieldErrors: Record<string, string> = {};
        parsed.error.issues.forEach((issue) => {
          const path = issue.path[0];
          if (typeof path === "string") {
            fieldErrors[path] = issue.message;
          }
        });
        setJoinErrors(fieldErrors);
        
        // Show toast with the first error message
        const firstError = parsed.error.issues[0];
        toast({
          title: firstError?.message ?? "Please check your input",
          variant: "error",
        });
        setIsJoining(false);
        return;
      }

      // Check if player was banned from this session
      if (isBannedFromCode(parsed.data.code)) {
        setJoinErrors({ code: "You were banned from this session" });
        toast({
          title: "You were banned from this session and cannot rejoin.",
          variant: "error",
        });
        setIsJoining(false);
        return;
      }

      // Clear old team session before joining new team to prevent auto-join from restoring it
      clearTeamSession();

      try {
        const response = await joinSession({
          code: parsed.data.code,
          teamName: parsed.data.teamName,
        });

        if (!response) {
          throw new Error("Failed to join session");
        }

        setSessionId(response.session.id);
        setTeamSession({
          sessionId: response.session.id,
          code: response.session.code,
          teamName: response.team.teamName,
          teamId: response.team.id,
          uid: response.team.uid,
        });
        setAnswerText("");

        // Reset hasManuallyLeft flag when user successfully joins
        setHasManuallyLeft(false);
        
        // Note: We don't clear kicked sessions here because the check happens BEFORE join
        // If they got past the check, they're joining a different session
        
        toast({
          title: "Joined successfully!",
          variant: "success",
        });
      } catch (error) {
        console.error("Join session error:", error);
        const errorMessage = error instanceof Error ? error.message : "Failed to join session";
        setJoinErrors({ form: errorMessage });
        toast({
          title: errorMessage || "Failed to join",
          variant: "error",
        });
      } finally {
        setIsJoining(false);
        setAutoJoinAttempted(true);
      }
    },
    [
      setIsJoining,
      setJoinErrors,
      setSessionId,
      setTeamSession,
      setAnswerText,
      setHasManuallyLeft,
      toast,
      setAutoJoinAttempted,
    ]
  );

  const handleSubmitAnswer = useCallback(async () => {
    if (!session || !sessionId) return;
    
    if (containsProfanity(answerText)) {
      toast({
        title: "Inappropriate language detected - Keep it classy!",
        variant: "error",
      });
      return;
    }

    const parsed = answerSchema.safeParse(answerText);
    if (!parsed.success) {
      toast({
        title: parsed.error.issues[0]?.message ?? "Invalid answer",
        variant: "error",
      });
      return;
    }

    setIsSubmittingAnswer(true);
    const isUpdating = !!myAnswer;
    
    try {
      const response = await submitAnswer({
        sessionId: session.id,
        text: maskProfanity(parsed.data),
      });
      
      toast({
        title: response?.isUpdate ? "Answer updated!" : "Answer locked in!",
        variant: "success",
      });
    } catch (error: any) {
      console.error('Submit answer error:', error);
      
      const errorMessage = error instanceof Error ? error.message : "Failed to submit answer";
      toast({
        title: errorMessage,
        variant: "error",
      });
    } finally {
      setIsSubmittingAnswer(false);
    }
  }, [
    session,
    sessionId,
    answerText,
    myAnswer,
    setIsSubmittingAnswer,
    toast,
  ]);

  const handleVote = useCallback(
    async (answerId: string) => {
      if (!session || !sessionId) return;

      setIsSubmittingVote(true);
      try {
        await submitVote({
          sessionId: session.id,
          answerId,
        });
        toast({
          title: "Vote submitted!",
          variant: "success",
        });
      } catch (error) {
        toast({
          title: "Failed to submit vote",
          variant: "error",
        });
      } finally {
        setIsSubmittingVote(false);
      }
    },
    [session, sessionId, setIsSubmittingVote, toast]
  );

  const handleSelectCategory = useCallback(
    async (categoryId: string, promptIndex: number) => {
      if (!session || !myGroup) return;
      
      setIsSubmittingCategorySelection(true);
      try {
        await selectCategory({
          sessionId: session.id,
          groupId: myGroup.id,
          categoryId,
          promptIndex,
        });
        
        toast({
          title: "Category selected!",
          variant: "success",
        });
      } catch (error) {
        console.error("Category selection error:", error);
        toast({
          title: "Failed to select category",
          variant: "error",
        });
      } finally {
        setIsSubmittingCategorySelection(false);
      }
    },
    [session, myGroup, toast, setIsSubmittingCategorySelection]
  );

  return {
    handleJoin,
    handleSubmitAnswer,
    handleVote,
    handleSelectCategory,
  };
}
