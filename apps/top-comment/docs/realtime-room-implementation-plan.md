# Real-Time Room Implementation Plan

## Goal
Convert `RoomPage` from a refresh-dependent component to a real-time, phase-agnostic shell that never reloads.

---

## Phase 1: Foundation (Hooks & Types)

### Task 1.1: Create `useRealtimeSession` Hook
**File:** `src/features/room/hooks/useRealtimeSession.ts`

Create a hook that subscribes to session changes via Supabase Realtime instead of polling.

```typescript
import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabase';
import type { Session } from '../../../shared/types';

export function useRealtimeSession(sessionId: string | null) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!sessionId) {
      setSession(null);
      setIsLoading(false);
      return;
    }

    // Initial fetch
    const fetchSession = async () => {
      const { data } = await supabase
        .from('sessions')
        .select('*')
        .eq('id', sessionId)
        .single();
      setSession(data);
      setIsLoading(false);
    };
    fetchSession();

    // Subscribe to changes
    const channel = supabase
      .channel(`session:${sessionId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'sessions', filter: `id=eq.${sessionId}` },
        (payload) => {
          setSession(payload.new as Session);
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [sessionId]);

  return { session, isLoading };
}
```

**Verification:**
- [ ] Hook returns session data immediately
- [ ] Updates session when `status` changes in database
- [ ] Cleans up subscription on unmount

---

### Task 1.2: Create `useSubmissions` Hook
**File:** `src/features/room/hooks/useSubmissions.ts`

Extract submission tracking from `RoomPageContext`.

```typescript
import { useState, useEffect, useCallback } from 'react';
import type { GamePhase } from '../types';

export function useSubmissions(sessionId: string | null, phase: GamePhase) {
  const [submissions, setSubmissions] = useState({
    answer: false,
    vote: false,
  });

  // Reset when session or phase changes
  useEffect(() => {
    setSubmissions({ answer: false, vote: false });
  }, [sessionId, phase]);

  const markSubmitted = useCallback((type: 'answer' | 'vote') => {
    setSubmissions(prev => ({ ...prev, [type]: true }));
  }, []);

  return { submissions, markSubmitted };
}
```

**Verification:**
- [ ] Resets on phase change
- [ ] Persists across re-renders within same phase
- [ ] Clears on new session

---

## Phase 2: Phase Components Structure

### Task 2.1: Create Phase Directory Structure

```
src/features/room/phases/
├── LobbyPhase/
│   ├── index.tsx
│   └── components/
├── AnswerPhase/
│   ├── index.tsx
│   └── components/
├── VotePhase/
│   ├── index.tsx
│   └── components/
├── ResultsPhase/
│   ├── index.tsx
│   └── components/
└── EndedPhase/
    ├── index.tsx
    └── components/
```

---

### Task 2.2: Extract `LobbyPhase` Component
**File:** `src/features/room/phases/LobbyPhase/index.tsx`

Move the lobby-specific UI from `RoomPageContent`:

```typescript
import type { Session, RoomMembership } from '../../../../shared/types';

interface LobbyPhaseProps {
  session: Session | null;
  memberships: RoomMembership[] | null;
}

export function LobbyPhase({ session, memberships }: LobbyPhaseProps) {
  // Lobby UI from RoomPage lines 100-117 (the phase button for lobby)
  // Plus any lobby-specific logic
  return (
    <div className="w-full mb-8">
      <PhaseCardButton
        phase="lobby"
        hasSubmitted={false}
        onClick={() => {}}
        disabled={true}
        prompt="Waiting for host to start..."
      />
    </div>
  );
}
```

**Note:** Adapt based on actual lobby UI needs. The current `RoomPage` doesn't have much lobby-specific UI—this phase may be minimal.

---

### Task 2.3: Extract `AnswerPhase` Component
**File:** `src/features/room/phases/AnswerPhase/index.tsx`

```typescript
import { useState } from 'react';
import type { Session, RoomMembership } from '../../../../shared/types';
import { PhaseCardButton } from '../../components/PhaseCardButton';
import { AnswerModal } from '../../components/AnswerModal';

interface AnswerPhaseProps {
  session: Session;
  memberships: RoomMembership[] | null;
  hasSubmitted: boolean;
  onSubmit: () => void;
}

export function AnswerPhase({ session, memberships, hasSubmitted, onSubmit }: AnswerPhaseProps) {
  const [showModal, setShowModal] = useState(false);

  return (
    <div className="w-full mb-8">
      <PhaseCardButton
        phase="answer"
        hasSubmitted={hasSubmitted}
        onClick={() => setShowModal(true)}
        disabled={false}
        endsAt={session.endsAt}
        paused={session.paused}
        prompt={session.rounds?.[session.roundIndex || 0]?.groups?.[0]?.prompt || ''}
      />
      
      {showModal && (
        <AnswerModal
          isOpen={true}
          onClose={() => setShowModal(false)}
          sessionId={session.id}
          roundIndex={session.roundIndex || 0}
          prompt={session.rounds?.[session.roundIndex || 0]?.groups?.[0]?.prompt || ''}
          onSubmit={onSubmit}
          endsAt={session.endsAt}
          paused={session.paused}
        />
      )}
    </div>
  );
}
```

---

### Task 2.4: Extract `VotePhase` Component
**File:** `src/features/room/phases/VotePhase/index.tsx`

```typescript
import { useState } from 'react';
import type { Session, RoomMembership } from '../../../../shared/types';
import { PhaseCardButton } from '../../components/PhaseCardButton';
import { VoteModal } from '../../components/VoteModal';

interface VotePhaseProps {
  session: Session;
  memberships: RoomMembership[] | null;
  hasSubmitted: boolean;
  onSubmit: () => void;
}

export function VotePhase({ session, memberships, hasSubmitted, onSubmit }: VotePhaseProps) {
  const [showModal, setShowModal] = useState(false);

  return (
    <div className="w-full mb-8">
      <PhaseCardButton
        phase="vote"
        hasSubmitted={hasSubmitted}
        onClick={() => setShowModal(true)}
        disabled={false}
        endsAt={session.endsAt}
        paused={session.paused}
        prompt={session.rounds?.[session.roundIndex || 0]?.groups?.[0]?.prompt || ''}
      />
      
      {showModal && (
        <VoteModal
          isOpen={true}
          onClose={() => setShowModal(false)}
          sessionId={session.id}
          roundIndex={session.roundIndex || 0}
          onSubmit={onSubmit}
          prompt={session.rounds?.[session.roundIndex || 0]?.groups?.[0]?.prompt || ''}
          endsAt={session.endsAt}
          paused={session.paused}
        />
      )}
    </div>
  );
}
```

---

### Task 2.5: Extract `EndedPhase` Component
**File:** `src/features/room/phases/EndedPhase/index.tsx`

```typescript
import type { Session, RoomMembership } from '../../../../shared/types';
import { PhaseCardButton } from '../../components/PhaseCardButton';

interface EndedPhaseProps {
  session: Session;
  memberships: RoomMembership[] | null;
  onOpenLeaderboard: () => void;
  onOpenSelfie: () => void;
}

export function EndedPhase({ session, memberships, onOpenLeaderboard, onOpenSelfie }: EndedPhaseProps) {
  return (
    <div className="w-full mb-8 space-y-4">
      <PhaseCardButton
        phase="ended"
        hasSubmitted={false}
        onClick={onOpenLeaderboard}
        disabled={false}
        prompt="View Final Results"
      />
      <PhaseCardButton
        phase="ended"
        hasSubmitted={false}
        onClick={onOpenSelfie}
        disabled={false}
        prompt="Take a Selfie"
      />
    </div>
  );
}
```

---

## Phase 3: Create PhaseController

### Task 3.1: Implement `PhaseController` Component
**File:** `src/features/room/components/PhaseController.tsx`

```typescript
import { LobbyPhase } from '../phases/LobbyPhase';
import { AnswerPhase } from '../phases/AnswerPhase';
import { VotePhase } from '../phases/VotePhase';
import { EndedPhase } from '../phases/EndedPhase';
import { getSessionPhase } from '../utils/phaseConfig';
import { useSubmissions } from '../hooks/useSubmissions';
import type { Session, RoomMembership } from '../../../shared/types';

interface PhaseControllerProps {
  session: Session | null;
  memberships: RoomMembership[] | null;
  onOpenLeaderboard: () => void;
  onOpenSelfie: () => void;
}

export function PhaseController({ 
  session, 
  memberships, 
  onOpenLeaderboard, 
  onOpenSelfie 
}: PhaseControllerProps) {
  const phase = getSessionPhase(session);
  const { submissions, markSubmitted } = useSubmissions(session?.id || null, phase);

  switch (phase) {
    case 'lobby':
      return <LobbyPhase session={session} memberships={memberships} />;

    case 'answer':
      if (!session) return null;
      return (
        <AnswerPhase
          session={session}
          memberships={memberships}
          hasSubmitted={submissions.answer}
          onSubmit={() => markSubmitted('answer')}
        />
      );

    case 'vote':
      if (!session) return null;
      return (
        <VotePhase
          session={session}
          memberships={memberships}
          hasSubmitted={submissions.vote}
          onSubmit={() => markSubmitted('vote')}
        />
      );

    case 'results':
      // Results phase can be handled in EndedPhase or as separate component
      return <LobbyPhase session={session} memberships={memberships} />;

    case 'ended':
      if (!session) return null;
      return (
        <EndedPhase
          session={session}
          memberships={memberships}
          onOpenLeaderboard={onOpenLeaderboard}
          onOpenSelfie={onOpenSelfie}
        />
      );

    default:
      return <LobbyPhase session={session} memberships={memberships} />;
  }
}
```

**Verification:**
- [ ] Renders correct phase based on `session.status`
- [ ] Handles null session gracefully
- [ ] Passes submission state to action phases

---

## Phase 4: Refactor RoomPage

### Task 4.1: Update `RoomPage.tsx`
**File:** `src/features/room/components/RoomPage.tsx`

Replace the current implementation with the simplified version:

```typescript
import { lazy, Suspense, useState, useRef, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useRoom } from '../../../hooks/useRoom';
import { RoomPageProvider } from '../context/RoomPageContext';
import { useRealtimeSession } from '../hooks/useRealtimeSession';
import { PhaseController } from './PhaseController';
import { useAuth } from '../../../shared/providers/AuthContext';
import { VIBoxJukebox } from '../../../shared/components/vibox/VIBoxJukebox';
import { BackgroundAnimation } from '../../../components/BackgroundAnimation';
import { DrinkTank } from '../../../components/DrinkTank';

// Lazy load ended modals
const LeaderboardModal = lazy(() => import('./LeaderboardModal.tsx'));
const SelfieModal = lazy(() => import('./SelfieModal.tsx'));

function RoomPageContent() {
  const { room, memberships, session, sessionId, handleLeaveRoom } = useRoomPage();
  const { user, isGuest, signOut } = useAuth();
  const navigate = useNavigate();
  
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const [showVIBox, setShowVIBox] = useState(false);
  const [endedModals, setEndedModals] = useState<('leaderboard' | 'selfie')[]>([]);
  const accountMenuRef = useRef<HTMLDivElement>(null);

  // Close ended modals when leaving ended phase
  useEffect(() => {
    if (session?.status !== 'ended') {
      setEndedModals([]);
    }
  }, [session?.status]);

  const openEndedModal = useCallback((modal: 'leaderboard' | 'selfie') => {
    setEndedModals(prev => [...prev, modal]);
  }, []);

  const closeEndedModal = useCallback((modal: 'leaderboard' | 'selfie') => {
    setEndedModals(prev => prev.filter(m => m !== modal));
  }, []);

  const handleSignOut = useCallback(async () => {
    if (!signOut) return;
    try {
      await signOut();
      setShowAccountMenu(false);
      navigate('/');
    } catch (error) {
      console.error('Sign out failed:', error);
    }
  }, [signOut, navigate]);

  // Close account menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (accountMenuRef.current && !accountMenuRef.current.contains(event.target as Node)) {
        setShowAccountMenu(false);
      }
    };

    if (showAccountMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showAccountMenu]);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-slate-900 to-slate-800 text-white">
      <BackgroundAnimation show={true} />
      
      {/* Header - Hidden on mobile */}
      <header className="hidden sm:flex items-center justify-between p-4 border-b border-slate-700/50">
        <h1 className="text-3xl font-black tracking-tight">{room?.code}</h1>
        <button
          onClick={handleLeaveRoom}
          className="px-3 py-1.5 text-xs font-medium bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors text-slate-300"
        >
          Leave
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center p-4 pt-4 sm:pt-4 pb-28 sm:pb-4 max-w-2xl mx-auto w-full">
        {/* Phase Controller - handles all phase rendering */}
        <PhaseController
          session={session}
          memberships={memberships}
          onOpenLeaderboard={() => openEndedModal('leaderboard')}
          onOpenSelfie={() => openEndedModal('selfie')}
        />

        {/* Drink Tank */}
        <DrinkTank roomMemberships={memberships || []} />
      </main>

      {/* Bottom Navigation Bar - Mobile only */}
      <nav className="chaos-bottom-nav sm:hidden">
        {/* ... keep existing nav buttons ... */}
      </nav>

      {/* Ended Modals */}
      <Suspense fallback={null}>
        {endedModals.includes('leaderboard') && (
          <LeaderboardModal
            isOpen={true}
            onClose={() => closeEndedModal('leaderboard')}
            // ... props
          />
        )}
        {endedModals.includes('selfie') && (
          <SelfieModal
            isOpen={true}
            onClose={() => closeEndedModal('selfie')}
            // ... props
          />
        )}
      </Suspense>

      {/* VIBox Modal */}
      <VIBoxJukebox
        isOpen={showVIBox}
        onClose={() => setShowVIBox(false)}
        toast={(options) => console.log('Toast:', options)}
        mode="team"
      />
    </div>
  );
}

export function RoomPage() {
  const { roomCode } = useParams<{ roomCode: string }>();
  const [sessionId, setSessionId] = useState<string | null>(null);
  
  const { room, memberships, isLoading: roomLoading, error: roomError } = useRoom({
    roomCode,
    autoRefresh: false,
  });

  const { session, isLoading: sessionLoading } = useRealtimeSession(sessionId || null);

  // Get sessionId from room when it updates
  useEffect(() => {
    if (room?.currentSessionId && room.currentSessionId !== sessionId) {
      setSessionId(room.currentSessionId);
    }
  }, [room?.currentSessionId, sessionId]);

  if (roomLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
        <div className="animate-pulse">Loading room...</div>
      </div>
    );
  }

  if (roomError || !room) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Room Not Found</h1>
          <p className="text-slate-400">The room code "{roomCode}" doesn't exist.</p>
        </div>
      </div>
    );
  }

  return (
    <RoomPageProvider
      room={room}
      memberships={memberships}
      session={session}
      sessionId={sessionId}
    >
      <RoomPageContent />
    </RoomPageProvider>
  );
}
```

---

## Phase 5: Update RoomPageContext

### Task 5.1: Simplify `RoomPageContext`
**File:** `src/features/room/context/RoomPageContext.tsx`

Remove phase-related state (submission tracking, modal state for phases). Keep only:
- `room`
- `memberships`
- `session`
- `sessionId`

Submission tracking moves to `useSubmissions` hook within each phase.

---

## Phase 6: Testing

### Task 6.1: Test Session Creation
- [ ] Create new session → RoomPage updates without refresh
- [ ] Phase changes from `lobby` → `answer` automatically

### Task 6.2: Test Phase Transitions
- [ ] `answer` → `vote` transition is smooth
- [ ] `vote` → `results` transition works
- [ ] `results` → `ended` transition works

### Task 6.3: Test Session End
- [ ] Close session → RoomPage returns to `lobby` state without refresh
- [ ] Create new session after closing → works correctly

### Task 6.4: Test Submission Persistence
- [ ] Submit answer in `answer` phase
- [ ] Refresh page → submission state resets (expected)
- [ ] Phase changes → submission state resets (expected)

---

## Dependencies

- Supabase Realtime must be enabled for `sessions` table
- Row Level Policies must allow users to subscribe to their session

---

## Files to Modify/Created

| Action | File |
|--------|------|
| Create | `src/features/room/hooks/useRealtimeSession.ts` |
| Create | `src/features/room/hooks/useSubmissions.ts` |
| Create | `src/features/room/phases/LobbyPhase/index.tsx` |
| Create | `src/features/room/phases/AnswerPhase/index.tsx` |
| Create | `src/features/room/phases/VotePhase/index.tsx` |
| Create | `src/features/room/phases/EndedPhase/index.tsx` |
| Create | `src/features/room/components/PhaseController.tsx` |
| Modify | `src/features/room/components/RoomPage.tsx` |
| Modify | `src/features/room/context/RoomPageContext.tsx` |

---

## Success Criteria

1. **No page refreshes** during any session lifecycle (create, phase change, close)
2. **Phase transitions** are smooth and automatic
3. **Submission state** resets on phase change, persists within phase
4. **All existing functionality** preserved (modals, VIBox, navigation, etc.)
