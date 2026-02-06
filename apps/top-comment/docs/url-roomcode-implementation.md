# URL RoomCode Approach Implementation Document

## 🎯 Overview
Transition from state-based room navigation to URL-based room navigation using `/room/:roomCode` route pattern.

## 🏗️ Architecture Changes

### Current Architecture
```
/join → Join succeeds → Set teamRoom state → Navigate to /team → TeamPage reads teamRoom state
```

### Target Architecture
```
/join → Join succeeds → Navigate to /room/ROOMCODE → TeamPage parses URL → Fetch room data → Display
```

## 📋 Implementation Steps

### Phase 1: Routing Updates (30 minutes)

#### Prerequisites
- ✅ Ensure `react-router-dom` is installed (version 6+)
- ✅ Verify TeamPage component exists and is functional
- ✅ Confirm JoinPage navigation logic is working
- ✅ Test current `/team` route functionality

#### 1. Update Router Configuration

**File:** `src/app/router.tsx`

**Current Route Structure:**
```typescript
// EXISTING routes (keep these unchanged)
{ path: "join", element: <JoinPage /> },
{ path: "play", element: <TeamPage /> },
{ path: "team", element: <TeamPage /> },
```

**Add New Room Route:**
```typescript
// src/app/router.tsx
export const appRouter = createBrowserRouter([
  {
    path: "/",
    element: (
      <AppProviders>
        <RootLayout />
      </AppProviders>
    ),
    children: [
      { index: true, element: <EntryPage /> },
      { path: "auth", element: <PlayerAuthPage /> },
      { path: "venue-auth", element: <VenueAuthPage /> },
      { path: "host", element: <HostPage /> },
      { path: "join", element: <JoinPage /> },
      
      // NEW: URL-based room route
      { 
        path: "room/:roomCode", 
        element: <TeamPage />,
        // Add validation for roomCode format (optional but recommended)
        loader: ({ params }) => {
          const roomCode = params.roomCode;
          // Basic validation: 6 characters, alphanumeric
          if (!roomCode || !/^[A-Z0-9]{6}$/i.test(roomCode)) {
            throw new Response("Invalid room code format", { status: 400 });
          }
          return { roomCode: roomCode.toUpperCase() };
        }
      },
      
      // EXISTING: Keep for backward compatibility
      { path: "play", element: <TeamPage /> },
      { path: "team", element: <TeamPage /> },
      
      { path: "presenter/:sessionId", element: <PresenterPage /> },
      { path: "*", element: <NotFoundPage /> },
    ],
  },
]);
```

**Route Validation Options:**

**Option A: Basic Validation (Recommended)**
```typescript
loader: ({ params }) => {
  const roomCode = params.roomCode;
  if (!roomCode || !/^[A-Z0-9]{6}$/i.test(roomCode)) {
    throw new Response("Invalid room code format", { status: 400 });
  }
  return { roomCode: roomCode.toUpperCase() };
}
```

**Option B: No Validation (Simpler)**
```typescript
{ path: "room/:roomCode", element: <TeamPage /> }
```

#### 2. Update JoinPage Navigation

**File:** `src/features/join/JoinPage.tsx`

**Current Navigation Logic:**
```typescript
// EXISTING navigation in setTeamRoom callback
setTeamRoom: (room) => {
  if (room) {
    console.log('🚀 Successful join, navigating to team page:', '/team');
    navigate('/team');
  }
},
```

**Updated Navigation Logic:**
```typescript
// UPDATED: Navigate to room-based URL
setTeamRoom: (room) => {
  if (room && room.roomCode) {
    console.log('🚀 Successful join, navigating to room:', `/room/${room.roomCode}`);
    
    // Validate roomCode before navigation
    const normalizedRoomCode = room.roomCode.trim().toUpperCase();
    if (!/^[A-Z0-9]{6}$/.test(normalizedRoomCode)) {
      console.error('❌ Invalid room code format:', normalizedRoomCode);
      toast({
        title: "Invalid Room Code",
        description: "Room code must be 6 alphanumeric characters",
        variant: "destructive",
      });
      return;
    }
    
    navigate(`/room/${normalizedRoomCode}`);
  } else {
    console.error('❌ No room or roomCode available for navigation');
    toast({
      title: "Navigation Error",
      description: "Unable to navigate to room. Please try again.",
      variant: "destructive",
    });
  }
},
```

**Alternative: Direct Navigation (if removing setTeamRoom callback)**
```typescript
// In handleJoin function, after successful join:
try {
  // ... join logic ...
  
  // Navigate directly to room
  const normalizedRoomCode = values.code.trim().toUpperCase();
  navigate(`/room/${normalizedRoomCode}`);
  
} catch (error) {
  // ... error handling ...
}
```

#### 3. Update Navigation Types (if using TypeScript)

**File:** `src/types/navigation.ts` (create if doesn't exist)

```typescript
// Add new route types for better type safety
export type AppRoute = 
  | "/"
  | "/join"
  | "/room/:roomCode"
  | "/team"
  | "/play"
  | "/host"
  | "/presenter/:sessionId";

export interface RoomParams {
  roomCode: string;
}

// Validation utility
export function validateRoomCode(roomCode: string): boolean {
  return /^[A-Z0-9]{6}$/i.test(roomCode.trim());
}

export function normalizeRoomCode(roomCode: string): string {
  return roomCode.trim().toUpperCase();
}
```

#### 4. Update Navigation Utilities (optional)

**File:** `src/utils/navigation.ts` (create if doesn't exist)

```typescript
import { validateRoomCode, normalizeRoomCode } from "../types/navigation";

export function createRoomUrl(roomCode: string): string {
  if (!validateRoomCode(roomCode)) {
    throw new Error(`Invalid room code format: ${roomCode}`);
  }
  return `/room/${normalizeRoomCode(roomCode)}`;
}

export function extractRoomCodeFromUrl(): string | null {
  const match = window.location.pathname.match(/^\/room\/([A-Z0-9]{6})$/i);
  return match ? match[1].toUpperCase() : null;
}
```

#### 5. Verification Steps

**Manual Testing:**
1. ✅ **Test existing routes** - Ensure `/join`, `/team`, `/play` still work
2. ✅ **Test new route** - Navigate to `/room/TEST01` manually
3. ✅ **Test invalid codes** - Try `/room/invalid`, `/room/123`, `/room/TOOLONG`
4. ✅ **Test case sensitivity** - `/room/test01`, `/room/TEST01` should work the same

**Automated Testing:**
```typescript
// src/__tests__/router.test.ts
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { App } from '../App';

test('renders room route with valid room code', () => {
  render(
    <MemoryRouter initialEntries={['/room/TEST01']}>
      <App />
    </MemoryRouter>
  );
  // Verify TeamPage renders with room code
});

test('handles invalid room code', () => {
  render(
    <MemoryRouter initialEntries={['/room/invalid']}>
      <App />
    </MemoryRouter>
  );
  // Verify error page or redirect
});
```

**Console Logging Verification:**
```typescript
// Should see these logs in browser console:
// 🚀 Successful join, navigating to room: /room/TEST01
// ❌ Invalid room code format: invalid (if testing invalid codes)
```

#### 6. Rollback Plan

**If issues occur:**
1. **Revert router changes** - Remove `/room/:roomCode` route
2. **Revert navigation** - Change back to `navigate('/team')`
3. **Keep existing functionality** - `/team` route remains untouched

**Quick rollback commands:**
```typescript
// In router.tsx, remove the new route
// { path: "room/:roomCode", element: <TeamPage /> }, // REMOVE THIS

// In JoinPage.tsx, revert navigation
navigate('/team'); // REVERT TO THIS
```

#### 7. Success Criteria

**Must Have:**
- ✅ New `/room/:roomCode` route works
- ✅ JoinPage navigates to `/room/ROOMCODE` after successful join
- ✅ Existing `/team` route still works (backward compatibility)
- ✅ No TypeScript errors

**Nice to Have:**
- ✅ Room code validation in router loader
- ✅ Error handling for invalid room codes
- ✅ Console logging for debugging
- ✅ Test coverage for new routes

**Expected URLs after Phase 1:**
- ✅ `/join` - Join page (unchanged)
- ✅ `/team` - Team page (unchanged, backward compatibility)
- ✅ `/room/TEST01` - Team page with room code (NEW)
- ✅ `/room/test01` - Team page with room code (case insensitive)

### Phase 2: TeamPage URL Support (1 hour)

#### Prerequisites
- ✅ Phase 1 routing updates complete and tested
- ✅ TeamPage component exists and is functional
- ✅ useRoom hook exists and works with roomId
- ✅ BackgroundAnimation and Card components available
- ✅ Current TeamPage logic is understood

#### 1. Add URL Parameter Support

**File:** `src/features/team/TeamPage.tsx`

**Current Imports (add if missing):**
```typescript
import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { BackgroundAnimation } from "../../components/BackgroundAnimation";
import { Card, Button } from "@social/ui";
import { useRoom } from "../../hooks/useRoom";
```

**Updated TeamPage Component:**
```typescript
export function TeamPage() {
  const { roomCode } = useParams<{ roomCode: string }>();
  const navigate = useNavigate();
  const { teamSession, setTeamSession, clearTeamSession } = useTeamSession();
  const { teamRoom, setTeamRoom } = useTeamRoom();
  
  // NEW: Determine if we're in URL-based or state-based mode
  const isUrlBased = !!roomCode;
  const effectiveRoomCode = roomCode || teamRoom?.roomCode;
  
  // NEW: URL-based room data fetching
  const { room, isLoading: roomLoading, error: roomError } = useRoom({ 
    roomId: undefined, // Don't use roomId for URL-based approach
    roomCode: roomCode || undefined, 
    autoRefresh: true 
  });
  
  // NEW: Handle URL-based room data
  useEffect(() => {
    if (isUrlBased && room && !teamRoom) {
      console.log('🔍 Setting teamRoom from URL-based room data:', {
        roomId: room.id,
        roomCode: room.code,
        playerName: room.currentMembership?.playerName
      });
      
      setTeamRoom({
        roomId: room.id,
        roomCode: room.code,
        playerName: room.currentMembership?.playerName || "",
      });
    }
  }, [isUrlBased, room, teamRoom, setTeamRoom]);
  
  // NEW: Handle invalid room codes (URL-based)
  if (isUrlBased && roomError) {
    console.error('❌ Room not found for roomCode:', roomCode);
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <BackgroundAnimation show={true} />
        <Card className="space-y-4 text-center" isDark={true}>
          <h2 className="text-2xl font-bold text-white">Room Not Found</h2>
          <p className="text-slate-400">
            Room code "{roomCode?.toUpperCase()}" doesn't exist or has expired.
          </p>
          <div className="space-y-2">
            <Button onClick={() => navigate("/join")} className="w-full">
              Back to Join
            </Button>
            <Button 
              variant="outline" 
              onClick={() => navigate("/team")} 
              className="w-full"
            >
              Go to Team Page
            </Button>
          </div>
        </Card>
      </div>
    );
  }
  
  // NEW: Loading state for URL-based navigation
  if (isUrlBased && roomLoading) {
    console.log('🔄 Loading room data for roomCode:', roomCode);
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <BackgroundAnimation show={true} />
        <Card className="space-y-4 text-center" isDark={true}>
          <div className="space-y-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-400 mx-auto"></div>
            <h2 className="text-2xl font-bold text-white">Loading Room...</h2>
            <p className="text-slate-400">
              Joining room {roomCode?.toUpperCase()}...
            </p>
          </div>
        </Card>
      </div>
    );
  }
  
  // EXISTING: Rest of TeamPage logic remains unchanged
  const teamState = useTeamState(teamSession, teamRoom);
  const {
    sessionId,
    setSessionId,
    session,
    setSession,
    joinForm,
    setJoinForm,
    joinErrors,
    setJoinErrors,
    isJoining,
    setIsJoining,
    hasManuallyLeft,
    setHasManuallyLeft,
    autoJoinAttempted,
    setAutoJoinAttempted,
    answerText,
    setAnswerText,
    myAnswer,
    myGroup,
    setIsSubmittingAnswer,
    setIsSubmittingVote,
  } = teamState;

  // Extract event handlers into custom hook
  const { handleJoin, handleSubmitAnswer, handleVote } = useTeamHandlers({
    sessionId,
    session,
    joinForm,
    setJoinForm,
    setJoinErrors,
    setIsJoining,
    setSessionId,
    setTeamSession,
    setTeamRoom,
    clearTeamSession,
    setHasManuallyLeft,
    setAutoJoinAttempted,
    answerText,
    setAnswerText,
    myAnswer,
    myGroup,
    setIsSubmittingAnswer,
    setIsSubmittingVote,
  });

  // NEW: Debug logging for URL-based approach
  useEffect(() => {
    console.log('🔍 TeamPage debug:', {
      isUrlBased,
      roomCode,
      teamRoom,
      room,
      roomLoading,
      roomError,
      effectiveRoomCode
    });
  }, [isUrlBased, roomCode, teamRoom, room, roomLoading, roomError, effectiveRoomCode]);

  // EXISTING: Rest of TeamPage rendering logic
  let mainContent;
  
  if (sessionSnapshotReady && session) {
    mainContent = renderGameContent;
  } else if (!sessionId && teamRoom) {
    mainContent = (
      <RoomLobbyPhase 
        roomCode={teamRoom.roomCode} 
        roomId={teamRoom.roomId} 
        onLeaveRoom={() => setTeamRoom(null)} 
      />
    );
  } else if (!sessionId) {
    mainContent = (
      <JoinForm
        joinForm={joinForm}
        joinErrors={joinErrors}
        isJoining={isJoining}
        handleJoin={handleJoin}
        setJoinForm={setJoinForm}
      />
    );
  } else if (!sessionSnapshotReady) {
    mainContent = (
      <Card className="space-y-3 text-center" isDark={isDark}>
        <h2 className={`text-xl font-semibold ${!isDark ? 'text-slate-900' : 'text-pink-400'}`}>Connecting...</h2>
        <p className={`text-sm ${!isDark ? 'text-slate-600' : 'text-cyan-300'}`}>Pulling the latest game state.</p>
      </Card>
    );
  } else if (session) {
    mainContent = renderGameContent;
  } else {
    mainContent = endedSession ? (
      <EndedPhase
        session={endedSession}
        onLeaveSession={effectsHandleLeave}
        onRejoinSession={() => navigate(0)}
      />
    ) : (
      <Card className="space-y-3 text-center" isDark={isDark}>
        <h2 className={`text-xl font-semibold ${!isDark ? 'text-slate-900' : 'text-pink-400'}`}>Session Not Found</h2>
        <p className={`text-sm ${!isDark ? 'text-slate-600' : 'text-cyan-300'}`}>The session you're looking for doesn't exist.</p>
        <Button onClick={() => navigate("/join")}>Back to Join</Button>
      </Card>
    );
  }

  // EXISTING: Return the main content with background
  return (
    <>
      <BackgroundAnimation show={true} />
      <style>{`
        body {
          background: transparent !important;
        }
      `}</style>
      <div className="relative z-10 flex min-h-screen items-center justify-center px-3 py-10 sm:px-4 pb-10">
        <div className="chaos-stack mx-auto flex w-[92vw] max-w-[440px] flex-col gap-4 sm:w-full sm:max-w-[520px] sm:gap-6">
          <div className="p-4"></div>
          {mainContent}
        </div>
      </div>
    </>
  );
}
```

#### 2. Update useRoom Hook to Support roomCode

**File:** `src/hooks/useRoom.ts`

**Current useRoom Hook (likely needs update):**
```typescript
// EXISTING useRoom hook probably only supports roomId
export function useRoom({ roomId, autoRefresh }: UseRoomOptions) {
  // ... existing logic
}
```

**Updated useRoom Hook:**
```typescript
import { useEffect, useState } from "react";
import { useAuth } from "../shared/providers/AuthProvider";
import { roomService } from "../services/roomService";
import { roomMembershipService } from "../services/roomMembershipService";

interface UseRoomOptions {
  roomId?: string;
  roomCode?: string;
  autoRefresh?: boolean;
}

interface Room {
  id: string;
  code: string;
  name?: string;
  currentMembership?: {
    id: string;
    userId: string;
    playerName: string;
  };
}

export function useRoom({ roomId, roomCode, autoRefresh = false }: UseRoomOptions) {
  const { user } = useAuth();
  const [room, setRoom] = useState<Room | null>(null);
  const [memberships, setMemberships] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadRoom = async () => {
    if (!roomId && !roomCode) {
      console.log('🔍 useRoom: No roomId or roomCode provided');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log('🔍 useRoom: Loading room', { roomId, roomCode });
      
      let roomResponse;
      if (roomCode) {
        // NEW: Load room by roomCode
        roomResponse = await roomService.getRoom({ code: roomCode });
      } else if (roomId) {
        // EXISTING: Load room by roomId
        roomResponse = await roomService.getRoom({ id: roomId });
      }

      if (!roomResponse?.room) {
        throw new Error(roomCode ? `Room code "${roomCode}" not found` : `Room ID "${roomId}" not found`);
      }

      setRoom(roomResponse.room);
      console.log('✅ useRoom: Room loaded successfully', roomResponse.room);

      // Load memberships for the room
      const membershipsResponse = await roomMembershipService.getRoomMembers({
        roomId: roomResponse.room.id
      });
      
      setMemberships(membershipsResponse.memberships || []);
      console.log('✅ useRoom: Memberships loaded', membershipsResponse.memberships?.length);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load room';
      setError(errorMessage);
      console.error('❌ useRoom: Error loading room', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Load room on mount and when parameters change
  useEffect(() => {
    loadRoom();
  }, [roomId, roomCode]);

  // Auto-refresh if enabled
  useEffect(() => {
    if (!autoRefresh || !room) return;

    const interval = setInterval(() => {
      console.log('🔄 useRoom: Auto-refreshing room data');
      loadRoom();
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [autoRefresh, room, roomId, roomCode]);

  // Find current user's membership
  const myMembership = user ? memberships.find(m => m.userId === user.id) : null;

  // Debug logging
  console.log('🔍 useRoom debug:', {
    roomId,
    roomCode,
    room: room ? { id: room.id, code: room.code } : null,
    membershipsCount: memberships.length,
    myMembership: myMembership ? { id: myMembership.id, playerName: myMembership.playerName } : null,
    isLoading,
    error
  });

  return {
    room,
    memberships,
    myMembership,
    isLoading,
    error,
    refreshRoom: loadRoom
  };
}
```

#### 3. Update roomService to Support roomCode

**File:** `src/services/roomService.ts`

**Current roomService (add if missing):**
```typescript
// EXISTING roomService might only support getById
export async function getRoomById(id: string) {
  // ... existing logic
}
```

**Updated roomService:**
```typescript
import { supabase } from "../supabase/client";

export interface Room {
  id: string;
  code: string;
  name?: string;
  created_at: string;
  updated_at: string;
}

export interface GetRoomOptions {
  id?: string;
  code?: string;
}

export interface GetRoomResponse {
  room: Room | null;
  error?: string;
}

export async function getRoom({ id, code }: GetRoomOptions): Promise<GetRoomResponse> {
  try {
    console.log('🔍 roomService.getRoom:', { id, code });

    let query = supabase.from('rooms').select('*');

    if (id) {
      query = query.eq('id', id);
    } else if (code) {
      query = query.eq('code', code.toUpperCase());
    } else {
      throw new Error('Either id or code must be provided');
    }

    const { data: roomData, error } = await query.single();

    if (error) {
      console.error('❌ roomService error:', error);
      
      if (error.code === 'PGRST116') {
        // No rows returned
        return { room: null, error: id ? `Room with ID "${id}" not found` : `Room with code "${code}" not found` };
      }
      
      throw new Error(`Database error: ${error.message}`);
    }

    if (!roomData) {
      return { room: null, error: id ? `Room with ID "${id}" not found` : `Room with code "${code}" not found` };
    }

    console.log('✅ roomService: Room found', roomData);
    return { room: roomData };

  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
    console.error('❌ roomService: Unexpected error', err);
    return { room: null, error: errorMessage };
  }
}

// Keep existing function for backward compatibility
export async function getRoomById(id: string): Promise<GetRoomResponse> {
  return getRoom({ id });
}

// NEW: Get room by code
export async function getRoomByCode(code: string): Promise<GetRoomResponse> {
  return getRoom({ code });
}
```

#### 4. Add Error Boundary for Room Errors

**File:** `src/components/RoomErrorBoundary.tsx` (create new)

```typescript
import React from 'react';
import { Card, Button } from '@social/ui';
import { BackgroundAnimation } from './BackgroundAnimation';

interface RoomErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

interface RoomErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error?: Error; reset: () => void }>;
}

export class RoomErrorBoundary extends React.Component<RoomErrorBoundaryProps, RoomErrorBoundaryState> {
  constructor(props: RoomErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): RoomErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('🚨 RoomErrorBoundary caught an error:', error, errorInfo);
  }

  reset = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || DefaultRoomErrorFallback;
      return <FallbackComponent error={this.state.error} reset={this.reset} />;
    }

    return this.props.children;
  }
}

function DefaultRoomErrorFallback({ error, reset }: { error?: Error; reset: () => void }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <BackgroundAnimation show={true} />
      <Card className="space-y-4 text-center" isDark={true}>
        <h2 className="text-2xl font-bold text-white">Something went wrong</h2>
        <p className="text-slate-400">
          {error?.message || 'An unexpected error occurred while loading the room.'}
        </p>
        <div className="space-y-2">
          <Button onClick={reset} className="w-full">
            Try Again
          </Button>
          <Button 
            variant="outline" 
            onClick={() => window.location.href = "/join"}
            className="w-full"
          >
            Back to Join
          </Button>
        </div>
      </Card>
    </div>
  );
}
```

#### 5. Verification Steps

**Manual Testing:**
1. ✅ **Test URL navigation** - Go to `/room/TEST01` directly
2. ✅ **Test invalid room codes** - Try `/room/INVALID`, `/room/123`
3. ✅ **Test loading states** - Slow network should show loading spinner
4. ✅ **Test error states** - Invalid room should show error page
5. ✅ **Test backward compatibility** - `/team` should still work
6. ✅ **Test join flow** - Join should navigate to `/room/ROOMCODE`

**Console Logging Verification:**
```typescript
// Should see these logs in browser console:
// 🔍 TeamPage debug: { isUrlBased: true, roomCode: "TEST01", ... }
// 🔍 useRoom: Loading room { roomCode: "TEST01" }
// ✅ useRoom: Room loaded successfully { id: "...", code: "TEST01" }
// 🔍 Setting teamRoom from URL-based room data: { roomId: "...", roomCode: "TEST01" }
```

**Automated Testing:**
```typescript
// src/__tests__/team-page-url.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { TeamPage } from '../features/team/TeamPage';

// Mock the services
jest.mock('../services/roomService');
jest.mock('../services/roomMembershipService');

test('renders room lobby for valid room code', async () => {
  const mockRoom = { id: '123', code: 'TEST01' };
  (roomService.getRoom as jest.Mock).mockResolvedValue({ room: mockRoom });
  
  render(
    <MemoryRouter initialEntries={['/room/TEST01']}>
      <TeamPage />
    </MemoryRouter>
  );

  await waitFor(() => {
    expect(screen.getByText(/loading room/i)).toBeInTheDocument();
  });

  await waitFor(() => {
    expect(screen.getByText(/you're in the room lobby/i)).toBeInTheDocument();
  });
});

test('shows error for invalid room code', async () => {
  (roomService.getRoom as jest.Mock).mockResolvedValue({ room: null, error: 'Room not found' });
  
  render(
    <MemoryRouter initialEntries={['/room/INVALID']}>
      <TeamPage />
    </MemoryRouter>
  );

  await waitFor(() => {
    expect(screen.getByText(/room not found/i)).toBeInTheDocument();
  });
});
```

#### 6. Rollback Plan

**If issues occur:**
1. **Revert TeamPage changes** - Remove URL parameter logic
2. **Revert useRoom changes** - Remove roomCode support
3. **Revert roomService changes** - Remove roomCode support
4. **Keep Phase 1 routing** - `/room/:roomCode` route can stay for now

**Quick rollback commands:**
```typescript
// In TeamPage.tsx, remove URL parameter logic
const { roomCode } = useParams<{ roomCode: string }>(); // REMOVE
// ... remove all URL-based logic

// In useRoom.ts, revert to original signature
export function useRoom({ roomId, autoRefresh }: UseRoomOptions) { // REVERT
```

#### 7. Success Criteria

**Must Have:**
- ✅ TeamPage works with `/room/:roomCode` URLs
- ✅ Loading states show for URL-based navigation
- ✅ Error handling for invalid room codes
- ✅ Backward compatibility with `/team` route
- ✅ No TypeScript errors

**Nice to Have:**
- ✅ Error boundary for unexpected errors
- ✅ Comprehensive logging for debugging
- ✅ Test coverage for URL scenarios
- ✅ Auto-refresh functionality works

**Expected Behavior after Phase 2:**
- ✅ `/room/TEST01` → Shows loading → Shows room lobby
- ✅ `/room/INVALID` → Shows error page
- ✅ `/team` → Works as before (state-based)
- ✅ Join flow → Navigates to `/room/ROOMCODE` → Shows room lobby

### Phase 3: State Management Cleanup (2 hours)

#### Prerequisites
- ✅ Phase 1 routing updates complete and tested
- ✅ Phase 2 TeamPage URL support complete and tested
- ✅ URL-based room navigation working correctly
- ✅ No React hooks errors or flickering issues
- ✅ Current state management dependencies understood

#### 1. Simplify JoinPage State Management

**Current Issues with JoinPage:**
- Uses complex `useTeamState`, `useTeamSession`, `useTeamRoom` hooks
- Has redundant state management for URL-based approach
- Maintains session state that's not needed for joining

**File:** `src/features/join/JoinPage.tsx`

**Updated JoinPage Component:**
```typescript
import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "../../shared/hooks";
import { BackgroundAnimation } from "../../components/BackgroundAnimation";
import { Card, Button } from "@social/ui";
import { JoinForm } from "../team/Phases";
import { roomService } from "../../services/roomService";
import { roomMembershipService } from "../../services/roomMembershipService";
import { useAuth } from "../../shared/providers/AuthContext";

interface JoinFormState {
  code: string;
  playerName: string;
}

interface JoinErrors {
  code?: string;
  playerName?: string;
}

export function JoinPage() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // SIMPLIFIED: Only manage form state, no complex team state
  const [joinForm, setJoinForm] = useState<JoinFormState>({
    code: "",
    playerName: ""
  });
  const [joinErrors, setJoinErrors] = useState<JoinErrors>({});
  const [isJoining, setIsJoining] = useState(false);

  // SIMPLIFIED: Direct join handler without team state management
  const handleJoin = useCallback(async (values: JoinFormState) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to join a room",
        variant: "error",
      });
      return;
    }

    setIsJoining(true);
    setJoinErrors({});

    try {
      // Validate input
      const normalizedCode = values.code.trim().toUpperCase();
      const normalizedName = values.playerName.trim();
      
      if (!normalizedCode) {
        setJoinErrors({ code: "Room code is required" });
        return;
      }
      
      if (!/^[A-Z0-9]{6}$/.test(normalizedCode)) {
        setJoinErrors({ code: "Room code must be 6 alphanumeric characters" });
        return;
      }
      
      if (!normalizedName) {
        setJoinErrors({ playerName: "Player name is required" });
        return;
      }

      // Verify room exists first
      console.log('🔍 Verifying room exists:', normalizedCode);
      const roomResponse = await roomService.getRoom({ code: normalizedCode });
      
      if (!roomResponse.room) {
        setJoinErrors({ code: "Room not found" });
        return;
      }

      // Join the room
      console.log('🚀 Joining room:', { roomCode: normalizedCode, playerName: normalizedName });
      const membershipResponse = await roomMembershipService.joinRoom({
        roomId: roomResponse.room.id,
        playerName: normalizedName
      });

      if (!membershipResponse.membership) {
        throw new Error("Failed to join room");
      }

      console.log('✅ Successfully joined room:', membershipResponse.membership);
      
      // Navigate to room directly - no state management needed
      navigate(`/room/${normalizedCode}`);
      
      toast({
        title: "Room Joined!",
        description: `Successfully joined room ${normalizedCode}`,
        variant: "success",
      });

    } catch (error) {
      console.error('❌ Failed to join room:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to join room';
      
      setJoinErrors({ 
        code: errorMessage.includes("not found") ? errorMessage : undefined,
        playerName: errorMessage.includes("name") ? errorMessage : undefined
      });
      
      toast({
        title: "Join Failed",
        description: errorMessage,
        variant: "error",
      });
    } finally {
      setIsJoining(false);
    }
  }, [user, toast, navigate]);

  // Wrapper for form submission
  const handleSubmit = useCallback((event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const values = {
      code: String(formData.get("code") ?? ""),
      playerName: String(formData.get("playerName") ?? ""),
    };
    void handleJoin(values);
  }, [handleJoin]);

  // Simplified styling
  const mainClassName = "relative z-10 flex min-h-screen items-center justify-center px-3 py-10 sm:px-4 pb-10";
  const contentWrapperClassName = "chaos-stack mx-auto flex w-[92vw] max-w-[440px] flex-col gap-4 sm:w-full sm:max-w-[520px] sm:gap-6";

  return (
    <>
      <BackgroundAnimation show={true} />
      <style>{`
        body {
          background: transparent !important;
        }
      `}</style>
      <div className={mainClassName}>
        <div className={contentWrapperClassName}>
          <div className="p-4"></div>
          <JoinForm
            joinForm={joinForm}
            joinErrors={joinErrors}
            isJoining={isJoining}
            handleJoin={handleSubmit}
            setJoinForm={setJoinForm}
          />
        </div>
      </div>
    </>
  );
}
```

#### 2. Remove Unused State Management from TeamPage

**File:** `src/features/team/TeamPage.tsx`

**Remove Unused Imports and Hooks:**
```typescript
// REMOVE these imports that are no longer needed for URL-based approach:
// import { useTeamState } from "./hooks/useTeamState";
// import { useTeamHandlers } from "./hooks/useTeamHandlers";
// import { useTeamEffects } from "./hooks/useTeamEffects";
// import { useTeamComputations } from "./hooks/useTeamComputations";
// import { useTeamTimers } from "./hooks/useTeamTimers";
// import { useTeamSessionManagement } from "./hooks/useTeamSessionManagement";

// KEEP only essential imports:
import { useCallback, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button, Card, Modal, SessionTimer } from "@social/ui";
import { BackgroundAnimation } from "../../components/BackgroundAnimation";
import { useRoom } from "../../hooks/useRoom";
import { useTeamSession } from "./useTeamSession";
import { useTeamRoom } from "./useTeamRoom";
import { RoomLobbyPhase } from "./Phases/RoomLobbyPhase";
import { EndedPhase } from "./Phases";
```

**Simplified TeamPage Component:**
```typescript
export function TeamPage() {
  const { roomCode } = useParams<{ roomCode: string }>();
  const navigate = useNavigate();
  const { teamSession, setTeamSession, clearTeamSession } = useTeamSession();
  const { teamRoom, setTeamRoom } = useTeamRoom();
  const { isDark } = useTheme();

  // URL-based mode detection
  const isUrlBased = !!roomCode;
  
  // Room data fetching
  const { room, isLoading: roomLoading, error: roomError } = useRoom({ 
    roomId: undefined,
    roomCode: roomCode || undefined, 
    autoRefresh: false 
  });
  
  // Set teamRoom from URL-based room data
  useEffect(() => {
    if (isUrlBased && room && !teamRoom) {
      console.log('🔍 Setting teamRoom from URL-based room data:', {
        roomId: room.id,
        roomCode: room.code
      });
      
      setTeamRoom({
        roomId: room.id,
        roomCode: room.code,
        playerName: "", // Will be set when user joins
      });
    }
  }, [isUrlBased, room, teamRoom, setTeamRoom]);

  // Early returns for error and loading states
  if (isUrlBased && roomError) {
    console.error('❌ Room not found for roomCode:', roomCode);
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <BackgroundAnimation show={true} />
        <Card className="space-y-4 text-center" isDark={true}>
          <h2 className="text-2xl font-bold text-white">Room Not Found</h2>
          <p className="text-slate-400">
            Room code "{roomCode?.toUpperCase()}" doesn't exist or has expired.
          </p>
          <div className="space-y-2">
            <Button onClick={() => navigate("/join")} className="w-full">
              Back to Join
            </Button>
            <Button 
              variant="outline" 
              onClick={() => navigate("/team")} 
              className="w-full"
            >
              Go to Team Page
            </Button>
          </div>
        </Card>
      </div>
    );
  }
  
  if (isUrlBased && roomLoading) {
    console.log('🔄 Loading room data for roomCode:', roomCode);
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <BackgroundAnimation show={true} />
        <Card className="space-y-4 text-center" isDark={true}>
          <div className="space-y-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-400 mx-auto"></div>
            <h2 className="text-2xl font-bold text-white">Loading Room...</h2>
            <p className="text-slate-400">
              Joining room {roomCode?.toUpperCase()}...
            </p>
          </div>
        </Card>
      </div>
    );
  }

  // Simplified content logic
  let mainContent;
  
  if (teamRoom && (!teamSession.sessionId || !teamSession.sessionSnapshotReady)) {
    // Show room lobby
    console.log('🔍 Showing RoomLobbyPhase:', { teamRoom, isUrlBased });
    mainContent = (
      <RoomLobbyPhase 
        roomCode={teamRoom.roomCode} 
        roomId={teamRoom.roomId} 
        onLeaveRoom={() => setTeamRoom(null)} 
      />
    );
  } else if (!teamSession.sessionId) {
    // Show join form (fallback for state-based approach)
    console.log('🔍 Showing JoinForm - fallback');
    mainContent = (
      <Card className="space-y-4 text-center" isDark={true}>
        <h2 className="text-2xl font-bold text-white">Join Room</h2>
        <p className="text-slate-400">Please enter a room code to join.</p>
        <Button onClick={() => navigate("/join")} className="w-full">
          Go to Join Page
        </Button>
      </Card>
    );
  } else {
    // Show game content (when session is active)
    mainContent = (
      <Card className="space-y-3 text-center" isDark={isDark}>
        <h2 className={`text-xl font-semibold ${!isDark ? 'text-slate-900' : 'text-pink-400'}`}>Game Active</h2>
        <p className={`text-sm ${!isDark ? 'text-slate-600' : 'text-cyan-300'}`}>Game session is in progress.</p>
      </Card>
    );
  }

  return (
    <>
      <BackgroundAnimation show={true} />
      <style>{`
        body {
          background: transparent !important;
        }
      `}</style>
      <div className="relative z-10 flex min-h-screen items-center justify-center px-3 py-10 sm:px-4 pb-10">
        <div className="chaos-stack mx-auto flex w-[92vw] max-w-[440px] flex-col gap-4 sm:w-full sm:max-w-[520px] sm:gap-6">
          <div className="p-4"></div>
          {mainContent}
        </div>
      </div>
    </>
  );
}
```

#### 3. Update RoomLobbyPhase for URL-Based Approach

**File:** `src/features/team/Phases/RoomLobbyPhase.tsx`

**Simplified RoomLobbyPhase:**
```typescript
import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Card } from "@social/ui";
import { BackgroundAnimation } from "../../../components/BackgroundAnimation";
import { useToast } from "../../../shared/hooks";
import { roomMembershipService } from "../../../services/roomMembershipService";
import { useAuth } from "../../../shared/providers/AuthContext";

interface RoomLobbyPhaseProps {
  roomCode: string;
  roomId: string;
  onLeaveRoom: () => void;
}

export function RoomLobbyPhase({ roomCode, roomId, onLeaveRoom }: RoomLobbyPhaseProps) {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleLeaveRoom = useCallback(() => {
    console.log('🔍 Leaving room:', roomCode);
    onLeaveRoom();
    navigate("/join");
  }, [onLeaveRoom, navigate, roomCode]);

  const handleStartSession = useCallback(async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to start a session",
        variant: "error",
      });
      return;
    }

    try {
      console.log('🚀 Starting session for room:', roomId);
      // Session start logic would go here
      toast({
        title: "Session Started",
        description: "Game session has been started",
        variant: "success",
      });
    } catch (error) {
      console.error('❌ Failed to start session:', error);
      toast({
        title: "Start Failed",
        description: "Failed to start game session",
        variant: "error",
      });
    }
  }, [user, toast, roomId]);

  return (
    <>
      <BackgroundAnimation show={true} />
      <style>{`
        body {
          background: transparent !important;
        }
      `}</style>
      <div className="relative z-10 flex min-h-screen items-center justify-center px-3 py-10 sm:px-4 pb-10">
        <div className="chaos-stack mx-auto flex w-[92vw] max-w-[440px] flex-col gap-4 sm:w-full sm:max-w-[520px] sm:gap-6">
          <Card className="space-y-6 text-center" isDark={true}>
            <div className="space-y-4">
              <h2 className="text-3xl font-bold text-white">Room Lobby</h2>
              <div className="space-y-2">
                <p className="text-2xl font-mono text-pink-400">{roomCode}</p>
                <p className="text-slate-400">Share this code with friends to join!</p>
              </div>
            </div>
            
            <div className="space-y-3">
              <Button onClick={handleStartSession} className="w-full" size="lg">
                Start Game
              </Button>
              <Button 
                variant="outline" 
                onClick={handleLeaveRoom} 
                className="w-full"
              >
                Leave Room
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}
```

#### 4. Remove Unused Hooks and Utilities

**Files to Remove or Simplify:**

**File:** `src/features/team/hooks/useTeamState.ts`
```typescript
// SIMPLIFIED: Remove URL-specific state, keep only session state
export function useTeamState(teamSession, teamRoom) {
  // Keep only session-related state
  // Remove complex team state that's not needed for URL-based approach
  return {
    sessionId: teamSession.sessionId,
    setSessionId: teamSession.setSessionId,
    // ... keep only essential session state
  };
}
```

**File:** `src/features/team/hooks/useTeamHandlers.ts`
```typescript
// SIMPLIFIED: Remove join handlers, keep only game-related handlers
export function useTeamHandlers(options) {
  // Remove handleJoin - handled directly in JoinPage now
  // Keep only game-related handlers (answer, vote, etc.)
  return {
    handleSubmitAnswer,
    handleVote,
    // ... keep only game handlers
  };
}
```

#### 5. Update Router Configuration (Optional Cleanup)

**File:** `src/app/router.tsx`

**Remove Legacy Routes (Optional):**
```typescript
export const appRouter = createBrowserRouter([
  {
    path: "/",
    element: (
      <AppProviders>
        <RootLayout />
      </AppProviders>
    ),
    children: [
      { index: true, element: <EntryPage /> },
      { path: "auth", element: <PlayerAuthPage /> },
      { path: "venue-auth", element: <VenueAuthPage /> },
      { path: "host", element: <HostPage /> },
      { path: "join", element: <JoinPage /> },
      
      // PRIMARY: URL-based room route
      { 
        path: "room/:roomCode", 
        element: <TeamPage />,
        loader: ({ params }) => {
          const roomCode = params.roomCode;
          if (!roomCode || !/^[A-Z0-9]{6}$/i.test(roomCode)) {
            throw new Response("Invalid room code format", { status: 400 });
          }
          return { roomCode: roomCode.toUpperCase() };
        }
      },
      
      // OPTIONAL: Keep for backward compatibility during transition
      { path: "team", element: <TeamPage /> },
      { path: "play", element: <TeamPage /> },
      
      { path: "presenter/:sessionId", element: <PresenterPage /> },
      { path: "*", element: <NotFoundPage /> },
    ],
  },
  { 
    path: "*", 
    element: (
      <AppProviders>
        <NotFoundPage />
      </AppProviders>
    ),
  },
]);
```

#### 6. Verification Steps

**Manual Testing:**
1. ✅ **Join flow works** - Join form → Navigate to `/room/ROOMCODE`
2. ✅ **Direct navigation works** - `/room/TEST01` → Room lobby
3. ✅ **Error handling works** - `/room/INVALID` → Error page
4. ✅ **Leave room works** - Room lobby → Back to join page
5. ✅ **No state conflicts** - Multiple tabs work independently
6. ✅ **Performance improved** - No unnecessary state management

**Console Logging Verification:**
```typescript
// Should see clean logs:
// 🔍 Verifying room exists: TEST01
// ✅ Successfully joined room: { membership: {...} }
// 🚀 Joining room: { roomCode: "TEST01", playerName: "Player" }
// 🔍 Setting teamRoom from URL-based room data: { roomId: "...", roomCode: "TEST01" }
```

**Automated Testing:**
```typescript
// src/__tests__/join-page-simplified.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { JoinPage } from '../features/join/JoinPage';

// Mock services
jest.mock('../services/roomService');
jest.mock('../services/roomMembershipService');

test('simplified join flow works correctly', async () => {
  const mockRoom = { id: '123', code: 'TEST01' };
  const mockMembership = { membership: { id: 'membership-123' } };
  
  (roomService.getRoom as jest.Mock).mockResolvedValue({ room: mockRoom });
  (roomMembershipService.joinRoom as jest.Mock).mockResolvedValue(mockMembership);
  
  render(
    <MemoryRouter initialEntries={['/join']}>
      <JoinPage />
    </MemoryRouter>
  );

  // Fill form
  fireEvent.change(screen.getByLabelText(/room code/i), { target: { value: 'TEST01' } });
  fireEvent.change(screen.getByLabelText(/player name/i), { target: { value: 'TestPlayer' } });
  
  // Submit form
  fireEvent.click(screen.getByText(/join room/i));

  await waitFor(() => {
    expect(roomService.getRoom).toHaveBeenCalledWith({ code: 'TEST01' });
    expect(roomMembershipService.joinRoom).toHaveBeenCalled();
  });
});
```

#### 7. Rollback Plan

**If issues occur:**
1. **Revert JoinPage** - Restore original complex state management
2. **Revert TeamPage** - Restore all removed hooks and imports
3. **Revert RoomLobbyPhase** - Restore original implementation
4. **Keep URL routes** - `/room/:roomCode` can stay for testing

**Quick rollback commands:**
```typescript
// Restore original JoinPage imports:
import { useTeamState, useTeamHandlers } from "./hooks";

// Restore original TeamPage imports:
import { useTeamState, useTeamEffects, useTeamPhaseRenderer, useTeamHandlers } from "./hooks";

// Restore complex state management:
const teamState = useTeamState(teamSession, teamRoom);
const { handleJoin, handleSubmitAnswer, handleVote } = useTeamHandlers({...});
```

#### 8. Success Criteria

**Must Have:**
- ✅ JoinPage simplified with direct room service calls
- ✅ TeamPage simplified with minimal state management
- ✅ URL-based navigation works without complex state
- ✅ No performance degradation
- ✅ All existing functionality preserved
- ✅ No TypeScript errors

**Nice to Have:**
- ✅ Reduced bundle size (removed unused hooks)
- ✅ Improved performance (less state management overhead)
- ✅ Cleaner codebase (simplified components)
- ✅ Better maintainability (fewer dependencies)
- ✅ Enhanced testability (isolated components)

**Expected Behavior after Phase 3:**
- ✅ Join form → Direct room service call → Navigate to `/room/ROOMCODE`
- ✅ `/room/ROOMCODE` → Room lobby with minimal state management
- ✅ Better performance (no unnecessary state updates)
- ✅ Cleaner architecture (URL-based approach fully implemented)

**Migration Benefits:**
- ✅ **Simplified state management** - Less complex state to manage
- ✅ **Better performance** - Fewer re-renders and state updates
- ✅ **Improved maintainability** - Cleaner, more focused components
- ✅ **Enhanced scalability** - URL-based approach scales better
- ✅ **Reduced bundle size** - Removed unused hooks and utilities

#### 3.5: Lobby Unification (Optional Enhancement)

**Current Issue:**
- **RoomLobbyPhase** - Handles room-level operations (room code, leave room, start session)
- **LobbyPhase** - Handles team-level operations (teams, background music) - not used in URL approach
- **Architectural confusion** - Two separate lobby components with overlapping purposes

**Proposed Solution:**
Unify RoomLobbyPhase and LobbyPhase into a single LobbyPhase component that handles all pre-game states.

**File:** `src/features/team/Phases/LobbyPhase.tsx` (Updated)

**Unified LobbyPhase Component:**
```typescript
import { useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Card } from "@social/ui";
import { useTheme } from "../../../shared/providers/ThemeProvider";
import { useToast } from "../../../shared/hooks";
import { BackgroundAnimation } from "../../../components/BackgroundAnimation";
import { DrinkTank } from "../../../components/DrinkTank";
import { useRoom } from "../../../hooks/useRoom";
import { roomMembershipService } from "../../../services/roomMembershipService";
import { useAuth } from "../../../shared/providers/AuthContext";
import type { Session } from "../../../shared/types";
import type { Team } from "../../../shared/types";

interface LobbyPhaseProps {
  roomCode?: string;
  roomId?: string;
  sessionId?: string | null;
  sessionSnapshotReady?: boolean;
  session?: Session | null;
  onLeaveRoom?: () => void;
  onStartSession?: () => void;
  teams?: Team[]; // Keep for backward compatibility
}

export function LobbyPhase({ 
  roomCode, 
  roomId, 
  sessionId, 
  sessionSnapshotReady, 
  session,
  onLeaveRoom,
  onStartSession,
  teams = [] // Keep for backward compatibility
}: LobbyPhaseProps) {
  const { isDark } = useTheme();
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Room data fetching for room-based approach
  const { room, isLoading: roomLoading, error: roomError } = useRoom({ 
    roomId: roomId || undefined,
    roomCode: roomCode || undefined,
    autoRefresh: true 
  });

  // Background music (from original LobbyPhase)
  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio('/sounds/Lobby Swing.mp3');
      audioRef.current.loop = true;
      audioRef.current.volume = 0.5;
    }

    const audio = audioRef.current;
    
    audio.play().catch((error) => {
      console.error('Error playing lobby music:', error);
    });

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    };
  }, []);

  // Handle leaving room (from RoomLobbyPhase)
  const handleLeaveRoom = useCallback(async () => {
    if (!roomId) {
      console.log('🔍 No roomId provided, navigating to join');
      onLeaveRoom?.();
      navigate("/join");
      return;
    }

    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to leave room",
        variant: "error",
      });
      return;
    }

    try {
      console.log('🔍 Leaving room:', roomCode);
      await roomMembershipService.leaveRoom({
        roomId,
        userId: user.id, // Use authenticated user ID
      });
      
      toast({
        title: "Room Left",
        description: `You have left room ${roomCode}`,
        variant: "success",
      });
    } catch (error) {
      console.error("Failed to leave room:", error);
      toast({
        title: "Leave Failed",
        description: "Failed to leave room. Please try again.",
        variant: "error",
      });
    }
    
    onLeaveRoom?.();
    navigate("/join");
  }, [roomId, roomCode, user, onLeaveRoom, navigate, toast]);

  // Handle starting session (from RoomLobbyPhase)
  const handleStartSession = useCallback(async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to start a session",
        variant: "error",
      });
      return;
    }

    if (!roomId) {
      toast({
        title: "Room Required",
        description: "Cannot start session without a room",
        variant: "error",
      });
      return;
    }

    try {
      console.log('🚀 Starting session for room:', roomId);
      
      // Validate room exists before starting session
      if (!room && roomCode) {
        toast({
          title: "Room Not Found",
          description: "Cannot start session - room data not available",
          variant: "error",
        });
        return;
      }
      
      // Session start logic would go here
      onStartSession?.();
      
      toast({
        title: "Session Started",
        description: "Game session has been started successfully",
        variant: "success",
      });
    } catch (error) {
      console.error('❌ Failed to start session:', error);
      toast({
        title: "Start Failed",
        description: error instanceof Error ? error.message : "Failed to start game session",
        variant: "error",
      });
    }
  }, [user, toast, roomId, room, roomCode, onStartSession]);

  // Determine lobby state
  const getLobbyState = () => {
    if (roomError) {
      return { state: 'error', message: 'Room not found' };
    }
    
    if (roomLoading) {
      return { state: 'loading', message: 'Loading room...' };
    }
    
    if (sessionId && sessionSnapshotReady && session) {
      return { state: 'game-active', message: 'Game in progress' };
    }
    
    if (sessionId && !sessionSnapshotReady) {
      return { state: 'connecting', message: 'Connecting to game...' };
    }
    
    if (roomCode || roomId) {
      return { state: 'room-ready', message: 'Host is setting things up...' };
    }
    
    return { state: 'default', message: 'Waiting for room...' };
  };

  const lobbyState = getLobbyState();

  // Render based on lobby state
  const renderContent = () => {
    switch (lobbyState.state) {
      case 'error':
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-white">Room Not Found</h2>
            <p className="text-slate-400">{lobbyState.message}</p>
            <Button onClick={() => navigate("/join")} className="w-full">
              Back to Join
            </Button>
          </div>
        );

      case 'loading':
        return (
          <div className="space-y-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-400 mx-auto"></div>
            <h2 className="text-2xl font-bold text-white">Loading...</h2>
            <p className="text-slate-400">{lobbyState.message}</p>
          </div>
        );

      case 'connecting':
        return (
          <div className="space-y-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-400 mx-auto"></div>
            <h2 className="text-2xl font-bold text-white">Connecting...</h2>
            <p className="text-slate-400">{lobbyState.message}</p>
          </div>
        );

      case 'game-active':
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-white">Game Active</h2>
            <p className="text-slate-400">{lobbyState.message}</p>
            <Button onClick={() => navigate(0)} className="w-full">
              Refresh Game
            </Button>
          </div>
        );

      case 'room-ready':
        return (
          <div className="space-y-6">
            <div className="space-y-4">
              <h2 className="text-3xl font-bold text-white">Room Lobby</h2>
              <div className="space-y-2">
                <p className="text-2xl font-mono text-pink-400">{roomCode || room?.code}</p>
                <p className="text-slate-400">{lobbyState.message}</p>
                <p className="text-slate-300">Share this code with friends to join!</p>
              </div>
            </div>
            
            <div className="space-y-3">
              <Button onClick={handleStartSession} className="w-full" size="lg">
                Start Game
              </Button>
              <Button 
                variant="outline" 
                onClick={handleLeaveRoom} 
                className="w-full"
              >
                Leave Room
              </Button>
            </div>
          </div>
        );

      default:
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-white">Waiting...</h2>
            <p className="text-slate-400">{lobbyState.message}</p>
            <Button onClick={() => navigate("/join")} className="w-full">
              Back to Join
            </Button>
          </div>
        );
    }
  };

  return (
    <>
      <BackgroundAnimation show={true} />
      <style>{`
        body {
          background: transparent !important;
        }
      `}</style>
      <div className="relative z-10 flex min-h-screen items-center justify-center px-3 py-10 sm:px-4 pb-10">
        <div className="chaos-stack mx-auto flex w-[92vw] max-w-[440px] flex-col gap-4 sm:w-full sm:max-w-[520px] sm:gap-6">
          <Card className="space-y-6 text-center" isDark={true}>
            {renderContent()}
          </Card>
          
          {/* Keep DrinkTank for visual effect (from original LobbyPhase) */}
          <DrinkTank />
        </div>
      </div>
    </>
  );
}
```

**File:** `src/features/team/TeamPage.tsx` (Updated)

**Simplified TeamPage Logic:**
```typescript
// Replace the complex content logic with unified LobbyPhase
let mainContent;

if (endedSession && !session) {
  mainContent = <EndedPhase {...endedPhaseProps} />;
} else if (teamRoom || roomCode) {
  // Use unified LobbyPhase for all pre-game states
  mainContent = (
    <LobbyPhase
      roomCode={roomCode}
      roomId={teamRoom?.roomId}
      sessionId={sessionId}
      sessionSnapshotReady={sessionSnapshotReady}
      session={session}
      onLeaveRoom={() => setTeamRoom(null)}
      onStartSession={() => {
        // Session start logic
        console.log('🚀 Starting session from lobby');
      }}
    />
  );
} else if (session) {
  mainContent = renderGameContent;
} else {
  // Fallback join form
  mainContent = <JoinForm {...joinFormProps} />;
}
```

**File:** `src/features/team/Phases/RoomLobbyPhase.tsx` (Remove)

**Remove RoomLobbyPhase entirely:**
```bash
# Delete the file
rm src/features/team/Phases/RoomLobbyPhase.tsx

# Update exports in index.ts
# Remove RoomLobbyPhase export
```

**File:** `src/features/team/Phases/index.ts` (Updated)

```typescript
export { JoinForm } from './JoinForm';
export { LobbyPhase } from './LobbyPhase'; // Keep unified LobbyPhase
export { AnswerPhase } from './AnswerPhase';
export { VotePhase } from './VotePhase';
export { ResultsPhase } from './ResultsPhase';
export { EndedPhase } from './EndedPhase';
// REMOVE: export { RoomLobbyPhase } from './RoomLobbyPhase';
```

#### Benefits of Lobby Unification:

1. **Simpler Architecture** - One lobby component instead of two
2. **Better UX** - Clear progression: Setup → Ready → Game
3. **Cleaner Code** - Single component handles all pre-game states
4. **Less Confusion** - No room vs lobby distinction
5. **Backward Compatible** - Keeps existing functionality
6. **Better State Management** - Unified state handling

#### Migration Steps:

1. **Create unified LobbyPhase** with combined functionality
2. **Update TeamPage** to use unified LobbyPhase
3. **Remove RoomLobbyPhase** component
4. **Update exports** in phases index
5. **Test all lobby states** - loading, ready, connecting, error
6. **Verify game flow** - lobby → session → game phases

#### Testing Strategy:

**Manual Testing:**
1. ✅ **Lobby state transitions** - Test all states: loading → ready → connecting → game-active
2. ✅ **Room code display** - Verify room code shows correctly in room-ready state
3. ✅ **"Host is setting things up..."** - Verify message appears when no session
4. ✅ **Background music** - Verify lobby music plays in all states
5. ✅ **Leave room functionality** - Test authenticated and unauthenticated scenarios
6. ✅ **Session start** - Test session start with and without authentication
7. ✅ **Error handling** - Test invalid room codes, network errors
8. ✅ **Navigation** - Test back to join functionality
9. ✅ **Visual effects** - Verify DrinkTank component displays correctly

**Automated Testing:**
```typescript
// src/__tests__/unified-lobby-phase.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { LobbyPhase } from '../features/team/Phases/LobbyPhase';

// Mock services
jest.mock('../services/roomService');
jest.mock('../services/roomMembershipService');
jest.mock('../../../shared/hooks', () => ({
  useToast: () => ({
    title: "Test Toast",
    description: "Test Description",
    variant: "success"
  })
}));

test('unified lobby shows "Host is setting things up..." message', async () => {
  render(
    <MemoryRouter initialEntries={['/room/TEST01']}>
      <LobbyPhase 
        roomCode="TEST01"
        roomId="room-123"
        sessionId={null}
        sessionSnapshotReady={false}
        session={null}
      />
    </MemoryRouter>
  );

  await waitFor(() => {
    expect(screen.getByText(/Host is setting things up/)).toBeInTheDocument();
    expect(screen.getByText(/TEST01/)).toBeInTheDocument();
  });
});

test('unified lobby handles room loading state', async () => {
  render(
    <MemoryRouter initialEntries={['/room/LOADING']}>
      <LobbyPhase 
        roomCode="LOADING"
        roomId={undefined}
        sessionId={null}
        sessionSnapshotReady={false}
        session={null}
      />
    </MemoryRouter>
  );

  await waitFor(() => {
    expect(screen.getByText(/Loading room\.\.\./)).toBeInTheDocument();
    expect(screen.getByRole('status')).toBeInTheDocument();
  });
});

test('unified lobby handles error state', async () => {
  render(
    <MemoryRouter initialEntries={['/room/ERROR']}>
      <LobbyPhase 
        roomCode="ERROR"
        roomId={undefined}
        sessionId={null}
        sessionSnapshotReady={false}
        session={null}
      />
    </MemoryRouter>
  );

  await waitFor(() => {
    expect(screen.getByText(/Room Not Found/)).toBeInTheDocument();
    expect(screen.getByText(/Back to Join/)).toBeInTheDocument();
  });
});
```

#### Rollback Strategy:

**If unification causes issues:**
1. **Keep RoomLobbyPhase** - Don't delete the original component
2. **Revert TeamPage** - Restore original RoomLobbyPhase usage
3. **Update exports** - Keep both components exported
4. **Gradual migration** - Use feature flags to switch between components

**Quick rollback commands:**
```typescript
// Step 1: Restore RoomLobbyPhase usage in TeamPage
// Replace unified LobbyPhase with RoomLobbyPhase
mainContent = (
  <RoomLobbyPhase 
    roomCode={roomCode}
    roomId={teamRoom?.roomId} 
    onLeaveRoom={() => setTeamRoom(null)} 
  />
);

// Step 2: Keep both components exported
// In src/features/team/Phases/index.ts:
export { JoinForm } from './JoinForm';
export { LobbyPhase } from './LobbyPhase'; // Original team-based
export { RoomLobbyPhase } from './RoomLobbyPhase'; // Room-based
export { AnswerPhase } from './AnswerPhase';
export { VotePhase } from './VotePhase';
export { ResultsPhase } from './ResultsPhase';
export { EndedPhase } from './EndedPhase';

// Step 3: Add feature flag for component selection
const useUnifiedLobby = process.env.REACT_APP_UNIFIED_LOBBY === 'true';
const LobbyComponent = useUnifiedLobby ? LobbyPhase : RoomLobbyPhase;
```

#### Performance Considerations:

**Bundle Size Impact:**
- **Before:** RoomLobbyPhase (~2KB) + LobbyPhase (~1KB) = ~3KB
- **After:** Unified LobbyPhase (~3KB) = ~3KB
- **Impact:** Neutral - No significant bundle size change

**Runtime Performance:**
- **Before:** Component switching logic + multiple renders
- **After:** Single component with state-based rendering
- **Impact:** Better performance - fewer component mounts/unmounts

**Memory Usage:**
- **Before:** Two components loaded in memory
- **After:** One component loaded in memory
- **Impact:** Reduced memory footprint

**Network Requests:**
- **Before:** RoomLobbyPhase + LobbyPhase both make room requests
- **After:** Single unified component makes room requests
- **Impact:** Fewer duplicate API calls

#### Success Criteria:

- ✅ Single LobbyPhase handles all pre-game states
- ✅ "Host is setting things up..." message when no session
- ✅ Room code display and sharing functionality
- ✅ Session start functionality preserved
- ✅ Leave room functionality preserved
- ✅ Background music and visual effects preserved
- ✅ Error handling for invalid rooms
- ✅ Loading states for room/connection
- ✅ Backward compatibility maintained
- ✅ Comprehensive testing coverage
- ✅ Rollback strategy documented
- ✅ Performance impact assessed
  
  // REMOVED: Complex state management
  // const { teamSession, setTeamSession, clearTeamSession } = useTeamSession();
  // const { teamRoom, setTeamRoom } = useTeamRoom();
  // const teamState = useTeamState(teamSession, teamRoom);
  
  // SIMPLIFIED: Only need form state
  const [joinForm, setJoinForm] = useState({
    code: "",
    playerName: "",
  });
  const [joinErrors, setJoinErrors] = useState({});
  const [isJoining, setIsJoining] = useState(false);
  
  // SIMPLIFIED: Direct join handler
  const handleJoin = useCallback(async (values: { code: string; playerName: string }) => {
    setIsJoining(true);
    setJoinErrors({});
    
    try {
      // Direct room service call
      const roomResponse = await roomService.getRoom({ code: values.code.trim().toUpperCase() });
      
      if (!roomResponse?.room) {
        setJoinErrors({ code: "Room not found" });
        return;
      }
      
      // Join the room
      await roomMembershipService.joinRoom({
        code: values.code,
        playerName: values.playerName,
      });
      
      // Navigate to room
      navigate(`/room/${values.code}`);
      
    } catch (error) {
      setJoinErrors({ code: error.message || "Failed to join room" });
    } finally {
      setIsJoining(false);
    }
  }, [navigate]);
  
  // REST: Simplified form rendering
  return (
    <>
      <BackgroundAnimation show={true} />
      <div className="relative z-10 flex min-h-screen items-center justify-center px-3 py-10 sm:px-4 pb-10">
        <div className="chaos-stack mx-auto flex w-[92vw] max-w-[440px] flex-col gap-4 sm:w-full sm:max-w-[520px] sm:gap-6">
          <JoinForm
            joinForm={joinForm}
            joinErrors={joinErrors}
            isJoining={isJoining}
            handleJoin={handleJoin}
            setJoinForm={setJoinForm}
          />
        </div>
      </div>
    </>
  );
}
```

### Phase 4: Testing & Validation (1 hour)

#### 1. Test Scenarios
- ✅ Join room → Navigate to `/room/ROOMCODE`
- ✅ Direct navigation to `/room/ROOMCODE`
- ✅ Refresh `/room/ROOMCODE` page
- ✅ Invalid room code handling
- ✅ Loading states
- ✅ Error handling

#### 2. Backward Compatibility
- ✅ Existing `/team` route still works
- ✅ Existing bookmarks to `/team` work
- ✅ Gradual migration path

## 🔄 Migration Strategy

### Phase 1: Parallel Routes (Week 1)
- Add `/room/:roomCode` route alongside `/team`
- Update JoinPage to navigate to `/room/ROOMCODE`
- Test new URL-based flow

### Phase 2: Gradual Transition (Week 2)
- Update all internal links to use `/room/ROOMCODE`
- Add user messaging about new URL format
- Monitor usage of both routes

### Phase 3: Deprecate `/team` (Week 3)
- Add redirect from `/team` to `/join`
- Update documentation
- Remove old `/team` route

## 🎯 Benefits Achieved

### ✅ Simplified Architecture
- **Less state management** - No cross-page state persistence
- **Cleaner data flow** - URL → fetch → display
- **Independent pages** - Each page works in isolation

### ✅ Better User Experience
- **Refreshable** - Users can refresh room pages
- **Shareable** - Direct links to specific rooms
- **Bookmarkable** - Save favorite rooms

### ✅ Developer Experience
- **Easier debugging** - Room info visible in URL
- **Better testing** - Each page testable independently
- **Standard patterns** - Uses conventional React Router patterns

## ⚠️ Risk Mitigation

### Potential Issues
- **Breaking existing bookmarks** - Mitigated by keeping `/team` route temporarily
- **Performance impact** - Mitigated by caching room data
- **Error handling complexity** - Mitigated with comprehensive error boundaries

### Rollback Plan
- Keep `/team` route as fallback
- Feature flag for URL-based navigation
- Monitor error rates and user feedback

## 📅 Timeline

- **Day 1**: Phase 1-2 (Routing + TeamPage updates)
- **Day 2**: Phase 3 (JoinPage simplification)  
- **Day 3**: Phase 4 (Testing + validation)
- **Week 2**: User testing + feedback
- **Week 3**: Full migration

## 🎯 Success Metrics

- ✅ Zero redirect loops
- ✅ Room pages refreshable
- ✅ Shareable room URLs work
- ✅ Error rates < 1%
- ✅ Page load times < 2 seconds

---

**This implementation provides a robust, simpler architecture while maintaining backward compatibility and providing better user experience.** 🚀
