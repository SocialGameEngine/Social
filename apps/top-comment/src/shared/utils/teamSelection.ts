import type { RoomMembership } from "../types";

/**
 * Select a random membership from a list
 * @returns Random membership or null if list is empty
 */
export function selectRandomMembership(memberships: RoomMembership[]): RoomMembership | null {
  if (memberships.length === 0) return null;
  const randomIndex = Math.floor(Math.random() * memberships.length);
  return memberships[randomIndex];
}

/**
 * Select one random membership per group for category selection
 * @param groups - Array of groups with membershipIds
 * @param allMemberships - All memberships in the session
 * @returns Map of groupId to selected membershipId
 */
export function selectMembershipsForGroups(
  groups: { id: string; membershipIds: string[] }[],
  allMemberships: RoomMembership[]
): Map<string, string> {
  const selections = new Map<string, string>();
  
  groups.forEach(group => {
    const groupMemberships = allMemberships.filter(m => group.membershipIds.includes(m.id));
    const selectedMembership = selectRandomMembership(groupMemberships);
    if (selectedMembership) {
      selections.set(group.id, selectedMembership.id);
    }
  });
  
  return selections;
}

/**
 * Check if a membership is the selecting membership for their group
 */
export function isSelectingMembership(
  membershipId: string,
  groupSelectingMembershipId: string | undefined
): boolean {
  return groupSelectingMembershipId === membershipId;
}
