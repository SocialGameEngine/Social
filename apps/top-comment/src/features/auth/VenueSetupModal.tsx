import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../shared/providers/AuthContext";
import { Button, FormField } from "@social/ui";
import { supabase } from "../../supabase/client";

interface VenueSetupModalProps {
  open: boolean;
  onClose: () => void;
}

export function VenueSetupModal({ open, onClose }: VenueSetupModalProps) {
  const [roomName, setRoomName] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [maxPlayers, setMaxPlayers] = useState(50);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  // Reset form when modal opens/closes
  useEffect(() => {
    if (!open) {
      setRoomName("");
      setRoomCode("");
      setMaxPlayers(50);
      setNotification(null);
    }
  }, [open]);

  // Auto-dismiss notifications after 3 seconds
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // Generate room code
  const generateRoomCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setRoomCode(code);
  };

  // Generate initial room code on mount
  useEffect(() => {
    if (open) {
      generateRoomCode();
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !roomName.trim() || !roomCode.trim()) {
      setNotification({
        message: "Please fill in all fields",
        type: "error",
      });
      return;
    }

    setLoading(true);

    try {
      // Create the room
      const { data: roomData, error: roomError } = await supabase
        .from('rooms')
        .insert({
          name: roomName.trim(),
          code: roomCode.trim().toUpperCase(),
          host_uid: user.id,
          max_players: maxPlayers,
          status: 'active',
        })
        .select()
        .single();

      if (roomError) {
        throw roomError;
      }

      // Update venue account with the new room_id
      const { error: updateError } = await (supabase as any).rpc('update_venue_room_id', {
        p_user_id: user.id,
        p_room_id: roomData.id
      });

      if (updateError) {
        throw updateError;
      }

      setNotification({
        message: "Venue room created successfully!",
        type: "success",
      });

      // Close modal and navigate to the new room
      setTimeout(() => {
        onClose();
        navigate(`/room/${roomData.id}`);
      }, 1500);

    } catch (error: any) {
      console.error('Error creating venue room:', error);
      setNotification({
        message: error.message || "Failed to create venue room",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-md bg-slate-800 rounded-2xl border border-cyan-400/50 shadow-2xl shadow-cyan-500/20 max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors z-10"
          aria-label="Close"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {notification && (
          <div className="absolute top-4 left-4 right-16 z-20">
            <div
              className={`rounded-lg px-4 py-3 shadow-lg ${
                notification.type === "success"
                  ? "bg-green-500 text-white"
                  : "bg-red-500 text-white"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium text-sm">{notification.message}</span>
                <button
                  onClick={() => setNotification(null)}
                  className="ml-3 text-white hover:text-gray-200"
                >
                  ×
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="p-6">
          <header className="mb-6 text-center">
            <h2 className="text-2xl font-black text-cyan-400 mb-2">
              Create Your Venue Room
            </h2>
            <p className="text-sm text-cyan-300 font-medium">
              Every venue needs a room to host games and events
            </p>
          </header>

          <form onSubmit={handleSubmit} className="space-y-4">
            <FormField
              label="Venue Room Name"
              type="text"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              placeholder="Enter your venue name"
              required
              isDark={true}
            />

            <div>
              <FormField
                label="Room Code"
                type="text"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                placeholder="ROOM123"
                required
                isDark={true}
                maxLength={6}
              />
              <button
                type="button"
                onClick={generateRoomCode}
                className="mt-2 text-xs text-cyan-400 hover:text-cyan-300 underline"
              >
                Generate New Code
              </button>
            </div>

            <FormField
              label="Maximum Players"
              type="number"
              value={maxPlayers.toString()}
              onChange={(e) => setMaxPlayers(parseInt(e.target.value) || 50)}
              placeholder="50"
              min="1"
              max="200"
              required
              isDark={true}
            />

            <Button 
              type="submit" 
              className="w-full bg-cyan-600 hover:bg-cyan-700 text-white" 
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating venue room...
                </span>
              ) : (
                "Create Venue Room"
              )}
            </Button>
          </form>

          <div className="mt-6 text-center text-xs text-slate-400">
            <p>
              Your venue room will be the main space for hosting games and events.
              Players will join using the room code you create.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
