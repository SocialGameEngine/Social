# Room Feature Expansion Implementation Plan

## Goal
Expand RoomPage to support multiple features while keeping session gameplay as the primary focus and maintaining the current robust, modular architecture.

---

## Architectural Overview

### Design Principles
1. **Session First**: Gameplay CTAs always "above the fold" - no scrolling required
2. **Modular Features**: Secondary features as independent widgets/cards
3. **Persistent Shell**: RoomPage remains stable across all feature interactions
4. **Responsive Layout**: Desktop 2-column, mobile stacked with bottom nav

---

## New Layout Structure

### Desktop Layout (2-Column)
```
┌─────────────────────────────────┬─────────────────────┐
│ Header: [Room Code]      [Leave] │                     │
├─────────────────────────────────┤ Room Info Rail      │
│ Session "Now" Panel              │ (Collapsible)       │
│ ┌─────────────────────────────┐ │ ┌─────────────────┐ │
│ │ [Current Phase Card]         │ │ │ [Drink Tank]    │ │
│ │ [Timer/Prompt]               │ │ │ [Team Roster]   │ │
│ │ [Action Button]              │ │ │ [Room Settings] │ │
│ └─────────────────────────────┘ │ │ [VIBox Mini]    │ │
│                                 │ └─────────────────┘ │
│ Room Canvas (Scrollable)         │                     │
│ ┌─────────────────────────────┐ │                     │
│ │ [Activity Feed Card]         │ │                     │
│ │ [Room Chat Card]             │ │                     │
│ │ [Polls Card]                 │ │                     │
│ │ [Trivia Card]                │ │                     │
│ └─────────────────────────────┘ │                     │
└─────────────────────────────────┴─────────────────────┘
```

### Mobile Layout (Stacked)
```
┌─────────────────────────────────────┐
│ Session "Now" Panel (Sticky)         │
│ ┌─────────────────────────────────┐  │
│ │ [Current Phase Card]             │  │
│ │ [Timer/Prompt]                   │  │
│ │ [Action Button]                  │  │
│ └─────────────────────────────────┘  │
├─────────────────────────────────────┤
│ Room Canvas (Scrollable)             │
│ ┌─────────────────────────────────┐  │
│ │ [Activity Feed Card]             │  │
│ │ [Room Chat Card]                 │  │
│ │ [Polls Card]                     │  │
│ │ [Trivia Card]                    │  │
│ └─────────────────────────────────┘  │
├─────────────────────────────────────┤
│ Bottom Nav: [Home] [VIBox] [Help] [Profile] │
└─────────────────────────────────────┘
```

---

## Implementation Phases

### Phase 1: Layout Restructure

#### Task 1.1: Create Layout Components
**Files to create:**
- `src/features/room/components/layout/SessionPanel.tsx`
- `src/features/room/components/layout/RoomCanvas.tsx`
- `src/features/room/components/layout/RoomInfoRail.tsx`
- `src/features/room/components/layout/MobileLayout.tsx`

**SessionPanel.tsx:**
```typescript
interface SessionPanelProps {
  session: Session | null;
  sessionId: string | null;
  memberships: RoomMembership[] | null;
  onOpenLeaderboard: () => void;
  onOpenSelfie: () => void;
  isSticky?: boolean; // Mobile only
}

// Renders PhaseController + optional sticky positioning
```

**RoomCanvas.tsx:**
```typescript
interface RoomCanvasProps {
  room: Room | null;
  memberships: RoomMembership[] | null;
  children: React.ReactNode; // Widget cards
}

// Scrollable container for secondary features
```

**RoomInfoRail.tsx:**
```typescript
interface RoomInfoRailProps {
  memberships: RoomMembership[] | null;
  teams: Team[];
  room: Room | null;
  isCollapsed: boolean;
  onToggle: () => void;
}

// Desktop right rail with DrinkTank, roster, settings
```

#### Task 1.2: Update RoomPage Structure
**File:** `src/features/room/components/RoomPage.tsx`

**Desktop version:**
```typescript
function RoomPageContent() {
  // ... existing hooks
  
  const [isRailCollapsed, setIsRailCollapsed] = useState(false);
  
  return (
    <div className="min-h-screen flex bg-gradient-to-b from-slate-900 to-slate-800">
      {/* Main Column */}
      <div className="flex-1 flex flex-col">
        <Header />
        <SessionPanel isSticky={false} />
        <RoomCanvas>
          {/* Widget cards go here */}
        </RoomCanvas>
      </div>
      
      {/* Right Rail */}
      <RoomInfoRail 
        isCollapsed={isRailCollapsed}
        onToggle={() => setIsRailCollapsed(!isRailCollapsed)}
      />
    </div>
  );
}
```

**Mobile version:**
```typescript
function RoomPageContentMobile() {
  return (
    <div className="min-h-screen flex flex-col">
      <SessionPanel isSticky={true} />
      <RoomCanvas>
        {/* Widget cards go here */}
      </RoomCanvas>
      <BottomNavigation />
    </div>
  );
}
```

---

### Phase 2: Widget System

#### Task 2.1: Create Widget Base Components
**Files to create:**
- `src/features/room/widgets/BaseWidget.tsx`
- `src/features/room/widgets/WidgetCard.tsx`
- `src/features/room/widgets/WidgetModal.tsx`

**BaseWidget.tsx:**
```typescript
interface BaseWidgetProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  showModal?: boolean;
  onModalOpen?: () => void;
  onModalClose?: () => void;
  modalContent?: React.ReactNode;
}

// Standard widget pattern: preview card + optional modal
```

#### Task 2.2: Implement First Widgets
**Priority Order (adjust based on your needs):**
1. **Activity Feed** - Show recent room events
2. **Room Chat** - Real-time messaging
3. **Quick Polls** - Room-wide polls
4. **Trivia Questions** - Side games during wait times

**Example: ActivityFeedWidget.tsx**
```typescript
export function ActivityFeedWidget() {
  const [showModal, setShowModal] = useState(false);
  const activities = useRoomActivities(room?.id);
  
  return (
    <BaseWidget
      title="Activity Feed"
      icon={<ActivityIcon />}
      showModal={showModal}
      onModalOpen={() => setShowModal(true)}
      onModalClose={() => setShowModal(false)}
      modalContent={<ActivityFeedModal activities={activities} />}
    >
      <ActivityFeedPreview activities={activities.slice(0, 3)} />
    </BaseWidget>
  );
}
```

---

### Phase 3: Responsive Behavior

#### Task 3.1: Breakpoint Management
**Create:** `src/features/room/hooks/useResponsiveLayout.ts`

```typescript
export function useResponsiveLayout() {
  const [isMobile, setIsMobile] = useState(false);
  const [isRailCollapsed, setIsRailCollapsed] = useState(false);
  
  // Handle breakpoint changes
  // Auto-collapse rail on mobile
  // Auto-expand rail on desktop
  
  return { isMobile, isRailCollapsed, setIsRailCollapsed };
}
```

#### Task 3.2: Adaptive Component Switching
**Update RoomPage.tsx:**
```typescript
function RoomPageContent() {
  const { isMobile, isRailCollapsed } = useResponsiveLayout();
  
  if (isMobile) {
    return <RoomPageContentMobile />;
  }
  
  return <RoomPageContentDesktop />;
}
```

---

### Phase 4: Performance & State Management

#### Task 4.1: Widget State Isolation
Each widget manages its own state:
```typescript
// Good: Widget owns its modal state
const [showModal, setShowModal] = useState(false);

// Bad: Global widget state in context
// This would cause unnecessary re-renders
```

#### Task 4.2: Lazy Loading Strategy
```typescript
// Lazy load widget modals
const ActivityFeedModal = lazy(() => import('./ActivityFeedModal'));
const RoomChatModal = lazy(() => import('./RoomChatModal'));
```

#### Task 4.3: Real-time Subscriptions
```typescript
// Each widget subscribes to its own data
const activities = useRoomActivities(room?.id);
const chatMessages = useRoomChat(room?.id);
const polls = useRoomPolls(room?.id);
```

---

## File Structure After Implementation

```
src/features/room/
├── components/
│   ├── RoomPage.tsx (updated)
│   ├── PhaseController.tsx (unchanged)
│   ├── layout/
│   │   ├── SessionPanel.tsx
│   │   ├── RoomCanvas.tsx
│   │   ├── RoomInfoRail.tsx
│   │   └── MobileLayout.tsx
│   └── widgets/
│       ├── BaseWidget.tsx
│       ├── WidgetCard.tsx
│       ├── WidgetModal.tsx
│       ├── ActivityFeedWidget.tsx
│       ├── RoomChatWidget.tsx
│       ├── PollsWidget.tsx
│       └── TriviaWidget.tsx
├── hooks/
│   ├── useResponsiveLayout.ts
│   ├── useRoomActivities.ts
│   ├── useRoomChat.ts
│   └── useRoomPolls.ts
├── phases/ (unchanged)
└── context/
    └── RoomPageContext.tsx (minimal updates)
```

---

## Implementation Checklist

### Phase 1: Layout
- [ ] Create layout components
- [ ] Update RoomPage structure
- [ ] Implement responsive switching
- [ ] Test desktop/mobile layouts

### Phase 2: Widgets
- [ ] Create base widget system
- [ ] Implement Activity Feed widget
- [ ] Implement Room Chat widget
- [ ] Implement Polls widget
- [ ] Test widget modals

### Phase 3: Polish
- [ ] Add animations/transitions
- [ ] Implement rail collapse behavior
- [ ] Optimize performance
- [ ] Test on various screen sizes

### Phase 4: Integration
- [ ] Add real-time subscriptions
- [ ] Implement widget state persistence
- [ ] Add widget configuration
- [ ] Full integration testing

---

## Key Benefits

1. **Session Priority**: Gameplay always accessible without scrolling
2. **Feature Modularity**: Each widget is independent and lazy-loaded
3. **Scalability**: Easy to add new widgets without affecting core gameplay
4. **Performance**: Widgets only load/render when needed
5. **Responsive**: Optimized layouts for desktop and mobile
6. **Maintainable**: Clear separation of concerns preserves existing architecture

---

## Phase 5: Mock Widget Implementations

### Task 5.1: Create Mock Widgets for Visual Preview

#### Activity Feed Widget
**File:** `src/features/room/widgets/ActivityFeedWidget.tsx`

```typescript
import { useState } from 'react';
import { BaseWidget } from './BaseWidget';
import { ActivityFeedModal } from './ActivityFeedModal';

interface ActivityItem {
  id: string;
  type: 'join' | 'answer' | 'vote' | 'phase_change';
  user: string;
  message: string;
  timestamp: Date;
}

// Mock data
const mockActivities: ActivityItem[] = [
  { id: '1', type: 'join', user: 'Alex', message: 'joined the room', timestamp: new Date(Date.now() - 5000) },
  { id: '2', type: 'answer', user: 'Sam', message: 'submitted an answer', timestamp: new Date(Date.now() - 15000) },
  { id: '3', type: 'vote', user: 'Jordan', message: 'voted for an answer', timestamp: new Date(Date.now() - 30000) },
  { id: '4', type: 'phase_change', user: 'Host', message: 'started Vote phase', timestamp: new Date(Date.now() - 45000) },
];

export function ActivityFeedWidget() {
  const [showModal, setShowModal] = useState(false);
  
  return (
    <BaseWidget
      title="Activity Feed"
      icon={
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      }
      showModal={showModal}
      onModalOpen={() => setShowModal(true)}
      onModalClose={() => setShowModal(false)}
      modalContent={<ActivityFeedModal activities={mockActivities} />}
    >
      <div className="space-y-2">
        {mockActivities.slice(0, 3).map((activity) => (
          <div key={activity.id} className="flex items-center gap-2 text-sm">
            <div className={`w-2 h-2 rounded-full ${
              activity.type === 'join' ? 'bg-green-400' :
              activity.type === 'answer' ? 'bg-blue-400' :
              activity.type === 'vote' ? 'bg-purple-400' :
              'bg-orange-400'
            }`} />
            <span className="text-slate-300">{activity.user}</span>
            <span className="text-slate-500">{activity.message}</span>
            <span className="text-slate-600 text-xs ml-auto">
              {formatTimeAgo(activity.timestamp)}
            </span>
          </div>
        ))}
      </div>
    </BaseWidget>
  );
}

function formatTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return 'just now';
  return `${Math.floor(seconds / 60)}m ago`;
}
```

#### Room Chat Widget
**File:** `src/features/room/widgets/RoomChatWidget.tsx`

```typescript
import { useState } from 'react';
import { BaseWidget } from './BaseWidget';
import { RoomChatModal } from './RoomChatModal';

interface ChatMessage {
  id: string;
  user: string;
  message: string;
  timestamp: Date;
  isOwn: boolean;
}

// Mock data
const mockMessages: ChatMessage[] = [
  { id: '1', user: 'Alex', message: 'Hey everyone! Ready for the next round?', timestamp: new Date(Date.now() - 20000), isOwn: false },
  { id: '2', user: 'You', message: 'Yeah, this is fun!', timestamp: new Date(Date.now() - 15000), isOwn: true },
  { id: '3', user: 'Sam', message: 'The last prompt was hilarious 😂', timestamp: new Date(Date.now() - 10000), isOwn: false },
  { id: '4', user: 'Jordan', message: 'Can\'t wait for the results', timestamp: new Date(Date.now() - 5000), isOwn: false },
];

export function RoomChatWidget() {
  const [showModal, setShowModal] = useState(false);
  const unreadCount = mockMessages.filter(m => !m.isOwn).length;
  
  return (
    <BaseWidget
      title="Room Chat"
      icon={
        <div className="relative">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </div>
      }
      showModal={showModal}
      onModalOpen={() => setShowModal(true)}
      onModalClose={() => setShowModal(false)}
      modalContent={<RoomChatModal messages={mockMessages} />}
    >
      <div className="space-y-2">
        {mockMessages.slice(-2).map((message) => (
          <div key={message.id} className={`text-sm ${message.isOwn ? 'text-right' : ''}`}>
            <span className={`font-medium ${message.isOwn ? 'text-cyan-400' : 'text-purple-400'}`}>
              {message.user}:
            </span>
            <span className="text-slate-300 ml-1">{message.message}</span>
          </div>
        ))}
      </div>
    </BaseWidget>
  );
}
```

#### Polls Widget
**File:** `src/features/room/widgets/PollsWidget.tsx`

```typescript
import { useState } from 'react';
import { BaseWidget } from './BaseWidget';
import { PollsModal } from './PollsModal';

interface Poll {
  id: string;
  question: string;
  options: string[];
  votes: Record<string, number>;
  totalVotes: number;
  isActive: boolean;
  userVote?: string;
}

// Mock data
const mockPoll: Poll = {
  id: '1',
  question: 'What should be the next theme?',
  options: ['Movies', 'Music', 'Sports', 'Food'],
  votes: { 'Movies': 5, 'Music': 8, 'Sports': 3, 'Food': 4 },
  totalVotes: 20,
  isActive: true,
  userVote: 'Music'
};

export function PollsWidget() {
  const [showModal, setShowModal] = useState(false);
  
  return (
    <BaseWidget
      title="Quick Poll"
      icon={
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      }
      showModal={showModal}
      onModalOpen={() => setShowModal(true)}
      onModalClose={() => setShowModal(false)}
      modalContent={<PollsModal poll={mockPoll} />}
    >
      <div className="space-y-2">
        <p className="text-sm font-medium text-slate-200">{mockPoll.question}</p>
        <div className="space-y-1">
          {mockPoll.options.slice(0, 2).map((option) => {
            const percentage = (mockPoll.votes[option] / mockPoll.totalVotes) * 100;
            return (
              <div key={option} className="flex items-center gap-2">
                <div className="flex-1 bg-slate-700 rounded-full h-2 overflow-hidden">
                  <div 
                    className={`h-full ${option === mockPoll.userVote ? 'bg-cyan-400' : 'bg-slate-500'}`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <span className="text-xs text-slate-400 w-12 text-right">{percentage.toFixed(0)}%</span>
              </div>
            );
          })}
        </div>
        <p className="text-xs text-slate-500">{mockPoll.totalVotes} votes</p>
      </div>
    </BaseWidget>
  );
}
```

#### Trivia Widget
**File:** `src/features/room/widgets/TriviaWidget.tsx`

```typescript
import { useState } from 'react';
import { BaseWidget } from './BaseWidget';
import { TriviaModal } from './TriviaModal';

interface TriviaQuestion {
  id: string;
  question: string;
  answer: string;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
  points: number;
  isAnswered: boolean;
  userAnswer?: string;
}

// Mock data
const mockTrivia: TriviaQuestion = {
  id: '1',
  question: 'What is the capital of France?',
  answer: 'Paris',
  category: 'Geography',
  difficulty: 'easy',
  points: 10,
  isAnswered: false
};

export function TriviaWidget() {
  const [showModal, setShowModal] = useState(false);
  
  return (
    <BaseWidget
      title="Quick Trivia"
      icon={
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      }
      showModal={showModal}
      onModalOpen={() => setShowModal(true)}
      onModalClose={() => setShowModal(false)}
      modalContent={<TriviaModal question={mockTrivia} />}
    >
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className={`px-2 py-1 text-xs rounded-full ${
            mockTrivia.difficulty === 'easy' ? 'bg-green-500/20 text-green-400' :
            mockTrivia.difficulty === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
            'bg-red-500/20 text-red-400'
          }`}>
            {mockTrivia.difficulty}
          </span>
          <span className="text-xs text-slate-500">{mockTrivia.category}</span>
          <span className="text-xs text-cyan-400 ml-auto">+{mockTrivia.points} pts</span>
        </div>
        <p className="text-sm text-slate-300">{mockTrivia.question}</p>
        {!mockTrivia.isAnswered && (
          <button className="text-xs text-cyan-400 hover:text-cyan-300">
            Tap to answer →
          </button>
        )}
      </div>
    </BaseWidget>
  );
}
```

#### Base Widget Component
**File:** `src/features/room/widgets/BaseWidget.tsx`

```typescript
import { lazy, Suspense } from 'react';

interface BaseWidgetProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  showModal?: boolean;
  onModalOpen?: () => void;
  onModalClose?: () => void;
  modalContent?: React.ReactNode;
}

export function BaseWidget({
  title,
  icon,
  children,
  showModal,
  onModalOpen,
  onModalClose,
  modalContent
}: BaseWidgetProps) {
  return (
    <>
      <div 
        className="chaos-widget-card bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 hover:bg-slate-800/70 transition-colors cursor-pointer"
        onClick={onModalOpen}
      >
        <div className="flex items-center gap-3 mb-3">
          <div className="text-cyan-400">{icon}</div>
          <h3 className="text-lg font-semibold text-white">{title}</h3>
        </div>
        {children}
      </div>

      <Suspense fallback={null}>
        {showModal && modalContent}
      </Suspense>
    </>
  );
}
```

#### Widget Modal Examples
**File:** `src/features/room/widgets/ActivityFeedModal.tsx`

```typescript
interface ActivityFeedModalProps {
  activities: ActivityItem[];
}

export function ActivityFeedModal({ activities }: ActivityFeedModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
      <div className="relative w-full max-w-lg max-h-[80vh] bg-slate-900 rounded-xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-slate-700/50">
          <h2 className="text-xl font-bold text-cyan-400">Activity Feed</h2>
          <button className="text-slate-400 hover:text-white">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-4 space-y-3 overflow-y-auto max-h-[60vh]">
          {activities.map((activity) => (
            <div key={activity.id} className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg">
              <div className={`w-3 h-3 rounded-full ${
                activity.type === 'join' ? 'bg-green-400' :
                activity.type === 'answer' ? 'bg-blue-400' :
                activity.type === 'vote' ? 'bg-purple-400' :
                'bg-orange-400'
              }`} />
              <div className="flex-1">
                <p className="text-white">
                  <span className="font-medium">{activity.user}</span>{' '}
                  <span className="text-slate-300">{activity.message}</span>
                </p>
                <p className="text-xs text-slate-500">{activity.timestamp.toLocaleTimeString()}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
```

#### Updated RoomCanvas with Mock Widgets
**File:** `src/features/room/components/layout/RoomCanvas.tsx` (updated)

```typescript
import { ActivityFeedWidget } from '../../widgets/ActivityFeedWidget';
import { RoomChatWidget } from '../../widgets/RoomChatWidget';
import { PollsWidget } from '../../widgets/PollsWidget';
import { TriviaWidget } from '../../widgets/TriviaWidget';

export function RoomCanvas({ children }: RoomCanvasProps) {
  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {/* Mock widgets for visual preview */}
      <ActivityFeedWidget />
      <RoomChatWidget />
      <PollsWidget />
      <TriviaWidget />
      
      {/* Future widgets will go here */}
      {children}
    </div>
  );
}
```

---

## Questions for You

1. **Which 2-3 secondary features should we implement first?**
2. **Should the desktop rail be collapsible or always visible?**
3. **On mobile, should SessionPanel be sticky or just first in scroll?**
4. **Which widgets should show previews vs. modal-only?**
5. **Any specific layout constraints or preferences?**
