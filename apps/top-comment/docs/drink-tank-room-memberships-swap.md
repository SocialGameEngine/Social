# DrinkTank Room Memberships Swap

## Overview
Update DrinkTank component to work with room memberships instead of teams for the new room lobby.

## Current State
- DrinkTank expects `teams: Team[]` array
- Teams come from `top_comment_players` table (session-based)
- Used in old session lobby

## Target State  
- DrinkTank should work with `roomMemberships: RoomMembership[]` array
- Room memberships come from `room_memberships` table (room-based)
- Used in new room lobby

## Data Structure Comparison

### Team (from top_comment_players)
```typescript
interface Team {
  id: string;
  teamName: string;
  mascotId?: number;
  joinedAt: string;
  score: number;
  // ... other session-specific fields
}
```

### RoomMembership (from room_memberships)
```typescript
interface RoomMembership {
  id: string;
  roomId: string;
  userId: string;
  playerName: string;
  mascotId?: number;
  joinedAt: string;
  lastActiveAt: string;
  isHost: boolean;
  // ... other room-specific fields
}
```

## Mapping Fields
| Team Field | RoomMembership Field | Notes |
|------------|---------------------|-------|
| `id` | `id` | ✅ Same |
| `teamName` | `playerName` | ✅ Direct mapping |
| `mascotId` | `mascotId` | ✅ Same |
| `joinedAt` | `joinedAt` | ✅ Same |
| `score` | N/A | Not needed for lobby display |

## Implementation Plan

### 1. Update DrinkTank Interface
```typescript
interface DrinkTankProps {
  roomMemberships?: RoomMembership[];
  teams?: Team[]; // Keep for backward compatibility
  className?: string;
}
```

### 2. Add Helper Function
```typescript
// Convert room membership to team format for DrinkTank logic
function roomMembershipToTeam(membership: RoomMembership): Team {
  return {
    id: membership.id,
    teamName: membership.playerName,
    mascotId: membership.mascotId,
    joinedAt: membership.joinedAt,
    score: 0, // Not used in lobby display
    // ... other required fields with defaults
  };
}
```

### 3. Update DrinkTank Logic
```typescript
export function DrinkTank({ roomMemberships, teams, className = "" }: DrinkTankProps) {
  // Use roomMemberships if provided, fallback to teams for backward compatibility
  const displayData = roomMemberships ? 
    roomMemberships.map(roomMembershipToTeam) : 
    teams || [];
    
  const sortedByJoin = [...displayData].sort(
    (a, b) => new Date(a.joinedAt).getTime() - new Date(b.joinedAt).getTime()
  );
  
  // ... rest of component logic remains the same
}
```

### 4. Update Usage in LobbyPhase
```typescript
// In LobbyPhase.tsx
<DrinkTank roomMemberships={room?.roomMemberships || []} />
```

## Benefits
- ✅ Shows mascots for room members in lobby
- ✅ Maintains backward compatibility with existing team usage
- ✅ Uses room-based data instead of session-based
- ✅ Works with new room lobby architecture

## Files to Change
1. `src/components/DrinkTank.tsx` - Main component update
2. `src/features/team/Phases/LobbyPhase.tsx` - Update usage

## Testing
- Verify mascots show in room lobby
- Verify backward compatibility with session lobby
- Verify proper ordering by join time
- Verify mascot images display correctly
