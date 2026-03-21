import { useEffect, useState } from 'react';
import { useAuth } from '../../shared/providers/AuthContext';
import { supabase } from '../../supabase/client';
import { CreateRoomModal } from '../host/components/CreateRoomModal';
import { useSearchParams } from 'react-router-dom';

interface VenueRoomCheckerProps {
  onRoomCreated?: (roomId: string) => void;
}

export function VenueRoomChecker({ onRoomCreated }: VenueRoomCheckerProps) {
  const { user, venueAccount, venueAccountLoading } = useAuth();
  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const [checking, setChecking] = useState(true);
  const [hasChecked, setHasChecked] = useState(false);
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const checkVenueRoom = async () => {
      if (hasChecked) return; // Prevent multiple checks

      console.log('🔍 VenueRoomChecker: Starting check...');
      console.log('🔍 User:', user?.id);
      console.log('🔍 Venue Account:', venueAccount ? 'loaded' : 'not loaded');
      console.log('🔍 Venue Account Loading:', venueAccountLoading);
      
      // Wait for both user and venue account to be loaded
      // AuthProvider handles timeout and will sign out if venue account fails to load
      if (!user || venueAccountLoading) {
        console.log('🔍 User or venue account not loaded, waiting...');
        return; // Just return, will retry when context updates
      }

      try {
        // Check URL parameter first
        const forceCreateRoom = searchParams.get('createRoom') === 'true';
        
        // Check if venue needs a room created
        const { data: needsRoom, error } = await (supabase as any).rpc('check_venue_needs_room', {
          p_user_id: user.id
        });

        console.log('🔍 Function result:', { needsRoom, error });

        if (error) {
          console.error('🔍 Function error:', error);
          return;
        }

        // Show create room modal only if venue actually needs a room
        // URL parameter is just for forcing the check, not forcing the modal
        if (needsRoom) {
          console.log('🔍 Showing create room modal - venue needs room');
          setShowCreateRoom(true);
        } else {
          console.log('🔍 No room needed, modal not shown');
        }
      } catch (error) {
        console.error('🔍 Error checking venue room:', error);
      } finally {
        setChecking(false);
        setHasChecked(true);
      }
    };

    checkVenueRoom();
  }, [user, searchParams, hasChecked]);

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
