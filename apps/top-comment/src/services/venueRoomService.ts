import { supabase } from '../supabase/client';
import type { Room } from '../shared/types';
import { generateUniqueRoomCode } from './roomService';

/**
 * Gets or creates a room for a venue account
 * Ensures each venue has exactly one room
 */
export async function getOrCreateVenueRoom(authUserId: string): Promise<Room> {
  try {
    // First, try to find existing room for this venue
    // Note: This will need to be updated when we add room_id to venue_accounts table
    const { data: existingRooms, error: fetchError } = await supabase
      .from('rooms' as any)
      .select('*')
      .eq('host_uid', authUserId)
      .limit(1);

    if (fetchError) {
      console.error('Error fetching venue room:', fetchError);
      throw new Error('Failed to fetch venue room');
    }

    // If venue already has a room, return it
    if (existingRooms && existingRooms.length > 0 && existingRooms[0]) {
      return existingRooms[0] as unknown as Room;
    }

    // Create new room for venue
    const roomCode = await generateUniqueRoomCode();
    
    const roomData = {
      code: roomCode,
      host_uid: authUserId, // Use auth_user_id instead of venue_account_id
      name: 'Venue Room',
      description: 'Default room for venue',
      max_players: 50,
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
      .from('rooms' as any)
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
      .from('rooms' as any)
      .select('*')
      .eq('host_uid', authUserId)
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
