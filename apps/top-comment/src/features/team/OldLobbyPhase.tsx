import { useEffect, useRef } from "react";
import { useTheme } from "../../shared/providers/ThemeProvider";
import { DrinkTank } from "../../components/DrinkTank";
import type { Team } from "../../shared/types";


interface LobbyPhaseProps {
  teams: Team[];
}

export function LobbyPhase({ teams }: LobbyPhaseProps) {
  useTheme();
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

      {/* Floating mascot drink tank */}
      <DrinkTank teams={teams} className="mt-6" />
    </>
  );
}

