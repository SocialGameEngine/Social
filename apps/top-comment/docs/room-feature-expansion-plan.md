# Room Feature Expansion Implementation Plan

> **Revised**: Fixed architecture issues (no teams, only room memberships), 
> consistent file paths, working modal close handlers, exported shared types,
> and all missing modal components defined.

## Goal
Expand RoomPage to support multiple features while keeping session gameplay as the primary focus and maintaining the current robust, modular architecture.

---

## Architectural Overview

### Design Principles
1. **Session First**: Gameplay CTAs always "above the fold" - no scrolling required
2. **Modular Features**: Secondary features as independent widgets/cards
3. **Persistent Shell**: RoomPage remains stable across all feature interactions
4. **Responsive Layout**: Desktop 2-column, mobile stacked with bottom nav
5. **No Teams**: Architecture uses rooms → memberships only. Never reference teams.

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
│ │ [Timer/Prompt]               │ │ │ [Player Roster] │ │
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

## File Structure After Implementation

All new files live under `src/features/room/`:

```
src/features/room/
├── components/
│   ├── RoomPage.tsx              (updated - responsive layout switching)
│   ├── PhaseController.tsx       (unchanged)
│   ├── layout/
│   │   ├── SessionPanel.tsx      (wraps PhaseController with sticky option)
│   │   ├── RoomCanvas.tsx        (scrollable widget container)
│   │   └── RoomInfoRail.tsx      (desktop right rail - memberships, DrinkTank)
│   └── ...existing components
├── widgets/
│   ├── widget.types.ts           (shared widget type definitions)
│   ├── BaseWidget.tsx            (card + modal pattern)
│   ├── WidgetModal.tsx           (reusable modal shell with close handler)
│   ├── ActivityFeedWidget.tsx    (mock activity feed)
│   ├── RoomChatWidget.tsx        (mock room chat)
│   ├── PollsWidget.tsx           (mock polls)
│   └── TriviaWidget.tsx          (mock trivia)
├── hooks/
│   ├── useResponsiveLayout.ts    (breakpoint detection + rail state)
│   └── ...existing hooks
├── phases/                       (unchanged)
└── context/
    └── RoomPageContext.tsx        (unchanged)
```

---

## Implementation Checklist

### Phase 1: Layout + Responsive Hook
- [ ] Create `useResponsiveLayout` hook
- [ ] Create `SessionPanel` layout component
- [ ] Create `RoomCanvas` layout component
- [ ] Create `RoomInfoRail` layout component
- [ ] Update `RoomPage.tsx` with responsive desktop/mobile switching
- [ ] Preserve `BackgroundAnimation` and existing bottom nav

### Phase 2: Widget System + Mock Widgets
- [ ] Create `widget.types.ts` with shared type definitions
- [ ] Create `WidgetModal` reusable modal shell (with working close handlers)
- [ ] Create `BaseWidget` card component
- [ ] Create `ActivityFeedWidget` with inline modal
- [ ] Create `RoomChatWidget` with inline modal
- [ ] Create `PollsWidget` with inline modal
- [ ] Create `TriviaWidget` with inline modal

### Phase 3: Polish
- [ ] Test desktop/mobile layouts
- [ ] Test widget modal open/close
- [ ] Verify build compiles
