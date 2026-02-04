import { useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@social/ui";
import { useToast } from "../../../shared/hooks";
import { BackgroundAnimation } from "../../../components/BackgroundAnimation";
import { DrinkTank } from "../../../components/DrinkTank";
import { useRoom } from "../../../hooks/useRoom";
import { roomMembershipService } from "../../../services/roomMembershipService";
import { useAuth } from "../../../shared/providers/AuthContext";
import { usePromptLibraries } from "../../../shared/hooks/usePromptLibraries";
import type { Session } from "../../../shared/types";

interface LobbyPhaseProps {
  roomCode?: string;
  roomId?: string;
  sessionId?: string | null;
  session?: Session | null;
  onLeaveRoom?: () => void;
}

export function LobbyPhase({ 
  roomCode, 
  roomId, 
  sessionId, 
  session,
  onLeaveRoom
}: LobbyPhaseProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  // Get prompt libraries for display
  const { data: promptLibraries } = usePromptLibraries();
  
  // Create library map for easy lookup
  const libraryMap = promptLibraries ? 
    new Map(promptLibraries.map(lib => [lib.id, lib])) : 
    new Map();

  // Room data fetching for room-based approach
  const { memberships, isLoading: roomLoading, error: roomError } = useRoom({ 
    roomId: roomId || undefined,
    roomCode: roomCode || undefined,
    autoRefresh: false  // Disable auto-refresh to prevent flickering
  });

  // Background music (from original LobbyPhase)
  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio('/sounds/Lobby Swing.mp3');
      audioRef.current.loop = true;
      audioRef.current.volume = 0.5;
    }

    const audio = audioRef.current;
    
    audio.play().catch((error) => {
      console.error('Error playing lobby music:', error);
    });

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    };
  }, []);

  // Handle leaving room (from RoomLobbyPhase)
  const handleLeaveRoom = useCallback(async () => {
    if (!roomId) {
      console.log('🔍 No roomId provided, navigating to join');
      onLeaveRoom?.();
      navigate("/join");
      return;
    }

    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to leave room",
        variant: "error",
      });
      return;
    }

    try {
      console.log('🔍 Leaving room:', roomCode);
      await roomMembershipService.leaveRoom({
        roomId,
        userId: user.id, // Use authenticated user ID
      });
      
      toast({
        title: "Room Left",
        description: `You have left room ${roomCode}`,
        variant: "success",
      });
    } catch (error) {
      console.error("Failed to leave room:", error);
      toast({
        title: "Leave Failed",
        description: "Failed to leave room. Please try again.",
        variant: "error",
      });
    }
    
    onLeaveRoom?.();
    navigate("/join");
  }, [roomId, roomCode, user, onLeaveRoom, navigate, toast]);

  
  // Determine lobby state
  const getLobbyState = () => {
    if (roomError) {
      return { state: 'error', message: 'Room not found' };
    }
    
    if (roomLoading) {
      return { state: 'loading', message: 'Loading room...' };
    }
    
    if (roomCode || roomId) {
      return { state: 'room-ready', message: sessionId ? 'Session active' : 'Waiting for host to start...' };
    }
    
    return { state: 'default', message: 'Waiting for room...' };
  };

  const lobbyState = getLobbyState();

  // Render based on lobby state
  const renderContent = () => {
    switch (lobbyState.state) {
      case 'error':
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-white">Room Not Found</h2>
            <p className="text-slate-400">{lobbyState.message}</p>
            <Button onClick={() => navigate("/join")} className="w-full">
              Back to Join
            </Button>
          </div>
        );

      case 'loading':
        return (
          <div className="space-y-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-400 mx-auto"></div>
            <h2 className="text-2xl font-bold text-white">Loading...</h2>
            <p className="text-slate-400">{lobbyState.message}</p>
          </div>
        );

      case 'connecting':
        return (
          <div className="space-y-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-400 mx-auto"></div>
            <h2 className="text-2xl font-bold text-white">Connecting...</h2>
            <p className="text-slate-400">{lobbyState.message}</p>
          </div>
        );

      case 'room-ready':
        return (
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2 text-center">
                <h2 
                  className="text-3xl sm:text-4xl font-black text-pink-400"
                  style={{
                    textShadow: '0 0 5px rgba(244, 114, 182, 0.5), 0 0 10px rgba(244, 114, 182, 0.3)',
                    filter: 'drop-shadow(0 0 4px rgba(244, 114, 182, 0.6))',
                    animation: 'tilt-glow 3s ease-in-out infinite',
                  }}
                >
                  You're in!
                </h2>
                <style>{`
                  @keyframes tilt-glow {
                    0%, 100% {
                      transform: rotate(-2deg);
                      text-shadow: 0 0 5px rgba(244, 114, 182, 0.5), 0 0 10px rgba(244, 114, 182, 0.3);
                    }
                    50% {
                      transform: rotate(2deg);
                      text-shadow: 0 0 6px rgba(244, 114, 182, 0.6), 0 0 12px rgba(244, 114, 182, 0.4);
                    }
                  }
                `}</style>
              </div>
              <div className="space-y-2">
                {sessionId && session ? (
                  <>
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-cyan-400 font-medium" style={{ color: 'rgb(34, 211, 238)' }}>
                        {session.settings?.gameMode === "mashup" ? "🎭 Mashup Mode" : "🎯 Classic Mode"}
                      </span>
                    </div>
                    
                    {session.settings?.gameMode === "mashup" && session.selectedLibraries && session.selectedLibraries.length > 0 && (
                      <div className="grid grid-cols-2 gap-2 justify-center max-w-xs mx-auto mt-2">
                          {session.selectedLibraries.map((libId) => {
                            const library = libraryMap.get(libId);
                            return (
                              <div 
                                key={libId}
                                className="flex flex-col items-center gap-1 p-2 bg-slate-700/50 rounded-lg text-center"
                              >
                                <div className="text-lg">{library?.emoji || '📝'}</div>
                                <div className="text-xs font-medium text-cyan-300 leading-tight" style={{ color: 'rgb(34, 211, 238)' }}>
                                  {library?.name || libId}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                    )}
                    
                    {session.settings?.gameMode === "classic" && session.promptLibraryId && (
                      <div className="flex justify-center mt-2">
                        <div className="flex flex-col items-center gap-1 p-2 bg-slate-700/50 rounded-lg text-center">
                          <div className="text-lg">{libraryMap.get(session.promptLibraryId)?.emoji || '📝'}</div>
                          <div className="text-xs font-medium text-cyan-300 leading-tight" style={{ color: 'rgb(34, 211, 238)' }}>
                            {libraryMap.get(session.promptLibraryId)?.name || session.promptLibraryId}
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-cyan-300">{lobbyState.message}</p>
                )}
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-white">Waiting...</h2>
            <p className="text-slate-400">{lobbyState.message}</p>
            <Button onClick={() => navigate("/join")} className="w-full">
              Back to Join
            </Button>
          </div>
        );
    }
  };

  return (
    <>
      {/* ✕ BAIL button in top-left corner (below navbar) */}
      <div className="fixed left-4 top-20 z-50 max-w-[4.75rem] sm:max-w-none">
        <button
          type="button"
          onClick={handleLeaveRoom}
          className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 transition-colors hover:text-red-400 whitespace-nowrap"
        >
          ✕ BAIL
        </button>
      </div>
      
      <BackgroundAnimation show={true} />
      <style>{`
        body {
          background: transparent !important;
        }
      `}</style>
      <div className="relative z-10 flex min-h-screen items-center justify-center px-3 py-10 sm:px-4 pb-10">
        <div className="space-y-6 text-center">
            {renderContent()}
            
            {/* Show room members with mascots */}
            <DrinkTank roomMemberships={memberships || []} className="mt-6" />
          </div>
      </div>
    </>
  );
}

