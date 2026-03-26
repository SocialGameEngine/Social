// Helper functions for moderator system

/**
 * Check if a user is a moderator of a room
 * @param room - The room object containing moderatorIds
 * @param userId - The user ID to check
 * @returns true if the user is a moderator, false otherwise
 */
export function isUserModerator(room: { moderatorIds?: string[] } | null | undefined, userId: string): boolean {
  if (!room || !userId) return false;
  
  // Handle case where moderatorIds is not yet available (fallback to legacy host_uid)
  if (!room.moderatorIds) {
    // Fallback: check if user is the host (temporary during migration)
    return 'hostUid' in room && (room as any).hostUid === userId;
  }
  
  return room.moderatorIds.includes(userId);
}

/**
 * Check if the current user is a moderator
 * @param room - The room object containing moderatorIds
 * @param currentUser - The current user object
 * @returns true if the current user is a moderator, false otherwise
 */
export function isCurrentUserModerator(room: { moderatorIds?: string[] } | null | undefined, currentUser: { id: string } | null): boolean {
  if (!currentUser) return false;
  return isUserModerator(room, currentUser.id);
}

/**
 * Add a moderator to a room
 * @param room - The room object
 * @param userId - The user ID to add as moderator
 * @returns updated room object with new moderator list
 */
export function addModerator(room: { moderatorIds?: string[] }, userId: string): { moderatorIds: string[] } {
  const currentModeratorIds = room.moderatorIds || [];
  
  if (currentModeratorIds.includes(userId)) {
    return { moderatorIds: currentModeratorIds }; // User is already a moderator
  }
  
  return {
    moderatorIds: [...currentModeratorIds, userId]
  };
}

/**
 * Remove a moderator from a room
 * @param room - The room object
 * @param userId - The user ID to remove from moderators
 * @returns updated room object with moderator list
 */
export function removeModerator(room: { moderatorIds?: string[] }, userId: string): { moderatorIds: string[] } {
  const currentModeratorIds = room.moderatorIds || [];
  
  return {
    moderatorIds: currentModeratorIds.filter(id => id !== userId)
  };
}
