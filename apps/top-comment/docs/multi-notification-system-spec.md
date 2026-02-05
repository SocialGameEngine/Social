# Multi-Notification System Architecture

## Overview

Future enhancement to support **multiple concurrent notifications** sent manually by the host. This moves beyond the current single-phase model (Answer → Vote) to a flexible notification queue where players can have multiple active prompts simultaneously.

## Use Cases

1. **Host Announcements** — Broadcast messages that appear as banner cards ("Next round in 2 minutes!")
2. **Quiz Modals** — Trivia machine integration with timed quiz popups
3. **Multiple Answer Prompts** — Players answer Question A while voting on Question B
4. **Urgent Notifications** — High-priority alerts that interrupt current flow ("Drink break!")
5. **Gamification Events** — Achievement unlocks, streak notifications, bonus round invitations
6. **Final Leaderboard** — End-of-game results modal with:
   - Final scoreboard with rankings (`Leaderboard` component)
   - "My Rank" scroll button
   - Selfie celebration section (camera capture, share, download)
   - Leave session button
   - Same content structure as `EndedPhase.tsx`

## Current Limitation

The RoomPage currently uses a **single-phase model**:

```tsx
// Current: One phase at a time
<PhaseCardButton phase={currentPhase} />  // 'answer' | 'vote' | 'lobby' | 'ended'
```

This means:
- Only one notification card displays at a time
- New phases replace previous ones
- No stacking or concurrent prompts possible

## Proposed Architecture

### 1. Notification Model

```typescript
interface Notification {
  id: string;                    // Unique identifier
  type: 'answer' | 'vote' | 'quiz' | 'announcement' | 'banner' | 'leaderboard';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  title: string;
  content: string;               // Prompt text, announcement message, etc.
  
  // Timing
  createdAt: string;
  expiresAt?: string;           // Auto-dismissal time
  duration?: number;            // Optional: show for X seconds
  
  // State
  status: 'pending' | 'active' | 'dismissed' | 'completed';
  dismissedAt?: string;
  completedAt?: string;
  
  // Targeting
  targetUserIds?: string[];     // Specific players (undefined = all)
  
  // Modal-specific data
  modalData?: {
    roundIndex?: number;
    answers?: Answer[];
    teams?: Team[];
    maxSubmissions?: number;
    // Leaderboard data
    rankings?: {
      position: number;
      teamName: string;
      score: number;
      isWinner?: boolean;
    }[];
    quizResults?: {
      correctAnswer: string;
      playerResults: { playerId: string; correct: boolean; timeMs: number }[];
    };
    // ... type-specific fields
  };
}
```

### 2. Notification Queue Store

```typescript
// New context/provider: NotificationContext
interface NotificationState {
  notifications: Notification[];
  activeModal: Notification | null;  // Currently open modal
}

interface NotificationActions {
  addNotification: (notification: Omit<Notification, 'id' | 'createdAt'>) => void;
  dismissNotification: (id: string) => void;
  completeNotification: (id: string) => void;
  openNotificationModal: (id: string) => void;
  closeNotificationModal: () => void;
}
```

### 3. Host Controls

New host interface for manual notification dispatch:

```typescript
interface HostNotificationPanel {
  // Quick actions
  sendAnnouncement: (message: string, priority?: Priority) => void;
  sendQuiz: (quizData: QuizData, targetPlayers?: string[]) => void;
  sendPrompt: (prompt: string, type: 'answer' | 'vote') => void;
  
  // Management
  viewActiveNotifications: () => Notification[];
  dismissNotification: (id: string) => void;
  bulkDismiss: (type?: NotificationType) => void;
}
```

### 4. UI Layout Changes

#### Current (Single Card)
```tsx
<main>
  <PhaseCardButton phase={currentPhase} />
</main>
```

#### Future (Notification Stack)
```tsx
<main>
  {/* Banner notifications (announcements, alerts) */}
  <NotificationBanners 
    notifications={bannerNotifications}
    onDismiss={dismissNotification}
  />
  
  {/* Active notification cards stack */}
  <div className="space-y-4">
    {activeNotifications.map(notification => (
      <NotificationCard 
        key={notification.id}
        notification={notification}
        onClick={() => openModal(notification.id)}
        onDismiss={() => dismissNotification(notification.id)}
      />
    ))}
  </div>
</main>
```

### 5. Visual Hierarchy

| Priority | Visual Treatment | Behavior |
|----------|-----------------|----------|
| `urgent` | Red border, pulsing glow, top of stack | Cannot dismiss until completed |
| `high`   | Cyan border, slight glow, near top | Auto-dismiss after 30s if not opened |
| `normal` | Standard card styling | Standard queue position |
| `low`    | Muted colors, collapsible | Auto-dismiss after 60s |

### 6. State Transitions

```
Host sends notification
       ↓
   [pending] ──→ Broadcast to target players
       ↓
   [active] ──→ Appears in player's notification stack
       ↓
   Player opens modal / completes action
       ↓
   [completed] ──→ Moves to history, removed from stack
       ↓
   OR Player dismisses
       ↓
   [dismissed] ──→ Soft delete, kept for analytics
```

## Implementation Phases

### Phase 1: Foundation
- [ ] Create `NotificationContext` with queue management
- [ ] Add `Notification` and `NotificationType` to room types
- [ ] Refactor `RoomPage` to render notification stack instead of single `PhaseCardButton`

### Phase 2: Basic Notifications
- [ ] Implement banner notification component (announcements)
- [ ] Add dismiss/complete actions
- [ ] Host panel with "Send Announcement" button

### Phase 3: Interactive Notifications
- [ ] Support `answer`/`vote` type notifications in queue
- [ ] Convert `AnswerModal`/`VoteModal` to work with notification ID
- [ ] Allow multiple concurrent prompts (Question A + Question B)

### Phase 4: Quiz Integration
- [ ] `quiz` notification type with timer
- [ ] Quiz modal component
- [ ] Score tracking and leaderboard

### Phase 5: Advanced Features
- [ ] Notification history/analytics for host
- [ ] Scheduled notifications ("Send in 5 minutes")
- [ ] Conditional notifications ("Only to players who haven't answered")
- [ ] Template system for common notification types

## Database Considerations

```sql
-- New table for active notifications
CREATE TABLE room_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  priority VARCHAR(20) DEFAULT 'normal',
  title TEXT NOT NULL,
  content TEXT,
  status VARCHAR(20) DEFAULT 'pending',
  target_user_ids UUID[],  -- NULL = all players
  modal_data JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP,
  dismissed_at TIMESTAMP,
  completed_at TIMESTAMP
);

-- Index for fetching active notifications
CREATE INDEX idx_room_notifications_active 
ON room_notifications(room_id, status) 
WHERE status IN ('pending', 'active');
```

## Realtime Updates

Use Supabase Realtime to broadcast notifications:

```typescript
// Subscribe to notifications for current room
supabase
  .channel(`room-notifications:${roomId}`)
  .on('postgres_changes', 
    { event: 'INSERT', schema: 'public', table: 'room_notifications' },
    (payload) => addNotification(payload.new)
  )
  .subscribe();
```

## Migration Strategy

1. Keep existing `session` table for game flow (rounds, phases)
2. Add `room_notifications` as **overlay layer** — doesn't replace session
3. Gradually migrate phase-based prompts to notification system
4. Eventually deprecate `currentPhase` in favor of notification queue

## Open Questions

1. **Should notifications persist across page reloads?** (Yes, via database)
2. **What happens if 10+ notifications are active?** (Scrollable list, max visible limit)
3. **Can a player have 2 answer prompts for the same round?** (Yes, if host sends manually)
4. **How do notifications interact with session phases?** (Session = auto-generated, notifications = manual overlay)
5. **Notification deduplication?** (Prevent spam from host — rate limiting?)

## Related Files

- `RoomPage.tsx` — Main layout requiring refactor
- `RoomPageContext.tsx` — State management to extend
- `PhaseCardButton.tsx` — Component to generalize as `NotificationCard`
- `AnswerModal.tsx`, `VoteModal.tsx` — Modals to connect to notification system

---

**Status:** Conceptual / Not yet implemented  
**Priority:** Future enhancement (post-MVP)  
**Complexity:** High — requires significant architecture changes
