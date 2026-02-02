import { useEffect, useRef } from "react";
import { useTheme } from "../../../shared/providers/ThemeProvider";
import { DrinkTank } from "../../../components/DrinkTank";
import { TeamMembersCard } from "../components/TeamMembersCard";
import { useTeamSession } from "../useTeamSession";
import { useAuth } from "../../../shared/providers/AuthContext";
import type { Team } from "../../../shared/types";


interface LobbyPhaseProps {
  teams: Team[];
}

export function LobbyPhase({ teams }: LobbyPhaseProps) {
  useTheme();
  const { teamSession } = useTeamSession();
  const { user } = useAuth();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  // Background music for lobby phase
  useEffect(() => {
    // Create audio element if it doesn't exist
    if (!audioRef.current) {
      // Load sound from the sounds folder
      audioRef.current = new Audio('/sounds/Lobby Swing.mp3');
      audioRef.current.loop = true; // Loop the music
      audioRef.current.volume = 0.5; // Set volume (0.0 to 1.0)
    }

    const audio = audioRef.current;
    
    // Play music when component mounts
    audio.play().catch((error) => {
      console.error('Error playing lobby music:', error);
      // Some browsers require user interaction before playing audio
    });

    // Cleanup: pause and reset when component unmounts
    return () => {
      audio.pause();
      audio.currentTime = 0;
    };
  }, []); // Empty dependency array means this runs once on mount
  
  // Find the current user's team
  const currentTeam = teams.find(team => {
    // Primary check: teamId from session
    if (teamSession?.teamId && team.id === teamSession.teamId) {
      return true;
    }
    // Fallback: check if team has members and user is in them
    if (team.team_members && team.team_members.length > 0) {
      // For authenticated users, check user_id match
      if (user?.id) {
        return team.team_members.some(member => member.user_id === user.id);
      }
      // For anonymous users, we can't reliably identify them by user_id (all NULL)
      // So we'll rely on the teamId from session primarily
    }
    return false;
  });
  
  // Calculate captain count first
  const captainCount = currentTeam?.team_members?.filter(m => m.is_captain).length || 0;
  
  // Always log for debugging team members issue
  console.log("LobbyPhase debug:", {
    teams: teams.length,
    teamId: teamSession?.teamId,
    userId: user?.id,
    currentTeam: currentTeam?.teamName,
    hasMembers: currentTeam?.team_members?.length || 0,
    captainCount,
    allTeamsMembers: teams.map(t => ({ id: t.id, name: t.teamName, memberCount: t.team_members?.length || 0 }))
  });
  
  // Only log when there are captain status issues
  if (captainCount !== 1) {
    console.log("Captain issue detected - see above for team data");
  }
  
  return (
    <>
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
        <p className="text-sm text-cyan-300">
          Waiting for host to start the game.
        </p>
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

      {/* Team members card */}
      {currentTeam && currentTeam.team_members && Array.isArray(currentTeam.team_members) && currentTeam.team_members.length > 0 ? (
        <TeamMembersCard 
          key={`${currentTeam.id}-${currentTeam.team_members.length}-${currentTeam.team_members.map(m => m.id).join(',')}`}
          teamMembers={currentTeam.team_members as any[]}
          teamName={currentTeam.teamName}
        />
      ) : null}

      {/* Floating mascot drink tank */}
      <DrinkTank teams={teams} className="mt-6" />
    </>
  );
}

