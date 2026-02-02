import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useToast } from "@social/ui";
import { RoomCodeEntry } from "./Phases/RoomCodeEntry";
import { TeamCodeEntry as TeamCodeForm } from "./Phases/TeamCodeEntry";
import { JoinTeamModal } from "./components/JoinTeamModal";
import { joinSession } from "../session/sessionService";
import { supabase } from "../../supabase/client";
import { useAuth } from "../../shared/providers/AuthContext";

type JoinStep = "room-code" | "team-selection" | "joining";

interface JoinState {
  sessionId: string | null;
  sessionCode: string | null;
  selectedTeamCode: string | null;
  selectedTeamName: string | null;
}

export function JoinFlowOrchestrator() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [searchParams] = useSearchParams();
  const { signInAnonymously, user } = useAuth();
  
  const [step, setStep] = useState<JoinStep>("room-code");
  const [hasCheckedGuestAuth, setHasCheckedGuestAuth] = useState(false);

  // Sign in as guest if not already signed in (for QR code joins)
  useEffect(() => {
    const code = searchParams.get("code");
    if (code && code.length === 6 && !user && !hasCheckedGuestAuth) {
      setHasCheckedGuestAuth(true);
      signInAnonymously().catch((error) => {
        console.error("Failed to sign in as guest:", error);
        // Continue anyway
      });
    }
  }, [searchParams, user, hasCheckedGuestAuth, signInAnonymously]);

  // Check for code in query parameters (from shareable links)
  useEffect(() => {
    const code = searchParams.get("code");
    if (code && code.length === 6) {
      // Auto-validate and proceed to team selection
      handleRoomCodeFromQuery(code);
    }
  }, [searchParams]);

  const handleRoomCodeFromQuery = async (code: string) => {
    try {
      // Use the same validation logic as RoomCodeEntry
      const { data: session, error } = await supabase
        .from("sessions")
        .select("id, code, status")
        .eq("code", code)
        .single();

      if (error || !session) {
        addToast({
          title: "Invalid room code",
          description: "The room code from the link is not valid.",
          variant: "error"
        });
        return;
      }

      // Allow joining at any time except when session has ended
      if (session.status === "ended") {
        addToast({
          title: "Room not available",
          description: "This room has ended and is no longer accepting players.",
          variant: "error"
        });
        return;
      }

      // Success - navigate to team selection
      setState(prev => ({ ...prev, sessionId: session.id, sessionCode: session.code }));
      setStep("team-selection");
    } catch (error) {
      console.error("Room code validation error:", error);
      addToast({
        title: "Failed to validate room",
        description: "Please enter the room code manually.",
        variant: "error"
      });
    }
  };
  const [state, setState] = useState<JoinState>({
    sessionId: null,
    sessionCode: null,
    selectedTeamCode: null,
    selectedTeamName: null,
  });
  const [showTeamNameModal, setShowTeamNameModal] = useState(false);
  const [isJoining, setIsJoining] = useState(false);

  const handleRoomCodeSuccess = (sessionId: string, sessionCode: string) => {
    setState(prev => ({ ...prev, sessionId, sessionCode }));
    setStep("team-selection");
  };

  const handleTeamSelect = (teamCode: string, teamName: string | null) => {
    setState(prev => ({ ...prev, selectedTeamCode: teamCode, selectedTeamName: teamName }));
    
    // Always show the join modal for player name input
    setShowTeamNameModal(true);
  };

  const handleTeamNameSubmit = (playerName: string, teamName?: string) => {
    setShowTeamNameModal(false);
    if (state.selectedTeamCode) {
      handleJoinTeam(state.selectedTeamCode, teamName || state.selectedTeamName || '', playerName);
    }
  };

  const handleJoinTeam = async (teamCode: string, teamName: string, playerName: string) => {
    setIsJoining(true);
    setStep("joining");

    try {
      console.log("Joining team:", { teamCode, teamName });
      
      // Join using the team code (4 digits)
      const result = await joinSession({ code: teamCode, teamName, playerName });
      
      console.log("Join result:", result);

      // Store session and team info in the correct format for useTeamSession
      if (result.sessionId && result.team?.id) {
        // Get the current user's ID from Supabase auth
        const { data: { user } } = await supabase.auth.getUser();
        
        const teamSession = {
          sessionId: result.sessionId,
          teamId: result.team.id,
          teamName: teamName,
          code: state.sessionCode || '',
          uid: user?.id || result.team.uid, // Use current user's ID, fallback to team captain ID
          playerName: playerName // Store player name separately
        };
        localStorage.setItem("sidebets_team_session", JSON.stringify(teamSession));
      }

      addToast({
        title: result.team?.isCaptain ? "Team created!" : "Joined team!",
        description: result.team?.isCaptain 
          ? `You're the captain of ${teamName}`
          : `Welcome to ${teamName}`,
        variant: "success"
      });

      // Navigate to team page
      navigate("/team");
    } catch (error: any) {
      console.error("Join error:", error);
      
      setIsJoining(false);
      setStep("team-selection");
      
      addToast({
        title: "Failed to join team",
        description: error.message || "Please try again",
        variant: "error"
      });
    }
  };

  const handleBack = () => {
    if (step === "team-selection") {
      setState({
        sessionId: null,
        sessionCode: null,
        selectedTeamCode: null,
        selectedTeamName: null,
      });
      setStep("room-code");
    }
  };

  if (isJoining) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-slate-950">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-cyan-400 mx-auto mb-4"></div>
          <p className="text-xl font-semibold text-white mb-2">Joining team...</p>
          <p className="text-slate-400">
            {state.selectedTeamName ? `Joining ${state.selectedTeamName}` : "Creating your team"}
          </p>
        </div>
      </div>
    );
  }

  if (step === "room-code") {
    return <RoomCodeEntry onSuccess={handleRoomCodeSuccess} toast={addToast} />;
  }

  if (step === "team-selection" && state.sessionId && state.sessionCode) {
    return (
      <>
        <TeamCodeForm
          sessionId={state.sessionId}
          sessionCode={state.sessionCode}
          onTeamSelect={handleTeamSelect}
          onBack={handleBack}
          toast={addToast}
        />
        {showTeamNameModal && (
          <JoinTeamModal
            isOpen={showTeamNameModal}
            teamCode={state.selectedTeamCode || ''}
            isCreatingTeam={!state.selectedTeamName}
            existingTeamName={state.selectedTeamName || undefined}
            onSubmit={handleTeamNameSubmit}
            onCancel={() => setShowTeamNameModal(false)}
          />
        )}
      </>
    );
  }

  return null;
}
