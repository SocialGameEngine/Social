# Refactor Plan: Separate `/join` and `/room/:roomId` Pages

## 🎯 Objective
Refactor the current monolithic `TeamPage.tsx` into separate pages for cleaner architecture and simpler kick detection.

## 🏗️ Current Architecture (Complex)
```
TeamPage.tsx (handles everything)
├── JoinForm (when no room)
├── RoomLobbyPhase (when in room but no session)
├── AnswerPhase (when in session)
├── VotePhase (when in session)
└── ResultsPhase (when in session)
```

## 🏗️ New Architecture (Clean)
```
/join (dedicated join page)
/room/:roomId (dedicated room page)
├── Lobby (when no session)
├── Answer (when in session)
├── Vote (when in session)
└── Results (when in session)
```

## 📋 Implementation Steps

### 1. Create New Pages
- [ ] `src/features/join/JoinPage.tsx` - Dedicated join page
- [ ] `src/features/room/RoomPage.tsx` - Dedicated room page
- [ ] `src/features/room/components/RoomLobby.tsx` - Room lobby component
- [ ] `src/features/room/components/GamePhases.tsx` - Game phases wrapper

### 2. Update Routing
- [ ] Update `App.tsx` or routing config
- [ ] Add `/join` route → `JoinPage`
- [ ] Add `/room/:roomId` route → `RoomPage`
- [ ] Remove old `/team` route

### 3. Simplify Kick Detection
- [ ] Move kick detection to `RoomPage.tsx` level
- [ ] Use simple `window.location.href = "/join"` when kicked
- [ ] Remove complex `useKickDetection` hook
- [ ] Remove kick detection from individual phases

### 4. Update Navigation
- [ ] Update `JoinForm` to navigate to `/room/:code`
- [ ] Update host page to navigate to `/room/:roomId`
- [ ] Update leave room to navigate to `/join`

### 5. Handle Authentication & Authorization
- [ ] Implement login state management across pages
- [ ] Add room access control validation
- [ ] Ensure session persistence across navigation
- [ ] Handle anonymous user authentication

### 6. Manage Data Flow & State
- [ ] Implement room data fetching in RoomPage
- [ ] Move real-time subscriptions to RoomPage
- [ ] Ensure state synchronization across components
- [ ] Handle loading states and error states

### 7. Add Error Handling & Edge Cases
- [ ] Add 404 handling for invalid room codes
- [ ] Implement room not found error states
- [ ] Add network failure retry logic
- [ ] Handle concurrent session conflicts

### 8. Ensure Migration Safety
- [ ] Add feature flags for gradual rollout
- [ ] Implement A/B testing capability
- [ ] Create rollback plan with quick revert
- [ ] Set up error monitoring and tracking

### 9. Clean Up
- [ ] Remove `TeamPage.tsx`
- [ ] Remove unused hooks and components
- [ ] Update any references to old routing
- [ ] Clean up database and environment variables

## 🎯 Benefits

### 1. Simpler Kick Detection
```typescript
// Before: Complex hook with race conditions
useKickDetection({ roomId, onLeaveRoom });

// After: Simple check in RoomPage
if (!myMembership) {
  window.location.href = "/join";
}
```

### 2. Cleaner URLs
- Before: `/team` (ambiguous)
- After: `/join` and `/room/ABC123` (clear)

### 3. Better Separation of Concerns
- Join logic isolated to `/join`
- Room/game logic isolated to `/room/:roomId`
- Each page has single responsibility

### 4. Easier Debugging
- Each page is isolated
- Clear routing state
- Simpler component tree

### 5. Better UX
- URLs reflect actual state
- Browser back/forward works naturally
- Bookmarkable room URLs

## 🔧 Technical Details

### New File Structure
```
src/features/
├── join/
│   └── JoinPage.tsx
├── room/
│   ├── RoomPage.tsx
│   ├── components/
│   │   ├── RoomLobby.tsx
│   │   └── GamePhases.tsx
│   └── hooks/
│       └── useRoomLogic.ts
└── team/ (remove or refactor)
```

### Routing Changes
```typescript
// Before
<Route path="/team" element={<TeamPage />} />

// After
<Route path="/join" element={<JoinPage />} />
<Route path="/room/:roomId" element={<RoomPage />} />
```

### Kick Detection Simplification
```typescript
// In RoomPage.tsx
const { myMembership } = useRoom({ roomId });

useEffect(() => {
  if (roomId && !myMembership) {
    window.location.href = "/join";
  }
}, [roomId, myMembership]);
```

## 🚀 Migration Strategy

1. **Phase 1**: Create new pages side-by-side with existing
2. **Phase 2**: Test new routing and kick detection
3. **Phase 3**: Switch routing to new pages
4. **Phase 4**: Remove old TeamPage and clean up

## ⚠️ Risks & Mitigations

### Risk: Breaking existing functionality
- **Mitigation**: Test thoroughly before switching routing
- **Rollback**: Keep old routing until new is proven

### Risk: Complex state management
- **Mitigation**: Use existing hooks, just move them
- **Simplify**: Remove unnecessary complexity

### Risk: URL changes break bookmarks
- **Mitigation**: Add redirects from old URLs
- **Communication**: Document the changes

## ✅ Success Criteria

- [ ] Kick detection works reliably from all phases
- [ ] Navigation is clean and predictable
- [ ] URLs reflect actual application state
- [ ] Code is simpler and more maintainable
- [ ] No regression in existing functionality

## 📅 Timeline

- **Day 1**: Create new pages and basic routing
- **Day 2**: Implement kick detection simplification
- **Day 3**: Test and migrate routing
- **Day 4**: Clean up and documentation
