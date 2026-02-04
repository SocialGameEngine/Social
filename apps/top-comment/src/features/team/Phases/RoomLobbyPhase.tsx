import { useEffect, useState } from "react";
import { Card, Button } from "@social/ui";
import { useTheme } from "../../../shared/providers/ThemeProvider";
import { useNavigate } from "react-router-dom";
import { useRoom } from "../../../hooks/useRoom";
import { roomMembershipService } from "../../../services/roomMembershipService";

interface RoomLobbyPhaseProps {
  roomCode: string;
  roomId: string;
  onLeaveRoom: () => void;
}

export function RoomLobbyPhase({ roomCode, roomId, onLeaveRoom }: RoomLobbyPhaseProps) {
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const { myMembership, memberships } = useRoom({ roomId, autoRefresh: true });

  // Track if we've already established membership (fix race condition)
  const [hasEstablishedMembership, setHasEstablishedMembership] = useState(false);

  // Set membership established flag when we first see a membership
  useEffect(() => {
    if (myMembership && !hasEstablishedMembership) {
      console.log('✅ Player membership established:', myMembership.id);
      setHasEstablishedMembership(true);
    }
  }, [myMembership, hasEstablishedMembership]);

  // Detect if player was kicked (membership deleted) or banned (is_banned=true)
  useEffect(() => {
    // Only check for kick if we had membership before and now don't
    if (roomId && hasEstablishedMembership && !myMembership) {
      console.log('🚫 Player was kicked - membership not found, redirecting to join page...');
      // Player was removed from the room
      onLeaveRoom();
      navigate("/join");
    }
  }, [myMembership?.id, hasEstablishedMembership, roomId, onLeaveRoom, navigate]);

  // Detect if player was banned (membership exists but is_banned=true)
  useEffect(() => {
    if (myMembership && myMembership.isBanned) {
      console.log('🚫 Player was banned - membership is_banned=true');
      // Player was banned from the room
      onLeaveRoom();
      navigate("/join");
    }
  }, [myMembership?.isBanned, myMembership?.id, roomId, onLeaveRoom, navigate]);

  const handleLeaveRoom = async () => {
    try {
      // Leave the room in the database
      await roomMembershipService.leaveRoom({
        roomId,
        userId: "", // This will be handled by the service using auth user
      });
    } catch (error) {
      console.error("Failed to leave room:", error);
      // Continue with navigation even if database call fails
    }
    
    // Clear the teamRoom state via callback
    onLeaveRoom();
    
    // Navigate away
    navigate("/join");
  };

  return (
    <Card className="space-y-4 text-center" isDark={isDark}>
      <h2 className="text-2xl font-black text-pink-400">You're in the room lobby</h2>
      <p className={`text-sm ${!isDark ? "text-slate-600" : "text-cyan-300"}`}>
        Waiting for the host to start the session.
      </p>
      <div className="inline-flex flex-col items-center gap-2 rounded-2xl px-6 py-4 border bg-cyan-900/30 border-cyan-400/50">
        <span className="text-xs uppercase tracking-wider text-cyan-300">
          Room code
        </span>
        <span className="text-3xl font-black tracking-widest text-pink-400">
          {roomCode}
        </span>
      </div>
      <Button 
        variant="ghost" 
        onClick={handleLeaveRoom}
        className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
      >
        Leave Room
      </Button>
    </Card>
  );
}
