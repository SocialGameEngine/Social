# /room Page UI Structure

This file represents the UI structure of the `/room` page. It's designed to be edited by ChatGPT and then mapped back to the actual implementation files.

---

## HEADER SECTION
**File**: `apps/top-comment/src/features/room/components/layout/RoomHeader.tsx`
**Purpose**: Room Identity & User Management

```
┌─────────────────────────────────────────────────────────┐
│ [ROOM CODE: ABCD]              [👤 User Avatar Menu]    │
└─────────────────────────────────────────────────────────┘
```

**Elements**:
- Room code display (large text, left side)
- User account menu button (right side)
  - Shows user avatar/initials
  - Dropdown with: display name, email, sign out

---

## SESSION PANEL (PRIMARY FOCUS)
**File**: `apps/top-comment/src/features/room/components/layout/SessionPanel.tsx`
**Purpose**: Main Quiplash/Pub Trivia style phased game engine

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│                   [SESSION BUTTON]                      │
│                                                         │
│              ┌─────────────────────┐                    │
│              │   START ROUND       │                    │
│              │   (33% screen)      │                    │
│              │                     │                    │
│              │   Phase: Lobby      │                    │
│              │   Status: Ready     │                    │
│              └─────────────────────┘                    │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**Phases**:
1. **Lobby**: Waiting for players to join
2. **Answer**: Players submit creative responses
3. **Vote**: Players vote on best responses
4. **Results**: Winners and scores displayed
5. **Ended**: Final leaderboard

**Visual Priority**: 
- Largest element on page (min-height: 33dvh)
- Sticky positioning when scrolling
- Dominates UI when session is active

---

## DAILIES SECTION
**File**: `apps/top-comment/src/features/room/components/layout/InteractionsGrid.tsx`
**Purpose**: Quick launcher for interaction types

```
┌─────────────────────────────────────────────────────────┐
│ DAILIES                                                 │
│ ┌─────────┐  ┌─────────┐  ┌─────────┐                 │
│ │ 📊      │  │ 💬      │  │ 💡      │                 │
│ │ Polls   │  │ Topics  │  │ Prompts │                 │
│ │ (5)     │  │ (12)    │  │ (8)     │                 │
│ └─────────┘  └─────────┘  └─────────┘                 │
│                                                         │
│ ┌─────────┐  ┌─────────┐                               │
│ │ 🎭      │  │ 🎯      │                               │
│ │ Fibbage │  │ Trivia  │                               │
│ │ (3)     │  │ (15)    │                               │
│ └─────────┘  └─────────┘                               │
└─────────────────────────────────────────────────────────┘
```

**Layout**: 
- 3-column grid (grid-cols-3)
- Shows 5 interaction types
- Displays participant counts
- Same size as social cards

**Function**: Shortcut buttons to launch interactions

---

## INTERACTIONS SECTION
**File**: `apps/top-comment/src/features/room/components/interactions/InteractionSection.tsx`
**Purpose**: Active gameplay hub for supplementary games

```
┌─────────────────────────────────────────────────────────┐
│ ACTIVE INTERACTIONS                                     │
│                                                         │
│ ┌─────────────────────────────────────────────────┐   │
│ │ 💡 Prompt: "What's the best pizza topping?"     │   │
│ │ Status: VOTING                                   │   │
│ │ Participants: 12                                 │   │
│ │ [View Responses] [Vote]                          │   │
│ └─────────────────────────────────────────────────┘   │
│                                                         │
│ ┌─────────────────────────────────────────────────┐   │
│ │ 🎯 Trivia: "What year was the first iPhone?"    │   │
│ │ Status: ACTIVE                                   │   │
│ │ Participants: 8                                  │   │
│ │ [Submit Answer]                                  │   │
│ └─────────────────────────────────────────────────┘   │
│                                                         │
│ [+ Send Another Prompt] (moderator only)               │
└─────────────────────────────────────────────────────────┘
```

**Features**:
- Shows active games (prompts, trivia, polls, topics, fibbage)
- Response submission interface
- Voting interface
- Results display
- Real-time activity indicators
- Moderator controls

**Relationship**: This is the actual gameplay for games launched from Dailies

---

## MORE SECTION
**File**: `apps/top-comment/src/features/room/components/layout/MiscSection.tsx`
**Purpose**: Additional room utilities

```
┌─────────────────────────────────────────────────────────┐
│ MORE                                                    │
│ ┌─────────┐  ┌─────────┐  ┌─────────┐                 │
│ │ 🎵      │  │ 👁️      │  │         │                 │
│ │ VIBox   │  │ Help    │  │         │                 │
│ │         │  │         │  │         │                 │
│ └─────────┘  └─────────┘  └─────────┘                 │
└─────────────────────────────────────────────────────────┘
```

**Layout**: 
- 3-column grid (grid-cols-3)
- Matches Dailies layout
- Currently has 2 items (VIBox, Help)

**Features**:
- VIBox: Music/media player
- Help: Instructions and guidance

---

## SIDEBAR (DESKTOP ONLY)
**File**: `apps/top-comment/src/features/room/components/layout/RoomSidebar.tsx`
**Purpose**: Room management and communication

```
┌─────────────────────┐
│ [Lobby][Chat][Mod] │
├─────────────────────┤
│                     │
│ LOBBY TAB:          │
│ • Player 1          │
│ • Player 2          │
│ • Player 3          │
│                     │
│ CHAT TAB:           │
│ • Real-time msgs    │
│                     │
│ MOD TAB:            │
│ • Kick/Ban tools    │
│ • Report mgmt       │
│                     │
│ [Collapse ◀]        │
└─────────────────────┘
```

**Tabs**:
1. **Lobby**: Player list and membership management
2. **Chat**: Real-time messaging
3. **Mod**: Moderator tools (kick, ban, reports)

**Features**:
- Collapsible design
- Desktop only (hidden on mobile)
- Moderator tools for room safety

---

## FLOATING ELEMENTS

### Reaction Overlay
**File**: `apps/top-comment/src/features/room/components/ReactionOverlay.tsx`
**Purpose**: Visual engagement effects

```
        😂
    ❤️      🎉
         👍
    🔥         ⭐
```

**Features**:
- Floating emoji animations
- Reaction bursts
- Real-time display from all members

### Submit Question Button
**File**: `apps/top-comment/src/features/room/components/submissions/SubmitQuestionButton.tsx`
**Purpose**: Audience participation

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│                                                         │
│                                              [💡 +]     │
│                                         (bottom-left)   │
└─────────────────────────────────────────────────────────┘
```

**Features**:
- Fixed position floating action button
- Opens modal for question submission
- Only visible for room members

### Challenge Notifications
**File**: `apps/top-comment/src/features/room/components/challenges/ChallengeNotification.tsx`
**Purpose**: Real-time challenge alerts

```
┌─────────────────────────────────────────┐
│ 🎯 Player123 challenged you!            │
│ Question: "Name a pizza topping"        │
│ Wager: 100 points                       │
│ [Accept] [Decline]                      │
└─────────────────────────────────────────┘
```

---

## BACKGROUND
**File**: `apps/top-comment/src/components/BackgroundAnimation.tsx`
**Purpose**: Atmospheric visual effects

```
┌─────────────────────────────────────────────────────────┐
│ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │
│ ░░░ Animated gradient background ░░░░░░░░░░░░░░░░░░░░░ │
│ ░░░░░░░ Radial gradients from corners ░░░░░░░░░░░░░░░░ │
│ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │
└─────────────────────────────────────────────────────────┘
```

**Features**:
- Dynamic color transitions
- Immersive atmosphere
- Enhances social gaming experience

---

## UI PRIORITY HIERARCHY

### When Session is ACTIVE:
1. **Session Panel** (DOMINATES - 33% screen height)
2. **Interactions** (Secondary activities)
3. **Dailies/More** (Tertiary options)

### When Session is INACTIVE:
1. **Interactions** (Primary focus)
2. **Dailies** (Quick access launchers)
3. **Session Panel** (Shows lobby/ready state)

---

## DESIGN PRINCIPLES

1. **Session-First**: Quiplash-style phased game is the main event
2. **Visual Hierarchy**: Session button commands attention when active
3. **Progressive Disclosure**: Quick access → Deep engagement
4. **Responsive**: Adapts mobile/desktop seamlessly
5. **Clean Interface**: No tab navigation, no bottom nav
6. **Social Focus**: Multiplayer interaction emphasized

---

## REMOVED ELEMENTS

- ❌ Tab Navigation (Host/Community tabs)
- ❌ Bottom Navigation (Mobile nav bar)

---

## CSS STYLING NOTES

### Session Button
**File**: `apps/top-comment/src/index.css` (line 540+)
- Class: `.chaos-session-button`
- Min-height: `33dvh`
- Arcade-style with rotation and shadow effects
- Phase-specific color gradients

### Grid Layouts
- Dailies: `grid-cols-3 gap-3`
- More: `grid-cols-3 gap-3`
- Consistent sizing across all cards

---

## MAPPING GUIDE FOR CHATGPT

When making changes to this file:
1. Specify which section you're modifying
2. Describe the change clearly
3. Update the ASCII diagrams if layout changes
4. Note any new files that would be needed
5. Indicate priority/hierarchy changes

The human will then map your changes back to the actual TypeScript/React files.
