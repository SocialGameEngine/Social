# Phase 3: HostPage.tsx Component Decomposition — Implementation Plan

**File:** `apps/top-comment/src/features/host/HostPage.tsx` (2,122 lines → target ~200 lines)
**Date:** April 2026
**Executor:** Claude Sonnet (or equivalent)

---

## Table of Contents

1. [Current File Anatomy](#1-current-file-anatomy)
2. [Target Architecture](#2-target-architecture)
3. [Dependency Graph](#3-dependency-graph)
4. [Extraction Order & Steps](#4-extraction-order--steps)
5. [Validation Checkpoints](#5-validation-checkpoints)
6. [Rules & Constraints](#6-rules--constraints)

---

## 1. Current File Anatomy

### Line Ranges (approximate, verify before editing)

| Section | Lines | Description |
|---------|-------|-------------|
| Imports | 1–58 | 58 import statements |
| Auth + bootstrap state | 60–189 | `useAuth`, `useVenueAccountResolver`, hook destructuring, room recovery |
| Game state hooks | 190–250 | `useGameState`, `useRoomV2`, Sociale queries, session players |
| Sync effects | 244–269 | 4 `useEffect` calls syncing sessionId, roomCode, socialeId |
| Account button handlers | 271–309 | `handlePlayerSignIn`, `handleVenueSignIn`, `handleSignOut`, click-outside |
| Computed values | 311–360 | `roomLobbyMembers`, `lobbyTeams`, `lobbyPlayerCount`, `hostMembership`, audience submissions |
| Room/Sociale modal handlers | 361–434 | `handleRoomCreateSuccess`, `requireVenueAccount`, `handleOpenSocialeSettings`, `handleCreateNewSession`, `handleOpenCreateModal`, `handleOpenSocialeModal` |
| Bootstrap effects | 427–486 | Clear on signout, venue account load, auto-open create modal, sessionRef sync |
| Helper + computed game state | 488–546 | `triggerPerformingAction`, `roundGroups`, `activeGroup`, `voteCounts`, `activeGroupAnswers`, `useHostComputations`, `playerLookup`, `roundSummaries` |
| Handler instantiation | 548–683 | 10 handler factory calls (create/update/primary/sociale/end/kick/ban/copy/pause/leave) |
| More handlers | 685–908 | `handlePauseToggle`, `handleLeaveSession`, `handlePromptLibrarySelect`, `hostVoteHandler`, `handlePrimaryClick`, keyboard shortcuts, `handleOpenEditModal`, `handleCreateModalClose`, URL params, `handleJoinSession`, `handleJoinSociale` |
| Inline JSX fragments | 910–1088 | `promptLibraryCard`, `sessionControlButtons`, `activePhaseSessionControls`, `lobbyControls` |
| Render helper functions | 1092–1311 | `renderSocialesPanel`, `renderHostInteractionsPanel`, `renderHostMainStack`, `renderPhaseContent` (the big switch) |
| Command palette setup | 1313–1416 | `presenterButton`, `useSessionMachine`, `useCommandPalette`, `useSessionTimer`, commands memo |
| `mainContent` JSX | 1418–2029 | Account button dropdown (1422–1586), header card (1588–1662), grid layout (1664–1816), all modals (1819–2024) |
| Return statement | 2031–2121 | `HostPanelV2` wrapper with duplicated account button, `CommandPalette` |

### Key Observations

- **Duplicate account button**: The account button + dropdown is rendered TWICE (lines 1422–1586 inside `mainContent`, and again lines 2056–2097 inside the return). Only the return version is actually displayed.
- **17+ modal state variables** scattered across `useHostState` and local `useState` calls.
- **10 handler factory instantiations** that could be grouped into a custom hook.
- **`renderPhaseContent`** (lines 1125–1311) is 186 lines — the core layout switch.
- **Inline JSX fragments** (`promptLibraryCard`, `sessionControlButtons`, etc.) should be proper components.

---

## 2. Target Architecture

```
HostPage.tsx (~200 lines)
├── hooks/
│   ├── useHostState.ts              (EXISTS - 78 lines, manages session-related state)
│   ├── useHostModalState.ts         (NEW - consolidate all modal boolean states)
│   ├── useHostHandlers.ts           (NEW - consolidate all handler factory instantiations)
│   ├── useHostBootstrap.ts          (NEW - auth/venue/room bootstrap + sync effects)
│   └── useHostGameData.ts           (NEW - game state, players, computed values)
│
├── components/
│   ├── HostAccountMenu.tsx          (NEW - account button + dropdown)
│   ├── HostHeaderCard.tsx           (NEW - title, phase copy, nav buttons)
│   ├── HostVenueLoginPrompt.tsx     (NEW - venue login required card)
│   ├── HostPhaseContent.tsx         (NEW - the renderPhaseContent switch)
│   ├── HostSidePanel.tsx            (NEW - QR code, members list, audience questions)
│   ├── HostModalsContainer.tsx      (NEW - all 12 modals)
│   ├── HostControlButtons.tsx       (NEW - session/lobby/active phase control buttons)
│   ├── HostPromptLibraryCard.tsx    (NEW - prompt library display card)
│   └── (existing components unchanged)
```

---

## 3. Dependency Graph

### What each extraction needs from HostPage:

```
useHostModalState         ← no deps (pure state)
useHostBootstrap          ← useAuth, useVenueAccountResolver, useHostSessionV2, useHostRoomV2, useHostRoomRecovery
useHostGameData           ← sessionId, storedRoomId, user, useGameState, useRoomV2, useSociale, useSocialites
useHostHandlers           ← everything above + toast, queryClient, navigate

HostAccountMenu           ← user, isAnonymous, isVenueAccount, showAccountMenu, handlers
HostHeaderCard            ← room, session, storedRoomId, storedRoomCode, isDark, nav handlers
HostVenueLoginPrompt      ← canCreateSession, venueAccountLoading, isDark
HostControlButtons        ← session, activeSociale, handlers, loading states
HostPromptLibraryCard     ← session, currentPromptLibrary, isDark, handlers
HostPhaseContent          ← session, activeSociale, storedRoomId, all phase props
HostSidePanel             ← inviteLink, roomJoinCode, roomLobbyMembers, submissions, isDark
HostModalsContainer       ← all modal states + handlers + domain objects
```

### Extraction Order (least dependencies first):

```
Step 1: useHostModalState        (pure state, zero risk)
Step 2: HostAccountMenu          (self-contained UI, remove duplicate)
Step 3: HostPromptLibraryCard    (inline JSX → component)
Step 4: HostControlButtons       (inline JSX → component)
Step 5: HostSidePanel            (aside section extraction)
Step 6: HostHeaderCard           (header card extraction)
Step 7: HostVenueLoginPrompt     (simple conditional card)
Step 8: HostModalsContainer      (all 12 modals → single component)
Step 9: HostPhaseContent         (renderPhaseContent → component)
Step 10: useHostBootstrap        (auth + sync effects → hook)
Step 11: useHostGameData         (game state + computed values → hook)
Step 12: useHostHandlers         (all handler instantiations → hook)
Step 13: Final HostPage cleanup  (wire everything together)
```

---

## 4. Extraction Order & Steps

### Step 1: `useHostModalState` hook

**Create:** `hooks/useHostModalState.ts`
**Lines removed from HostPage:** ~71–83, ~121–127

Extract these modal-related `useState` calls that are currently scattered in HostPage (NOT in useHostState):

```typescript
// From HostPage lines 71-83:
const [showAccountMenu, setShowAccountMenu] = useState(false);
const [showPlayerAuthModal, setShowPlayerAuthModal] = useState(false);
const [showVenueAuthModal, setShowVenueAuthModal] = useState(false);
const [, setVenueRoomCreated] = useState<string | null>(null);
const accountMenuRef = useRef<HTMLDivElement>(null);
type HostRoomModalMode = null | "create" | "settings";
const [roomModalMode, setRoomModalMode] = useState<HostRoomModalMode>(null);
const [activeSocialeId, setActiveSocialeId] = useState<string | null>(null);
const [showSocialeModal, setShowSocialeModal] = useState(false);

// From HostPage lines 121-127:
const [showBannedPlayersModal, setShowBannedPlayersModal] = useState(false);
const [showVIBoxModal, setShowVIBoxModal] = useState(false);
const [showVenueAuthPrompt, setShowVenueAuthPrompt] = useState(false);
const [showJoinModal, setShowJoinModal] = useState(false);
const [isJoiningSession, setIsJoiningSession] = useState(false);
const [showJoinSocialeModal, setShowJoinSocialeModal] = useState(false);
const [isJoiningSociale, setIsJoiningSociale] = useState(false);

// From HostPage line 1341:
const [isRoomMembersOpen, setIsRoomMembersOpen] = useState(false);
```

Also include the backward-compat wrapper (lines 86-91):
```typescript
const showRoomCreateModal = roomModalMode !== null;
const setShowRoomCreateModal = (show: boolean) => {
  setRoomModalMode(show ? "create" : null);
};
```

**Return type:** Object with all state + setters + computed `showRoomCreateModal` + `setShowRoomCreateModal`.

**Validation:** HostPage compiles with `useHostModalState()` replacing scattered useState calls.

---

### Step 2: `HostAccountMenu` component

**Create:** `components/HostAccountMenu.tsx`
**Lines removed from HostPage:** ~1422–1586 (the UNUSED `mainContent` version), ~2054–2099 (the USED version in return)
**Lines removed:** also ~271–309 (account button handlers + click-outside effect)

**Props interface:**
```typescript
interface HostAccountMenuProps {
  user: User | null;
  isAnonymous: boolean;
  isVenueAccount: boolean;
  showAccountMenu: boolean;
  setShowAccountMenu: (show: boolean) => void;
  onPlayerSignIn: () => void;
  onVenueSignIn: () => void;
  onSignOut: () => void;
  accountMenuRef: React.RefObject<HTMLDivElement>;
}
```

**CRITICAL:** Remove the duplicate in `mainContent` (lines 1422–1586). Only keep the version inside the return statement (lines 2054–2099), extracted to this component.

Move the click-outside `useEffect` (lines 298–309) INTO this component.

Move `handlePlayerSignIn`, `handleVenueSignIn`, `handleSignOut` (lines 272–295) into the component or pass as props from a handler hook.

**Validation:** Account button renders once, dropdown works, sign-in/sign-out functional.

---

### Step 3: `HostPromptLibraryCard` component

**Create:** `components/HostPromptLibraryCard.tsx`
**Lines removed from HostPage:** ~910–981

Extract the `promptLibraryCard` inline JSX variable.

**Props interface:**
```typescript
interface HostPromptLibraryCardProps {
  session: Session;
  currentPromptLibrary: PromptLibrary | null;
  selectedPromptLibraryId: PromptLibraryId;
  isUpdatingPromptLibrary: boolean;
  isDark: boolean;
  onChangePrompts: () => void;    // () => setShowPromptLibraryModal(true)
  onEditLibraries: () => void;     // handleOpenEditModal
}
```

**Validation:** Prompt library card renders identically in lobby phase.

---

### Step 4: `HostControlButtons` component

**Create:** `components/HostControlButtons.tsx`
**Lines removed from HostPage:** ~983–1088

Extract `sessionControlButtons`, `activePhaseSessionControls`, and `lobbyControls` into a single component that switches based on session status and activeSociale.

**Props interface:**
```typescript
interface HostControlButtonsProps {
  session: Session | null;
  activeSociale: Sociale | null;
  storedRoomId: string | null;
  isPerformingAction: boolean;
  isPausingSession: boolean;
  isEndingSession: boolean;
  isUpdatingSession: boolean;
  isDark: boolean;
  onPrimaryClick: () => void;
  onPauseToggle: () => void;
  onEndSession: () => void;
  onCreateNewSession: () => void;
  onOpenEditModal: () => void;
  onJoinModal: () => void;
  onLeaveSession: () => void;
  onOpenSocialeModal: () => void;
  onJoinSocialeModal: () => void;
}
```

Internally, the component decides which button set to show based on:
- No session + no sociale + has room → lobby controls
- Session lobby or ended → session control buttons
- Session answer/vote/results → active phase controls

**Validation:** All button sets render correctly for each phase. Click handlers fire.

---

### Step 5: `HostSidePanel` component

**Create:** `components/HostSidePanel.tsx`
**Lines removed from HostPage:** ~1669–1815

Extract the entire `<aside>` section containing:
- QR code block + shareable link
- Room Members list (collapsible)
- Audience Questions panel

**Props interface:**
```typescript
interface HostSidePanelProps {
  inviteLink: string;
  roomJoinCode: string;
  isDark: boolean;
  storedRoomId: string | null;
  session: Session | null;
  room: Room | null;
  roomLobbyMembers: RoomMembership[];
  isRoomMembersOpen: boolean;
  setIsRoomMembersOpen: (open: boolean) => void;
  kickingPlayerId: string | null;
  banningPlayerId: string | null;
  onKickPlayer: (memberId: string, userId: string, roomId: string) => void;
  onBanPlayer: (memberId: string, userId: string, roomId: string) => void;
  onShowBannedPlayers: () => void;
  onCopyLink: (link: string) => void;
  // Audience submissions
  allSubmissions: AudienceSubmission[];
  pendingSubmissionCount: number;
  onApproveSubmission: (id: string) => Promise<void>;
  onRejectSubmission: (id: string) => Promise<void>;
}
```

**Validation:** QR code displays, member list toggles, kick/ban buttons work, audience submissions panel renders.

---

### Step 6: `HostHeaderCard` component

**Create:** `components/HostHeaderCard.tsx`
**Lines removed from HostPage:** ~1588–1643

Extract the header `<Card>` with room name, phase copy, and navigation buttons.

**Props interface:**
```typescript
interface HostHeaderCardProps {
  room: Room | null;
  session: Session | null;
  storedRoomId: string | null;
  storedRoomCode: string | null;
  user: User | null;
  isDark: boolean;
  presenterButton: React.ReactNode;
  onNavigateAnalytics: () => void;
  onOpenRoomSettings: () => void;
  onOpenVIBox: () => void;
}
```

**Validation:** Header displays room name, phase status, nav buttons functional.

---

### Step 7: `HostVenueLoginPrompt` component

**Create:** `components/HostVenueLoginPrompt.tsx`
**Lines removed from HostPage:** ~1645–1662

Simplest extraction — the "Venue login required" card.

**Props interface:**
```typescript
interface HostVenueLoginPromptProps {
  show: boolean;  // !session && !venueAccountLoading && !canCreateSession
  isDark: boolean;
  onOpenVenueLogin: () => void;
}
```

**Validation:** Shows only when venue login is required.

---

### Step 8: `HostModalsContainer` component

**Create:** `components/HostModalsContainer.tsx`
**Lines removed from HostPage:** ~1819–2024

Extract ALL 12 modals into a single container:
1. `CreateRoomModal` (line 1819)
2. `SocialeCreateModal` (line 1826)
3. `CreateSessionModal` — create mode (line 1859)
4. `CreateSessionModal` — edit mode (line 1869)
5. `JoinSessionModal` (line 1881)
6. `JoinSocialeModal` (line 1887)
7. `PromptLibraryModal` (line 1894)
8. `EndSessionModal` (line 1923)
9. `BannedPlayersManager` (line 1953)
10. `VIBoxJukebox` (line 1960)
11. `VenueAuthPromptModal` (line 1970)
12. `PlayerAuthModal` + `VenueAuthModal` (lines 1997–2008)
13. `VenueRoomChecker` (line 2011)

**Props interface:**
```typescript
interface HostModalsContainerProps {
  // Modal visibility states (from useHostModalState)
  modalState: ReturnType<typeof useHostModalState>;
  // Domain objects
  room: Room | null;
  session: Session | null;
  settingsSociale: Sociale | null;
  storedRoomId: string | null;
  storedRoomCode: string | null;
  isDark: boolean;
  // Session form state (from useHostState)
  createForm: CreateForm;
  setCreateForm: (form: CreateForm) => void;
  createErrors: Record<string, string>;
  isCreating: boolean;
  isUpdatingSession: boolean;
  canCreateSession: boolean;
  isEndingSession: boolean;
  selectedPromptLibraryId: PromptLibraryId;
  isUpdatingPromptLibrary: boolean;
  roomMemberships: RoomMembership[];
  // Handlers
  onRoomCreateSuccess: (room: Room) => void;
  onCreateSession: () => void;
  onUpdateSession: () => void;
  onJoinSession: (id: string) => void;
  onJoinSociale: (id: string) => void;
  onConfirmEndSession: () => void;
  onPromptLibrarySelect: (id: PromptLibraryId) => void;
  onCreateSociale: (request: CreateSocialeRequest) => Promise<void>;
  onUpdateSociale: (updates: UpdateSocialePayload) => Promise<void>;
  onNavigateVenueAuth: () => void;
  onVenueRoomCreated: (code: string) => void;
  toast: Toast;
}
```

**Validation:** All 12 modals open/close correctly, form submissions work, no broken references.

---

### Step 9: `HostPhaseContent` component

**Create:** `components/HostPhaseContent.tsx`
**Lines removed from HostPage:** ~1092–1311 (renderSocialesPanel, renderHostInteractionsPanel, renderHostMainStack, renderPhaseContent)

This is the core layout logic — the `switch(session.status)` that renders different phase views.

**Props interface:**
```typescript
interface HostPhaseContentProps {
  session: Session | null;
  sessionId: string | null;
  activeSociale: Sociale | null;
  primarySocialeId: string | null;
  storedRoomId: string | null;
  isDark: boolean;
  room: Room | null;
  roomMemberships: RoomMembership[];
  user: User | null;
  // Controls
  sessionControls: React.ReactNode;     // from HostControlButtons
  promptLibraryContent: React.ReactNode; // from HostPromptLibraryCard
  lobbyControls: React.ReactNode;
  activePhaseControls: React.ReactNode;
  // Phase data
  roundGroups: RoundGroup[];
  totalGroups: number;
  activeGroupIndex: number;
  activeGroup: Group | null;
  activeGroupAnswers: Answer[];
  voteCounts: VoteCounts;
  activeGroupVote: string | null;
  leaderboard: LeaderboardEntry[];
  analytics: SessionAnalytics | null;
  roundSummaries: RoundSummary[];
  playerLookup: Record<string, string>;
  gameState: GameState;
  // Handlers
  onHostVote: (answerId: string) => void;
  isSubmittingVote: boolean;
  onCopyLink: (link: string) => void;
  roomJoinCode: string;
  inviteLink: string;
  // Audience submissions
  pendingSubmissionCount: number;
  allSubmissions: AudienceSubmission[];
  onApproveSubmission: (id: string) => Promise<void>;
  onRejectSubmission: (id: string) => Promise<void>;
  // Sociale panel props
  onSocialeChange: (id: string | null) => void;
  onOpenSocialeSettings: () => void;
  onOpenLoadSociale: () => void;
}
```

**Validation:** All 6 phase views render correctly (loading, no-session, lobby, answer, vote, results, ended).

---

### Step 10: `useHostBootstrap` hook

**Create:** `hooks/useHostBootstrap.ts`
**Lines removed from HostPage:** ~60–68, ~93–120, ~172–188, ~244–269, ~427–486

Consolidates:
- Auth + venue account resolution
- `useHostSessionV2` / `useHostRoomV2` destructuring with conditional values
- Room recovery hook
- Bootstrap completion derivation
- All sync effects (sessionId, roomCode, socialeId, signout cleanup, venue load, auto-open modal, sessionRef)

**Return type:**
```typescript
interface HostBootstrapResult {
  user: User | null;
  authLoading: boolean;
  isAnonymous: boolean;
  signOut: () => Promise<void>;
  isVenueAccount: boolean;
  venueAccountLoading: boolean;
  isDark: boolean;
  // Stored IDs (conditionally applied)
  storedSessionId: string | null;
  storedCode: string | null;
  storedRoomId: string | null;
  storedRoomCode: string | null;
  // Setters
  setHostSession: (data: { sessionId: string; code: string }) => void;
  clearHostSession: () => void;
  setHostRoom: (data: { roomId: string; code: string }) => void;
  // Bootstrap
  isBootstrapComplete: boolean;
  canCreateSession: boolean;
  roomRecovery: RoomRecoveryState;
}
```

**Validation:** Auth flow works, room recovery fires correctly, auto-open modal logic preserved.

---

### Step 11: `useHostGameData` hook

**Create:** `hooks/useHostGameData.ts`
**Lines removed from HostPage:** ~192–360, ~494–546

Consolidates:
- `useSessionOrchestrator`
- `useGameState`
- `useRoomV2`
- Sociale queries (`useSociale`, `useSocialesByRoom`, `useCreateSociale`, `useUpdateSociale`)
- `useSessionPlayers`
- `useSocialites`
- `useAudienceSubmissions`
- All `useMemo` computed values (roomJoinCode, inviteLink, roomLobbyMembers, lobbyTeams, hostMembership)
- Game state extractions (roundGroups, activeGroup, voteCounts, etc.)
- `useHostComputations`
- `usePlayerLookup`
- `transformRoundSummariesForUI`

**Return type:**
```typescript
interface HostGameDataResult {
  // Room
  room: Room | null;
  roomMemberships: RoomMembership[];
  roomLobbyMembers: RoomMembership[];
  refreshMembers: () => void;
  // Session
  session: Session | null;
  sessionPlayers: SessionPlayer[];
  // Sociale
  activeSocialeQuery: UseQueryResult<Sociale>;
  socialsByRoomQuery: UseQueryResult<Sociale[]>;
  createSociale: UseMutationResult;
  updateSociale: UseMutationResult;
  socialites: Socialite[];
  activeSociale: Sociale | null;
  primarySocialeId: string | null;
  // Players
  lobbyTeams: (Socialite | SessionPlayer | RoomMembership | Player)[];
  lobbyPlayerCount: number;
  playerLookup: Record<string, string>;
  // Game state
  gameState: GameState;
  roundGroups: RoundGroup[];
  totalGroups: number;
  activeGroup: Group | null;
  activeGroupIndex: number;
  voteCounts: VoteCounts;
  activeGroupAnswers: Answer[];
  roundSummaries: RoundSummary[];
  // Computations
  leaderboard: LeaderboardEntry[];
  selectedPromptLibraryId: PromptLibraryId;
  currentPromptLibrary: PromptLibrary | null;
  activeGroupVote: string | null;
  // Links
  roomJoinCode: string;
  inviteLink: string;
  // Submissions
  allSubmissions: AudienceSubmission[];
  pendingSubmissionCount: number;
  approveSubmission: (id: string) => Promise<void>;
  rejectSubmission: (id: string) => Promise<void>;
  hostMembership: RoomMembership | undefined;
  // Orchestrator
  orchestrator: SessionOrchestrator;
}
```

**Validation:** All data flows correctly, realtime updates work, computed values match previous behavior.

---

### Step 12: `useHostHandlers` hook

**Create:** `hooks/useHostHandlers.ts`
**Lines removed from HostPage:** ~361–908

Consolidates ALL handler instantiations and callback definitions:
- `requireVenueAccount`
- `handleRoomCreateSuccess`
- `handleOpenSocialeSettings`, `handleCreateNewSession`, `handleOpenCreateModal`, `handleOpenSocialeModal`
- `triggerPerformingAction`
- All 10 handler factory calls (create/update/primary/sociale/end/kick/ban/copy/pause/leave)
- `handlePauseToggle`, `handleLeaveSession`, `handlePromptLibrarySelect`
- `handlePrimaryClick`, `handleOpenEditModal`, `handleCreateModalClose`
- `handleJoinSession`, `handleJoinSociale`
- `handleEndSocialeClick`, `showEndSessionModalHandler`
- Keyboard shortcuts setup

**Parameters:** Receives bootstrap, game data, host state, and modal state as arguments.

**Return type:**
```typescript
interface HostHandlersResult {
  // Primary actions
  handlePrimaryClick: () => void;
  handlePauseToggle: () => Promise<void>;
  handleEndSession: () => void;           // showEndSessionModalHandler
  confirmEndSessionHandler: () => void;
  // Create/edit
  handleCreateNewSession: () => void;
  handleOpenCreateModal: () => void;
  handleOpenEditModal: () => void;
  handleCreateModalClose: () => void;
  handleOpenSocialeModal: () => void;
  handleOpenSocialeSettings: () => void;
  // Join
  handleJoinSession: (id: string) => Promise<void>;
  handleJoinSociale: (id: string) => Promise<void>;
  // Room
  handleRoomCreateSuccess: (room: Room) => void;
  requireVenueAccount: () => boolean;
  // Players
  roomKickPlayerHandler: (memberId: string, userId: string, roomId: string) => void;
  roomBanPlayerHandler: (memberId: string, userId: string, roomId: string) => void;
  // Session
  handleLeaveSession: () => void;
  handlePromptLibrarySelect: (id: PromptLibraryId) => Promise<void>;
  hostVoteHandler: (answerId: string) => void;
  copyLinkHandler: (link: string) => void;
  // Sociale
  handleEndSocialeClick: () => Promise<void>;
  onCreateSociale: (request: CreateSocialeRequest) => Promise<void>;
  onUpdateSociale: (updates: UpdateSocialePayload) => Promise<void>;
  // Venue
  onVenueRoomCreated: (code: string) => void;
}
```

**Validation:** All user interactions produce correct results. Handler callbacks reference current state.

---

### Step 13: Final HostPage Cleanup

After all extractions, HostPage.tsx should be ~150–200 lines:

```typescript
export function HostPage() {
  const { toast } = useToast();
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // State hooks
  const modalState = useHostModalState();
  const hostState = useHostState(/* storedSessionId */);

  // Bootstrap (auth, venue, room recovery, sync effects)
  const bootstrap = useHostBootstrap(modalState, hostState);

  // Game data (session, room, sociale, players, computed values)
  const gameData = useHostGameData(bootstrap, hostState, modalState);

  // All handlers
  const handlers = useHostHandlers({
    bootstrap, gameData, hostState, modalState,
    toast, navigate, queryClient, isDark,
  });

  // Session machine + command palette
  const sessionMachine = useSessionMachine(gameData.session, gameData.roomMemberships.length);
  const commandPalette = useCommandPalette();
  const commands = useMemo(() => [...], [/* deps */]);

  return (
    <>
      <HostPanelV2 {...panelProps}>
        <HostAccountMenu {...accountMenuProps} />
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
          <HostHeaderCard {...headerProps} />
          <HostVenueLoginPrompt {...loginPromptProps} />
          <section className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,_2fr)_minmax(0,_1fr)]">
            <HostPhaseContent {...phaseContentProps} />
            <HostSidePanel {...sidePanelProps} />
          </section>
        </div>
        <HostModalsContainer {...modalProps} />
      </HostPanelV2>
      <CommandPalette {...commandPaletteProps} />
    </>
  );
}
```

---

## 5. Validation Checkpoints

After each step, verify:

| Check | How |
|-------|-----|
| **TypeScript compiles** | `pnpm --filter top-comment exec tsc --noEmit` |
| **No runtime errors** | Start dev server, navigate to `/host` |
| **Visual parity** | Compare screenshots before/after |
| **Modals work** | Open/close each modal, verify form submission |
| **Realtime updates** | Verify player joins, phase changes update UI |
| **Auth flow** | Sign in/out, venue account detection |
| **Room creation** | Create room modal auto-opens for new venues |
| **Sociale flow** | Create, load, end Sociale |
| **Session flow** | Create, advance phases, end session |
| **Kick/ban** | Kick and ban players from member list |

### Recommended commit points:

1. After Step 1 (useHostModalState) — "Extract modal state to useHostModalState hook"
2. After Steps 2-4 (small UI components) — "Extract HostAccountMenu, HostPromptLibraryCard, HostControlButtons"
3. After Steps 5-7 (layout components) — "Extract HostSidePanel, HostHeaderCard, HostVenueLoginPrompt"
4. After Step 8 (modals) — "Extract HostModalsContainer with all 12 modals"
5. After Step 9 (phase content) — "Extract HostPhaseContent with phase switch"
6. After Steps 10-12 (hooks) — "Extract useHostBootstrap, useHostGameData, useHostHandlers"
7. After Step 13 (cleanup) — "Final HostPage cleanup — 2122 lines → ~200 lines"

---

## 6. Rules & Constraints

### MUST follow:
- **pnpm only** — never npm or yarn
- **No teams** — architecture is ROOMS → MEMBERSHIPS only
- **PowerShell** — never use `&&` for command chaining
- **Preserve all existing functionality** — this is a refactor, not a rewrite
- **No new dependencies** — only reorganize existing code
- **Keep existing comments/docs** — move them with the code
- **Preserve type safety** — do not introduce new `any` types
- **One step at a time** — verify TypeScript compiles after each step before proceeding

### MUST NOT:
- Change any external API contracts or prop interfaces of existing components
- Modify files outside `features/host/` unless absolutely necessary for imports
- Delete the `mainContent` variable's duplicate account button code (Step 2 handles this)
- Change handler behavior — only move handler code, never alter logic
- Skip validation checkpoints

### Import path convention:
- New hooks: `./hooks/useHostModalState`
- New components: `./components/HostAccountMenu`
- Shared types: `../../../shared/types`
- Domain types: `../../../domain/types/sociale.types`

---

## Appendix: Files Created by This Plan

```
NEW FILES:
  hooks/useHostModalState.ts       (~80 lines)
  hooks/useHostBootstrap.ts        (~120 lines)
  hooks/useHostGameData.ts         (~180 lines)
  hooks/useHostHandlers.ts         (~350 lines)
  components/HostAccountMenu.tsx   (~90 lines)
  components/HostHeaderCard.tsx    (~70 lines)
  components/HostVenueLoginPrompt.tsx  (~30 lines)
  components/HostPhaseContent.tsx  (~200 lines)
  components/HostSidePanel.tsx     (~130 lines)
  components/HostModalsContainer.tsx   (~220 lines)
  components/HostControlButtons.tsx    (~120 lines)
  components/HostPromptLibraryCard.tsx (~80 lines)

MODIFIED FILES:
  HostPage.tsx                     (2122 → ~200 lines)
  hooks/index.ts                   (add new hook exports)

TOTAL NEW CODE: ~1,670 lines across 12 files
TOTAL REMOVED FROM HOSTPAGE: ~1,920 lines
NET CHANGE: ~200 lines remaining in HostPage
```
