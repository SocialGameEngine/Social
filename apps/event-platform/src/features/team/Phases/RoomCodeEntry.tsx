import { useState } from "react";
import { Button, Card } from "@social/ui";
import { useTheme } from "../../../shared/providers/ThemeProvider";
import { supabase } from "../../../supabase/client";
import { BackgroundAnimation } from "../../../components/BackgroundAnimation";

interface RoomCodeEntryProps {
  onSuccess: (sessionId: string, sessionCode: string) => void;
  toast: (options: { title: string; description?: string; variant: "success" | "error" }) => void;
}

export function RoomCodeEntry({ onSuccess }: RoomCodeEntryProps) {
  const { isDark } = useTheme();
  const [roomCode, setRoomCode] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const code = roomCode.trim().toUpperCase();
    
    if (code.length !== 6) {
      setError("Room code must be 6 characters");
      return;
    }

    setIsValidating(true);
    setError("");

    try {
      // Validate session exists and is joinable
      const { data: session, error: sessionError } = await supabase
        .from("sessions")
        .select("id, code, status")
        .eq("code", code)
        .single();

      if (sessionError || !session) {
        setError("Room not found. Check the code and try again.");
        return;
      }

      // Allow joining at any time except when session has ended
      if (session.status === "ended") {
        setError("This room has ended and is no longer accepting players.");
        return;
      }

      // Success - navigate to team selection
      onSuccess(session.id, session.code);
    } catch (err) {
      console.error("Room code validation error:", err);
      setError("Failed to join room. Please try again.");
    } finally {
      setIsValidating(false);
    }
  };

  const showBackground = true;
  return (
    <>
      <BackgroundAnimation show={showBackground} />
      {showBackground && (
        <style>{`
          body {
            background: transparent !important;
          }
        `}</style>
      )}
      <div className="relative min-h-screen flex items-center justify-center p-4">
        <div className="relative z-10 w-full max-w-md">
          <Card className="w-full" isDark={isDark}>
        <div className="space-y-6">
          <div className="text-center">
            <h1 className={`text-3xl font-black mb-2 ${isDark ? 'text-pink-400' : 'text-pink-600'}`}>
              Join Game
            </h1>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                Room Code
              </label>
              <input
                type="text"
                value={roomCode}
                onChange={(e) => {
                  setRoomCode(e.target.value.toUpperCase());
                  setError("");
                }}
                placeholder="ABC123"
                maxLength={6}
                className={`w-full px-4 py-3 text-center text-2xl font-mono font-bold rounded-lg border-2 ${
                  error
                    ? 'border-red-500 bg-red-50'
                    : isDark
                    ? 'border-cyan-500 bg-slate-800 text-white'
                    : 'border-blue-500 bg-white text-slate-900'
                } focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                  isDark ? 'focus:ring-cyan-400' : 'focus:ring-blue-400'
                }`}
                autoFocus
              />
              {error && (
                <p className="mt-2 text-sm text-red-500">{error}</p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={roomCode.length !== 6 || isValidating}
              isLoading={isValidating}
            >
              {isValidating ? "Joining..." : "Continue"}
            </Button>
          </form>

          <div className={`text-center text-xs ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
            <p>Don't have a room code?</p>
            <p>Ask your host to share the 6-digit code from their screen.</p>
          </div>
        </div>
      </Card>
        </div>
      </div>
    </>
  );
}
