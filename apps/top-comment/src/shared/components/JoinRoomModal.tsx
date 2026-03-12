import { useState, useCallback } from "react";
import { Button, FormField } from "@social/ui";
import { useTheme } from "../providers/ThemeProvider";

interface JoinRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomCode: string;
  onJoin: (displayName: string) => Promise<void>;
}

export function JoinRoomModal({ isOpen, onClose, roomCode, onJoin }: JoinRoomModalProps) {
  const { isDark } = useTheme();
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!displayName.trim()) {
      setError("Display name is required");
      return;
    }

    if (displayName.trim().length < 2) {
      setError("Display name must be at least 2 characters");
      return;
    }

    if (displayName.trim().length > 15) {
      setError("Display name must be 15 characters or less");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await onJoin(displayName.trim());
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to join room");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = useCallback(() => {
    setDisplayName("");
    setError("");
    onClose();
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-md bg-slate-800 rounded-2xl border border-cyan-400/50 shadow-2xl shadow-fuchsia-500/20 max-h-[90vh] overflow-y-auto">
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors z-10"
          aria-label="Close"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="p-6">
          <header className="mb-6 text-center">
            <h2 className="text-2xl font-bold text-pink-400 mb-2">Join Room</h2>
            <p className="text-sm text-slate-400">Room: {roomCode}</p>
          </header>

          <form onSubmit={handleSubmit} className="space-y-4">
            <FormField
              label="Your Display Name"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Enter your name"
              required
              isDark={isDark}
              error={error}
              maxLength={15}
            />

            <div className="text-xs text-slate-400">
              <p>• This name will be shown to other players</p>
              <p>• You can participate in all room activities</p>
              <p>• Leave anytime using the "Leave Room" button</p>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Joining..." : "Join Room"}
            </Button>
          </form>

          <div className="mt-4 pt-4 border-t border-slate-700">
            <button
              onClick={handleClose}
              className="w-full text-sm text-slate-400 hover:text-slate-300 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
