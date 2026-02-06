import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { BackgroundAnimation } from "../../components/BackgroundAnimation";
import { JoinForm } from "../team/Phases";
import { useToast } from "../../shared/hooks";
import { roomService } from "../../services/roomService";
import { roomMembershipService } from "../../services/roomMembershipService";
import { useAuth } from "../../shared/providers/AuthContext";

interface JoinFormState {
  code: string;
  playerName: string;
}

export function JoinPage() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // SIMPLIFIED: Only manage form state, no complex team state
  const [joinForm, setJoinForm] = useState<JoinFormState>({
    code: "",
    playerName: ""
  });
  const [joinErrors, setJoinErrors] = useState<Record<string, string>>({});
  const [isJoining, setIsJoining] = useState(false);

  // SIMPLIFIED: Direct join handler without team state management
  const handleJoin = useCallback(async (values: JoinFormState) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to join a room",
        variant: "error",
      });
      return;
    }

    setIsJoining(true);
    setJoinErrors({});

    try {
      // Validate input
      const normalizedCode = values.code.trim().toUpperCase();
      const normalizedName = values.playerName.trim();
      
      if (!normalizedCode) {
        setJoinErrors({ code: "Room code is required" });
        return;
      }
      
      if (!/^[A-Z0-9]{6}$/.test(normalizedCode)) {
        setJoinErrors({ code: "Room code must be 6 alphanumeric characters" });
        return;
      }
      
      if (!normalizedName) {
        setJoinErrors({ playerName: "Player name is required" });
        return;
      }

      // Verify room exists first
      console.log('🔍 Verifying room exists:', normalizedCode);
      const roomResponse = await roomService.getRoom({ code: normalizedCode });
      
      if (!roomResponse.room) {
        setJoinErrors({ code: "Room not found" });
        return;
      }

      // Join the room
      console.log('🚀 Joining room:', { roomCode: normalizedCode, playerName: normalizedName });
      const membershipResponse = await roomMembershipService.joinRoom({
        code: normalizedCode,
        playerName: normalizedName
      });

      if (!membershipResponse.membership) {
        throw new Error("Failed to join room");
      }

      console.log('✅ Successfully joined room:', membershipResponse.membership);
      
      // Navigate to room directly - no state management needed
      navigate(`/room/${normalizedCode}`);
      
      toast({
        title: "Room Joined!",
        description: `Successfully joined room ${normalizedCode}`,
        variant: "success",
      });

    } catch (error) {
      console.error('❌ Failed to join room:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to join room';
      
      setJoinErrors({ 
        code: errorMessage.includes("not found") ? errorMessage : "",
        playerName: errorMessage.includes("name") ? errorMessage : ""
      });
      
      toast({
        title: "Join Failed",
        description: errorMessage,
        variant: "error",
      });
    } finally {
      setIsJoining(false);
    }
  }, [user, toast, navigate]);

  // Wrapper for form submission
  const handleSubmit = useCallback((event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const values = {
      code: String(formData.get("code") ?? ""),
      playerName: String(formData.get("playerName") ?? ""),
    };
    void handleJoin(values);
  }, [handleJoin]);

  // Simplified styling
  const mainClassName = "relative z-10 flex min-h-screen items-center justify-center px-3 py-10 sm:px-4 pb-10";
  const contentWrapperClassName = "chaos-stack mx-auto flex w-[92vw] max-w-[440px] flex-col gap-4 sm:w-full sm:max-w-[520px] sm:gap-6";

  return (
    <>
      <BackgroundAnimation show={true} />
      <style>{`
        body {
          background: transparent !important;
        }
      `}</style>
      <div className={mainClassName}>
        <div className={contentWrapperClassName}>
          <div className="p-4"></div>
          <JoinForm
            joinForm={joinForm}
            joinErrors={joinErrors}
            isJoining={isJoining}
            handleJoin={handleSubmit}
            setJoinForm={setJoinForm}
          />
        </div>
      </div>
    </>
  );
}
