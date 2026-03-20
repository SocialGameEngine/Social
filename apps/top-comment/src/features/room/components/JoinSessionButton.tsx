import { useState } from 'react';
import { joinRoomSession } from '../../session/sessionService';
import { Button } from '../../../components/Button';
import { useAuth } from '../../../shared/providers/AuthContext';
import { useToast } from '../../../shared/hooks/useToast';

interface JoinSessionButtonProps {
  sessionId: string;
  roomId: string;
  onJoined?: () => void;
}

export function JoinSessionButton({ sessionId, roomId, onJoined }: JoinSessionButtonProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isJoining, setIsJoining] = useState(false);

  const handleJoinSession = async () => {
    if (!user) {
      toast({ title: "Please sign in to join the session", variant: "error" });
      return;
    }

    setIsJoining(true);

    try {
      const result = await joinRoomSession({
        sessionId,
        roomId,
        playerName: user.user_metadata?.display_name || user.email?.split('@')[0] || 'Player'
      });

      if (result.success) {
        toast({ 
          title: "Joined session!", 
          variant: "success",
          description: "You're now ready to play"
        });
        onJoined?.();
      } else {
        toast({ 
          title: "Failed to join session", 
          variant: "error",
          description: result.message
        });
      }
    } catch (error) {
      console.error('Error joining session:', error);
      toast({ 
        title: "Failed to join session", 
        variant: "error",
        description: error instanceof Error ? error.message : "Unknown error"
      });
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <Button
      onClick={handleJoinSession}
      isLoading={isJoining}
      disabled={!user}
      className="chaos-cta-pill chaos-cta-pill--fresh"
    >
      Join Game
    </Button>
  );
}
