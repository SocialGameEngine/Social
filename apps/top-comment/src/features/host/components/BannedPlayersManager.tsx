import { useState, useEffect } from "react";
import { Button, Card, Modal } from "@social/ui";
import { supabase } from "../../../supabase/client";

interface BannedPlayer {
  id: string;
  room_id: string;
  user_id: string;
  display_name: string | null;
  created_at: string;
}

interface BannedPlayersManagerProps {
  roomId: string | null;
  isOpen: boolean;
  onClose: () => void;
  toast: (options: { title: string; variant: "success" | "error" | "info" }) => void;
}

export function BannedPlayersManager({ 
  roomId,
  isOpen, 
  onClose, 
  toast 
}: BannedPlayersManagerProps) {
  const [bannedPlayers, setBannedPlayers] = useState<BannedPlayer[]>([]);
  const [loading, setLoading] = useState(false);
  const [unbanningPlayerId, setUnbanningPlayerId] = useState<string | null>(null);

  
  useEffect(() => {
    if (isOpen && roomId) {
            fetchBannedPlayers();
    }
  }, [isOpen, roomId]);

  // Real-time subscription for banned players
  useEffect(() => {
    if (!roomId) return;

    
    const channel = supabase
      .channel(`banned_players:${roomId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'top_comment_banned_players' as any,
          filter: `room_id=eq.${roomId}`,
        },
        (payload: any) => {
          console.log('🔔 Banned players change for room:', payload);
          console.log('🔍 Event type:', payload.eventType, 'Payload:', payload);
          fetchBannedPlayers();
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
      supabase.removeChannel(channel);
    };
  }, [roomId]);

  const fetchBannedPlayers = async () => {
    if (!roomId) return;

    setLoading(true);
    try {
      
      const { data, error } = await supabase
        .from("top_comment_banned_players" as any)
        .select("*")
        .eq("room_id", roomId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error('❌ Database error:', error);
        throw error;
      }
      
      // Type assertion to bypass TypeScript issues
      setBannedPlayers((data as any) || []);
    } catch (error) {
      console.error("Error fetching banned players:", error);
      toast({
        title: "Failed to load banned players",
        variant: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUnbanPlayer = async (bannedPlayer: BannedPlayer) => {
    if (!bannedPlayer.room_id || !bannedPlayer.user_id) return;

    setUnbanningPlayerId(bannedPlayer.id);
    try {
      console.log('🔓 Unbanning player:', bannedPlayer.id);
      console.log('🔍 Ban record to delete:', bannedPlayer);
      
      // Now that RLS policy is fixed, use clean delete approach
      console.log('🗑️ Deleting ban record with ID:', bannedPlayer.id);
      
      const { error } = await supabase
        .from('top_comment_banned_players' as any)
        .delete()
        .eq('id', bannedPlayer.id);

      console.log('📊 Delete result:', { error });

      if (error) {
        console.error('❌ Failed to delete ban record:', error);
        throw new Error(`Failed to unban player: ${error.message}`);
      }

      // Verify the record was actually deleted
      const { data: verifyData, error: verifyError } = await supabase
        .from('top_comment_banned_players' as any)
        .select('id')
        .eq('id', bannedPlayer.id)
        .single();

      console.log('🔍 Verification after delete:', { verifyData, verifyError });

      // Remove from local state
      setBannedPlayers(prev => {
        console.log('🗑️ Removing from local state, current count:', prev.length);
        const newBanned = prev.filter(p => p.id !== bannedPlayer.id);
        console.log('✅ After removal, new count:', newBanned.length);
        return newBanned;
      });
      
      console.log('✅ Player unbanned and removed from ban list');
      
      // Force a refresh to ensure database state is reflected
      setTimeout(() => {
                fetchBannedPlayers();
      }, 500);
      
      toast({
        title: `${bannedPlayer.display_name || 'Player'} has been unbanned`,
        variant: "success",
      });
    } catch (error) {
      console.error("Error unbanning player:", error);
      toast({
        title: "Failed to unban player",
        variant: "error",
      });
    } finally {
      setUnbanningPlayerId(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <Modal open={isOpen} onClose={onClose} title="Banned Players">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Banned Players</h2>
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <div className="text-gray-500">Loading banned players...</div>
          </div>
        ) : bannedPlayers.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-gray-500">No banned players</div>
          </div>
        ) : (
          <div className="space-y-3">
            {bannedPlayers.map((bannedPlayer) => (
              <Card key={bannedPlayer.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="font-medium">{bannedPlayer.display_name || bannedPlayer.user_id || 'Unknown'}</h3>
                    <p className="text-sm text-gray-500">
                      Banned on {formatDate(bannedPlayer.created_at)}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    onClick={() => handleUnbanPlayer(bannedPlayer)}
                    disabled={unbanningPlayerId === bannedPlayer.id}
                    className="text-green-600 hover:text-green-700"
                  >
                    {unbanningPlayerId === bannedPlayer.id ? "Unbanning..." : "Unban"}
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}

        <div className="pt-4 border-t">
          <p className="text-sm text-gray-600">
            Banned players cannot rejoin the session. Use "Unban" to allow them to rejoin.
          </p>
        </div>
      </div>
    </Modal>
  );
}
