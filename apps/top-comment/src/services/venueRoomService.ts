import { supabase } from '../supabase/client';
import type { Room } from '../shared/types';
import { generateUniqueRoomCode } from './roomService';

/**
 * Gets or creates a room for a venue account
 * Ensures each venue has exactly one room
 */
export async function getOrCreateVenueRoom(authUserId: string): Promise<Room> {
  try {
    // Note: venue_accounts table no longer exists in current schema
    // This is legacy code - venues now use regular rooms
    
    // Try to find existing room for this user
    const { data: existingRooms, error: findError } = await supabase
      .from('rooms')
      .select('*')
      .eq('creator_id', authUserId)
      .limit(1);

    if (!findError && existingRooms && existingRooms.length > 0) {
      return existingRooms[0] as unknown as Room;
    }

    // Legacy venue_accounts check (table doesn't exist anymore)
    // Keeping for backwards compatibility but will always fail gracefully
    if (false) {
      const { data: room, error: roomError } = await supabase
        .from('rooms')
        .select('*')
        .eq('id', 'legacy')
        .single();

      if (roomError) {
        console.error('Error fetching venue room:', roomError);
        throw new Error('Failed to fetch venue room');
      }

      return room as unknown as Room;
    }

    // Create new room for venue
    const roomCode = await generateUniqueRoomCode();
    
    const roomData = {
      code: roomCode,
      host_uid: authUserId,
      name: 'Venue Room',
      description: 'Default room for venue',
      status: 'active',
      settings: {
        maxPlayers: 50,
        allowPlayerChat: true,
        autoStartSession: false,
        defaultSessionSettings: {},
        requireApproval: false,
        allowAnonymous: true,
      },
    };

    const { data: newRoom, error: createError } = await supabase
      .from('rooms')
      .insert(roomData)
      .select()
      .single();

    if (createError) {
      console.error('Error creating venue room:', createError);
      throw new Error('Failed to create venue room');
    }

    return newRoom as unknown as Room;

  } catch (error) {
    console.error('Error in getOrCreateVenueRoom:', error);
    throw error;
  }
}

/**
 * Gets the room for a venue account
 * Returns null if no room exists
 */
export async function getVenueRoom(authUserId: string): Promise<Room | null> {
  try {
    const { data: rooms, error } = await supabase
      .from('rooms')
      .select('*')
      .eq('creator_id', authUserId) // Updated: host_uid -> creator_id
      .limit(1);

    if (error) {
      console.error('Error fetching venue room:', error);
      return null;
    }

    return rooms && rooms.length > 0 ? rooms[0] as unknown as Room : null;

  } catch (error) {
    console.error('Error in getVenueRoom:', error);
    return null;
  }
}
