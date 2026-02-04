import { useCallback } from "react";
import type { Session, Answer, RoundGroup } from "../../../shared/types";
import { submitAnswer, submitVote } from "../../session/sessionService";
import { roomService } from "../../../services/roomService";
import { roomMembershipService } from "../../../services/roomMembershipService";
import { answerSchema, joinSchema } from "../../../shared/schemas";
import { isBannedFromRoom } from "../utils/teamConstants";
import { useAuth } from "../../../shared/providers/AuthContext";

interface UseTeamHandlersProps {
  sessionId: string | null;
  session: Session | null;
  joinForm: { code: string; playerName: string };
  setJoinForm: (form: { code: string; playerName: string }) => void;
  setJoinErrors: (errors: Record<string, string>) => void;
  setIsJoining: (joining: boolean) => void;
  setSessionId: (id: string | null) => void;
  setTeamSession: (session: any) => void;
  setTeamRoom: (room: { roomId: string; roomCode: string; playerName: string } | null) => void;
  clearTeamSession: () => void;
  setHasManuallyLeft: (hasLeft: boolean) => void;
  setAutoJoinAttempted: (attempted: boolean) => void;
  answerText: string;
  setAnswerText: (text: string) => void;
  myAnswer: Answer | null;
  myGroup: RoundGroup | null;
  setIsSubmittingAnswer: (submitting: boolean) => void;
  setIsSubmittingVote: (submitting: boolean) => void;
  toast: (options: { title: string; variant: "success" | "error" | "info" }) => void;
}

export function useTeamHandlers({
  sessionId,
  session,
  setJoinErrors,
  setIsJoining,
  setSessionId,
  setTeamSession,
  setTeamRoom,
  clearTeamSession,
  setHasManuallyLeft,
  setAutoJoinAttempted,
  answerText,
  setAnswerText,
  myAnswer,
  setIsSubmittingAnswer,
  setIsSubmittingVote,
  toast,
}: UseTeamHandlersProps) {
  const { user } = useAuth();
  const handleJoin = useCallback(
    async (values: { code: string; playerName: string }) => {
      setIsJoining(true);
      setJoinErrors({});

      // Validate inputs before attempting to join
      const parsed = joinSchema.safeParse({
        code: values.code.trim().toUpperCase(),
        playerName: values.playerName.trim(),
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

      // Check if player was banned from this room
      const roomResponse = await roomService.getRoom({ code: parsed.data.code }).catch(() => null);
      if (roomResponse?.room && user) {
        const isBanned = await isBannedFromRoom(roomResponse.room.id, user.id);
        if (isBanned) {
          setJoinErrors({ code: "You were banned from this room" });
          toast({
            title: "You were banned from this room and cannot rejoin.",
            variant: "error",
          });
          setIsJoining(false);
          return;
        }
      }

      // Clear old team session before joining new team to prevent auto-join from restoring it
      clearTeamSession();

      try {
        if (roomResponse?.room) {
          // If no active session, we MUST join the room explicitly to show up in the lobby
          if (!roomResponse.room.currentSessionId) {
            try {
              await roomMembershipService.joinRoom({
                code: parsed.data.code,
                playerName: parsed.data.playerName,
              });

              setTeamRoom({
                roomId: roomResponse.room.id,
                roomCode: roomResponse.room.code,
                playerName: parsed.data.playerName,
                // No membershipId needed - we use UUID-based user identification
              });
            } catch (joinErr) {
              // Handle already in room or other issues gracefully
              setTeamRoom({
                roomId: roomResponse.room.id,
                roomCode: roomResponse.room.code,
                playerName: parsed.data.playerName,
              });
            }

            setSessionId(null);
            setJoinErrors({});
            toast({
              title: "You're in the room lobby. Waiting for the host to start.",
              variant: "info",
            });
            return;
          } else {
            // Even if there is a session, let's track the room info locally
            setTeamRoom({
              roomId: roomResponse.room.id,
              roomCode: roomResponse.room.code,
              playerName: parsed.data.playerName,
            });
          }
        }

        // DEPRECATED: joinSession removed - using room-based approach only
        // If we reach here, there's an active session but we should still join the room first
        // The session-based approach is deprecated in favor of room-based architecture
        
        // For now, just set the session ID if we have a room with active session
        if (roomResponse?.room?.currentSessionId) {
          setSessionId(roomResponse.room.currentSessionId);
          setTeamSession({
            sessionId: roomResponse.room.currentSessionId,
            code: roomResponse.room.code,
            teamName: parsed.data.playerName, // Will be updated when session starts
            teamId: "", // Will be set when session starts
            uid: "", // Will be set when session starts
          });
          setAnswerText("");

          // Reset hasManuallyLeft flag when user successfully joins
          setHasManuallyLeft(false);
          
          toast({
            title: "Joined room with active session!",
            variant: "success",
          });
          return;
        }
        
        throw new Error("Failed to join room");
      } catch (error) {
        console.error("Join session error:", error);
        const errorMessage = error instanceof Error ? error.message : "Failed to join session";
        const normalizedError = errorMessage.toLowerCase();

        if (normalizedError.includes("no active session") || normalizedError.includes("waiting for host approval")) {
          const roomResponse = await roomService.getRoom({ code: parsed.data.code }).catch(() => null);
          if (roomResponse?.room) {
            try {
              await roomMembershipService.joinRoom({
                code: parsed.data.code,
                playerName: parsed.data.playerName,
              });

              setTeamRoom({
                roomId: roomResponse.room.id,
                roomCode: roomResponse.room.code,
                playerName: parsed.data.playerName,
                // No membershipId needed - we use UUID-based user identification
              });
            } catch (joinErr) {
              // If we're already in the room, just set the room info
              setTeamRoom({
                roomId: roomResponse.room.id,
                roomCode: roomResponse.room.code,
                playerName: parsed.data.playerName,
              });
            }
            setSessionId(null);
            setJoinErrors({});
            toast({
              title: "You're in the room lobby. Waiting for the host to start.",
              variant: "info",
            });
            return;
          }
        }

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
      setTeamRoom,
      user,
    ]
  );

  const handleSubmitAnswer = useCallback(async () => {
    if (!session || !sessionId) return;

    const parsed = answerSchema.safeParse(answerText);
    if (!parsed.success) {
      toast({
        title: parsed.error.issues[0]?.message ?? "Invalid answer",
        variant: "error",
      });
      return;
    }

    // Trigger haptic feedback when submitting answer
    if ('vibrate' in navigator) {
      try {
        navigator.vibrate(50); // Short vibration for button click
      } catch (error) {
        // Vibration not supported or permission denied - silently fail
      }
    }

    setIsSubmittingAnswer(true);
    
    try {
      const response = await submitAnswer({
        sessionId: session.id,
        text: parsed.data,
      });
      
      toast({
        title: response?.isUpdate ? "Answer updated!" : "Answer locked in!",
        variant: "success",
      });
    } catch (error: any) {
      console.error('Submit answer error:', error);
      
      // Try to extract the error code from the response
      let errorMessage = "Something went wrong — try again in a moment";
      
      // Check for error code in the response context (Supabase includes this in the error)
      console.log('Full error context for debugging:', error?.context);
      let errorCode;
      
      // The context is a Response object, we need to read its JSON body
      if (error?.context instanceof Response) {
        try {
          const errorData = await error.context.json();
          errorCode = errorData?.code;
          console.log('Error data from response:', errorData);
        } catch (e) {
          console.log('Could not parse error response:', e);
        }
      }
      
      console.log('Extracted error code:', errorCode);
      
      if (errorCode === 'LOW_EFFORT') {
        errorMessage = "Put a little more effort into it 😄";
      } else if (errorCode === 'BLOCKED_CONTENT') {
        errorMessage = "That one won't work — try something funny without crossing the line.";
      } else if (errorCode === 'OPENAI_VIOLATION') {
        errorMessage = "The AI content police flagged that one — try again!";
      } else if (error?.name === 'FunctionsHttpError' && error?.context?.status === 400) {
        // Fallback for 400 errors when we can't read the specific code
        errorMessage = "That one won't work — try something funny without crossing the line.";
      } else if (error instanceof Error) {
        // Check for direct error messages (fallback)
        if (error.message === 'LOW_EFFORT') {
          errorMessage = "Put a little more effort into it 😄";
        } else if (error.message === 'BLOCKED_CONTENT') {
          errorMessage = "That one won't work — try something funny without crossing the line.";
        } else if (error.message === 'OPENAI_VIOLATION') {
          errorMessage = "The AI content police flagged that one — try again!";
        }
      }
      
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

      // Trigger haptic feedback when voting
      if ('vibrate' in navigator) {
        try {
          navigator.vibrate(50); // Short vibration for button click
        } catch (error) {
          // Vibration not supported or permission denied - silently fail
        }
      }

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

  return {
    handleJoin,
    handleSubmitAnswer,
    handleVote,
  };
}
