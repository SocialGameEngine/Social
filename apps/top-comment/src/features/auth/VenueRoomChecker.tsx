import { useEffect, useState } from 'react';
import { useAuth } from '../../shared/providers/AuthContext';
import { useVenueAccountResolver } from '../host/useVenueAccountResolver';
import { supabase } from '../../supabase/client';
import { CreateRoomModal } from '../host/components/CreateRoomModal';
import { useSearchParams } from 'react-router-dom';

interface VenueRoomCheckerProps {
  onRoomCreated?: (roomId: string) => void;
}

export function VenueRoomChecker({ onRoomCreated }: VenueRoomCheckerProps) {
  const { user } = useAuth();
  const { venueAccount, loading: venueAccountLoading } = useVenueAccountResolver();
  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const [checking, setChecking] = useState(true);
  const [hasChecked, setHasChecked] = useState(false);
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const checkVenueRoom = async () => {
      if (hasChecked) return; // Prevent multiple checks

      // Wait for both user and venue account to be loaded
      // AuthProvider handles timeout and will sign out if venue account fails to load
      if (!user || venueAccountLoading) {
        return; // Just return, will retry when context updates
      }

      try {
        // Check if venue needs a room created
        const { data: needsRoom, error } = await (supabase as any).rpc('check_venue_needs_room', {
          p_user_id: user.id
        });

        if (error) {
          return;
        }

        // Show create room modal only if venue actually needs a room AND user is a venue account
        // URL parameter is just for forcing the check, not forcing the modal
        if (needsRoom && venueAccount?.isActive) {
          setShowCreateRoom(true);
        }
      } catch (error) {
        // Handle error silently
      } finally {
        setChecking(false);
        setHasChecked(true);
      }
    };

    checkVenueRoom();
  }, [user, venueAccount, venueAccountLoading, searchParams, hasChecked]);

  const handleRoomCreated = (room: any) => {
    setShowCreateRoom(false);
    // Navigate using room code instead of room ID
    if (room.code) {
      onRoomCreated?.(room.code);
    } else {
      onRoomCreated?.(room.id);
    }
  };

  if (checking) {
    return null; // Silent loading
  }

  return (
    <CreateRoomModal
      isOpen={showCreateRoom}
      onClose={() => setShowCreateRoom(false)}
      onSuccess={handleRoomCreated}
      updateVenueRoomId={true}
    />
  );
}
