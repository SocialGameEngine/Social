# Asynchronous Interactions System

## Overview
A flexible asynchronous interaction system that allows hosts to send various types of engagements on-demand to room members, operating independently of the structured session system. Designed to support multiple interaction types: prompts, trivia questions, polls, and user-generated content.

## System Architecture

### Core Design Principles
1. **Type-Extensible**: Base system supports current prompt-answer-vote pattern but designed for expansion
2. **Session-Independent**: Operates alongside structured sessions without interference
3. **Real-time**: Uses existing WebSocket infrastructure for immediate updates
4. **Unified Interface**: Consistent UX across all interaction types

### Interaction Type Evolution
**Phase 1 (Current)**: Simple prompts with responses
**Phase 2 (Near Future)**: Trivia questions, polls, user-written prompts
**Phase 3 (Future)**: Complex interactions, multimedia content, scheduled interactions

## Key Differences from Current Synchronous Mode

### Current Mode (Synchronous)
- Multiple rounds with predefined structure
- Timed phases (Setup → Voting → Results)
- All participants participate simultaneously
- Host controls progression through phases

### Current Implementation (Phase 1)
- **Prompt-Response Pattern**: Host sends prompt, members respond
- **No Time Limits**: Participants respond when available
- **Real-time Updates**: Responses appear as submitted
- **Host Controls**: Send prompts anytime, view responses live

### Future Expansion (Phase 2+)
- **Trivia Questions**: Questions with correct/incorrect answers
- **Polls**: Multiple choice with real-time result visualization
- **User-Generated Prompts**: Members can submit prompt suggestions
- **Scheduled Interactions**: Time-delayed or recurring interactions

## User Experience Flow

### Host Experience
1. **Room Setup**: Room exists as normal (no special "async mode" needed)
2. **Empty State**: Welcome message guides host to start engagement
3. **Send Prompt**: Host has a "Send Quick Prompt" button in room
4. **View Responses**: See responses as they come in real-time
5. **Send Another**: Can send additional prompts anytime

### Participant Experience
1. **Join Room**: Same flow as always
2. **Empty State**: Welcome message while waiting for engagement
3. **Wait for Prompts**: Room shows normal lobby OR active session
4. **Get Notification**: Real-time alert when host sends async prompt
5. **Respond**: Submit response when ready (no time pressure)
6. **Continue**: Can participate in regular sessions alongside async prompts

## Engagement Panel Design

### Current Host Panel Layout
Based on existing RoomPage, the host currently sees:
- Room code and header
- **Primary Session Panel** (to be renamed Engagement Panel) - Phase-based game controls (Lobby → Answer → Vote → Results)
- **Secondary Room Canvas** - Contains widgets (ActivityFeed, Chat, Polls, Trivia)
- **RoomInfoRail** - Right sidebar with room info and memberships
- Bottom navigation (mobile only)

### Proposed Engagement Panel Integration
All engagement activities (sessions + async interactions) appear in the renamed Primary Engagement Panel:

```
┌─────────────────────────────────────────┐
│ Room: ABCD                [Leave]       │
├─────────────────────────────────────────┤
│                                         │
│  [Primary Engagement Panel]              │
│  ┌─────────────────────────────────────┐ │
│  │ 🎮 Start Session                    │ │
│  │ [Begin Game]                        │ │
│  └─────────────────────────────────────┘ │
│                                         │
│  ┌─────────────────────────────────────┐ │
│  │ 🎯 Quick Prompt                     │ │
│  │ [Send Prompt]                       │ │
│  └─────────────────────────────────────┘ │
│                                         │
├─────────────────────────────────────────┤
│                                         │
│  [Secondary Room Canvas]                │
│  (ActivityFeed, Chat, Polls, Trivia)    │
│                                         │
├─────────────────────────────────────────┤
│                                         │
│  [RoomInfoRail]                         │
│  (Room info & memberships)              │
│                                         │
└─────────────────────────────────────────┘
```

### Engagement Panel with Session Priority
Session appears at top when exists, async interactions follow in the Primary Engagement Panel:

```
┌─────────────────────────────────────────┐
│ Room: ABCD                [Leave]       │
├─────────────────────────────────────────┤
│                                         │
│  [Primary Engagement Panel]              │
│  ┌─────────────────────────────────────┐ │
│  │ 📝 Answer Phase                     │ │
│  │ "What's your favorite game?"        │ │
│  │ ⏰ 2:30 remaining    [Respond Now]  │ │
│  └─────────────────────────────────────┘ │
│                                         │
│  ┌─────────────────────────────────────┐ │
│  │ 🎯 Quick Prompt                     │ │
│  │ "How's everyone feeling?"           │ │
│  │ 👥 3/5 responses     [View Results] │ │
│  └─────────────────────────────────────┘ │
│                                         │
├─────────────────────────────────────────┤
│                                         │
│  [Secondary Room Canvas]                │
│  (ActivityFeed, Chat, Polls, Trivia)    │
│                                         │
├─────────────────────────────────────────┤
│                                         │
│  [RoomInfoRail]                         │
│  (Room info & memberships)              │
│                                         │
└─────────────────────────────────────────┘
```

## Empty State Design

### Host Empty State (No Session, No Active Prompts)
```
┌─────────────────────────────────────────┐
│ Room: ABCD                [Leave]       │
├─────────────────────────────────────────┤
│                                         │
│  [Primary Engagement Panel]              │
│  ┌─────────────────────────────────────┐ │
│  │    🎯 Ready to engage your room?   │ │
│  │                                     │ │
│  │ Send a quick prompt to get the      │ │
│  │ conversation started, or start a   │ │
│  │ full session when everyone's ready! │ │
│  │                                     │ │
│  │    [Send Quick Prompt]              │ │
│  │    [Start Full Session]             │ │
│  └─────────────────────────────────────┘ │
│                                         │
├─────────────────────────────────────────┤
│                                         │
│  [Secondary Room Canvas]                │
│  (ActivityFeed, Chat, Polls, Trivia)    │
│                                         │
├─────────────────────────────────────────┤
│                                         │
│  [RoomInfoRail]                         │
│  (Room info & memberships)              │
│                                         │
└─────────────────────────────────────────┘
```

### Participant Empty State (No Session, No Active Prompts)
```
┌─────────────────────────────────────────┐
│ Room: ABCD                [Leave]       │
├─────────────────────────────────────────┤
│                                         │
│  [Primary Engagement Panel]              │
│  ┌─────────────────────────────────────┐ │
│  │    🎯 Welcome to the room!          │ │
│  │                                     │ │
│  │ The host will start an activity      │ │
│  │ soon - could be a full session or    │ │
│  │ a quick prompt. Get ready to        │ │
│  │ participate!                        │ │
│  │                                     │ │
│  │    👥 Waiting for host...           │ │
│  │                                     │ │
│  │    [Notify Me When Ready]           │ │
│  └─────────────────────────────────────┘ │
│                                         │
├─────────────────────────────────────────┤
│                                         │
│  [Secondary Room Canvas]                │
│  (ActivityFeed, Chat, Polls, Trivia)    │
│                                         │
├─────────────────────────────────────────┤
│                                         │
│  [RoomInfoRail]                         │
│  (Room info & memberships)              │
│                                         │
└─────────────────────────────────────────┘
```

### Participant Waiting for Prompt
```
┌─────────────────────────────────────────┐
│ Room: ABCD                [Leave]       │
├─────────────────────────────────────────┤
│                                         │
│  [Primary Engagement Panel]              │
│  ┌─────────────────────────────────────┐ │
│  │    🎯 Quick Prompt Incoming!      │ │
│  │                                     │ │
│  │ Your host is preparing a prompt     │ │
│  │ for the room. Get ready to share   │ │
│  │ your thoughts!                     │ │
│  │                                     │ │
│  │    📝 Waiting for prompt...         │ │
│  │                                     │ │
│  │    [Enable Notifications]           │ │
│  └─────────────────────────────────────┘ │
│                                         │
├─────────────────────────────────────────┤
│                                         │
│  [Secondary Room Canvas]                │
│  (ActivityFeed, Chat, Polls, Trivia)    │
│                                         │
├─────────────────────────────────────────┤
│                                         │
│  [RoomInfoRail]                         │
│  (Room info & memberships)              │
│                                         │
└─────────────────────────────────────────┘
```

### Participant Active Prompt (No Session)
```
┌─────────────────────────────────────────┐
│ Room: ABCD                [Leave]       │
├─────────────────────────────────────────┤
│                                         │
│  [Primary Engagement Panel]              │
│  ┌─────────────────────────────────────┐ │
│  │ 🎯 Quick Prompt                     │ │
│  │ "How's everyone feeling?"           │ │
│  │                                     │ │
│  │ Share your thoughts with the room!  │ │
│  │                                     │ │
│  │    [Submit Response]                │ │
│  └─────────────────────────────────────┘ │
│                                         │
├─────────────────────────────────────────┤
│                                         │
│  [Secondary Room Canvas]                │
│  (ActivityFeed, Chat, Polls, Trivia)    │
│                                         │
├─────────────────────────────────────────┤
│                                         │
│  [RoomInfoRail]                         │
│  (Room info & memberships)              │
│                                         │
└─────────────────────────────────────────┘
```

### Participant Active Session + Prompt
```
┌─────────────────────────────────────────┐
│ Room: ABCD                [Leave]       │
├─────────────────────────────────────────┤
│                                         │
│  [Primary Engagement Panel]              │
│  ┌─────────────────────────────────────┐ │
│  │ 📝 Answer Phase                     │ │
│  │ "What's your favorite game?"        │ │
│  │ ⏰ 2:30 remaining    [Respond Now]  │ │
│  └─────────────────────────────────────┘ │
│                                         │
│  ┌─────────────────────────────────────┐ │
│  │ 🎯 Bonus Prompt                     │ │
│  │ "How's everyone feeling?"           │ │
│  │                                     │ │
│  │    [Submit Response]                │ │
│  └─────────────────────────────────────┘ │
│                                         │
├─────────────────────────────────────────┤
│                                         │
│  [Secondary Room Canvas]                │
│  (ActivityFeed, Chat, Polls, Trivia)    │
│                                         │
├─────────────────────────────────────────┤
│                                         │
│  [RoomInfoRail]                         │
│  (Room info & memberships)              │
│                                         │
└─────────────────────────────────────────┘
```

## Host Interaction States

### 1. Empty State (Engagement Panel - Welcome Message)
```
┌─────────────────────────────────────────┐
│ Room: ABCD                [Leave]       │
├─────────────────────────────────────────┤
│                                         │
│  [Primary Engagement Panel]              │
│  ┌─────────────────────────────────────┐ │
│  │    🎯 Ready to engage your room?   │ │
│  │                                     │ │
│  │ Send a quick prompt to get the      │ │
│  │ conversation started, or start a   │ │
│  │ full session when everyone's ready! │ │
│  │                                     │ │
│  │    [Send Quick Prompt]              │ │
│  │    [Start Full Session]             │ │
│  └─────────────────────────────────────┘ │
│                                         │
├─────────────────────────────────────────┤
│                                         │
│  [Secondary Room Canvas]                │
│  (ActivityFeed, Chat, Polls, Trivia)    │
│                                         │
├─────────────────────────────────────────┤
│                                         │
│  [RoomInfoRail]                         │
│  (Room info & memberships)              │
│                                         │
└─────────────────────────────────────────┘
```

### 2. Active Prompt Only (Engagement Panel - No Session)
```
┌─────────────────────────────────────────┐
│ Room: ABCD                [Leave]       │
├─────────────────────────────────────────┤
│                                         │
│  [Primary Engagement Panel]              │
│  ┌─────────────────────────────────────┐ │
│  │ 🎯 Active Prompt                   │ │
│  │ "How's everyone feeling?"           │ │
│  │ 👥 3/5 responses     [View Results] │ │
│  └─────────────────────────────────────┘ │
│                                         │
├─────────────────────────────────────────┤
│                                         │
│  [Secondary Room Canvas]                │
│  (ActivityFeed, Chat, Polls, Trivia)    │
│                                         │
├─────────────────────────────────────────┤
│                                         │
│  [RoomInfoRail]                         │
│  (Room info & memberships)              │
│                                         │
└─────────────────────────────────────────┘
```

### 3. Multiple Active Prompts (Engagement Panel - No Session)
```
┌─────────────────────────────────────────┐
│ Room: ABCD                [Leave]       │
├─────────────────────────────────────────┤
│                                         │
│  [Primary Engagement Panel]              │
│  ┌─────────────────────────────────────┐ │
│  │ 🎯 "Icebreaker"                    │ │
│  │ 👥 4/5 responses     [View Results] │ │
│  └─────────────────────────────────────┘ │
│                                         │
│  ┌─────────────────────────────────────┐ │
│  │ 🎯 "Game Choice?"                  │ │
│  │ 👥 2/5 responses     [View Results] │ │
│  └─────────────────────────────────────┘ │
│                                         │
├─────────────────────────────────────────┤
│                                         │
│  [Secondary Room Canvas]                │
│  (ActivityFeed, Chat, Polls, Trivia)    │
│                                         │
├─────────────────────────────────────────┤
│                                         │
│  [RoomInfoRail]                         │
│  (Room info & memberships)              │
│                                         │
└─────────────────────────────────────────┘
```

### 4. Active Session Only (Engagement Panel - Session Priority)
```
┌─────────────────────────────────────────┐
│ Room: ABCD                [Leave]       │
├─────────────────────────────────────────┤
│                                         │
│  [Primary Engagement Panel]              │
│  ┌─────────────────────────────────────┐ │
│  │ 📝 Answer Phase                     │ │
│  │ "What's your favorite game?"        │ │
│  │ ⏰ 2:30 remaining    [Respond Now]  │ │
│  └─────────────────────────────────────┘ │
│                                         │
│  ┌─────────────────────────────────────┐ │
│  │ 🎯 Quick Prompt                     │ │
│  │ [Send New Prompt]                   │ │
│  └─────────────────────────────────────┘ │
│                                         │
├─────────────────────────────────────────┤
│                                         │
│  [Secondary Room Canvas]                │
│  (ActivityFeed, Chat, Polls, Trivia)    │
│                                         │
├─────────────────────────────────────────┤
│                                         │
│  [RoomInfoRail]                         │
│  (Room info & memberships)              │
│                                         │
└─────────────────────────────────────────┘
```

### 5. Session + Active Prompts (Engagement Panel - Session at Top)
```
┌─────────────────────────────────────────┐
│ Room: ABCD                [Leave]       │
├─────────────────────────────────────────┤
│                                         │
│  [Primary Engagement Panel]              │
│  ┌─────────────────────────────────────┐ │
│  │ 📝 Answer Phase                     │ │
│  │ "What's your favorite game?"        │ │
│  │ ⏰ 2:30 remaining    [Respond Now]  │ │
│  └─────────────────────────────────────┘ │
│                                         │
│  ┌─────────────────────────────────────┐ │
│  │ 🎯 "How's everyone feeling?"         │ │
│  │ 👥 3/5 responses     [View Results] │ │
│  └─────────────────────────────────────┘ │
│                                         │
├─────────────────────────────────────────┤
│                                         │
│  [Secondary Room Canvas]                │
│  (ActivityFeed, Chat, Polls, Trivia)    │
│                                         │
├─────────────────────────────────────────┤
│                                         │
│  [RoomInfoRail]                         │
│  (Room info & memberships)              │
│                                         │
└─────────────────────────────────────────┘
```

## Technical Implementation Considerations

### Data Model (Extensible Design)
```typescript
// Base interaction - supports current prompts and future types
interface AsyncInteraction {
  id: string;
  roomId: string;
  hostMembershipId: string;
  type: 'prompt' | 'trivia' | 'poll' | 'user_prompt'; // extensible
  content: InteractionContent; // varies by type
  sentAt: Date;
  isActive: boolean;
  status: 'answer' | 'vote' | 'results' | 'ended'; // phases like sessions
  settings: InteractionSettings; // type-specific configuration
  endsAt?: Date; // timing for phases
  currentPhaseEndsAt?: Date;
}

// Type-specific content structures
interface PromptContent {
  question: string;
  description?: string;
}

interface TriviaContent extends PromptContent {
  correctAnswer: string;
  explanation?: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

interface PollContent extends PromptContent {
  options: string[];
  allowMultiple: boolean;
}

// Unified response model - based on room_memberships, not teams
interface AsyncResponse {
  id: string;
  interactionId: string;
  membershipId: string; // room membership, not team
  content: ResponseContent; // varies by interaction type
  submittedAt: Date;
  metadata?: ResponseMetadata; // type-specific data
}

// Response content types
interface PromptResponse {
  text: string;
}

interface TriviaResponse extends PromptResponse {
  isCorrect: boolean;
  selectedAnswer: string;
}

interface PollResponse {
  selectedOptions: string[];
}

// Vote model for async prompts (like session votes)
interface AsyncVote {
  id: string;
  interactionId: string;
  voterMembershipId: string; // room membership
  responseId: string;
  submittedAt: Date;
}
```

### Database Schema Integration
Based on existing schema (@[Social/docs/database/Schema.sql]):
- **async_interactions** table (new, follows current naming convention for new features)
- **async_responses** table (new, similar to top_comment_answers table)  
- **async_votes** table (new, similar to top_comment_votes table)
- Links to **room_memberships** table (not teams)
- **rooms** table can have multiple active async_interactions simultaneously

**Note**: Current table naming convention:
- **New features** (like `rooms`, `async_interactions`) → No prefix
- **Core game tables** (like `top_comment_sessions`, `top_comment_answers`) → Use `top_comment_` prefix (these are the current/active versions)
- **Non-prefixed tables** (like `sessions`, `answers`) → Deprecated/old versions

### Room State Integration
- Rooms can have BOTH: `currentSessionId` (structured game) AND multiple active async_interactions
- Async interactions operate independently of session phases
- UI prioritizes session when active, shows interactions alongside
- Multiple interactions can be active simultaneously

### UI Components (Phase 1 - Prompts)
- **AsyncInteractionButton**: "Send Interaction" button for hosts
- **PromptModal**: Interface for composing/sending prompts
- **InteractionCard**: Display for active interactions (participants)
- **ResponseModal**: Response submission interface
- **ResultsView**: Real-time response display for host

### Future UI Components (Phase 2+)
- **TriviaModal**: Trivia question creation with answer validation
- **PollModal**: Poll creation with option management
- **UserPromptQueue**: Interface for managing user-submitted prompts
- **InteractionScheduler**: Scheduling interface for future interactions
- **TypeSelector**: UI for choosing interaction type when creating

## Real-time Updates
- Use existing WebSocket infrastructure (subscribe to async_interactions like sessions)
- Events: `interaction_sent`, `response_submitted`, `interaction_updated`
- Phase-specific events: `interaction_answer_phase`, `interaction_vote_phase`, `interaction_results_phase`
- Participants get real-time notifications for new interactions and phase changes
- Host sees responses appear in real-time
- RoomPage subscribes to both sessions and async_interactions independently

## Mobile-First Design

### Mobile Layout Priority
- **Mobile layout takes priority** in design decisions
- SessionPanel at top (fixed height)
- RoomCanvas with widgets as expandable overlay at bottom
- Async interactions appear in SessionPanel area
- Fullscreen modals for interaction phases (like current session modals)

### Mobile Interaction Flow
```
Mobile RoomPage Structure:
┌─────────────────────────┐
│ Room Header             │
├─────────────────────────┤
│ [Primary Engagement Panel] │ ← Async CTAs here
│ (SessionPanel area)     │
├─────────────────────────┤
│ [Room Canvas]           │ ← Widgets overlay
│ (expandable)            │
├─────────────────────────┤
│ Bottom Navigation       │ ← No special interactions
└─────────────────────────┘
```

### Fullscreen Modal Pattern
- Async prompt phases open fullscreen modals (like current session Answer/Vote modals)
- Same modal design language as existing session modals
- Modal types: AnswerModal, VoteModal, ResultsModal for async interactions
- Consistent UX between session and async interaction modals

## Benefits
1. **Flexibility**: Host can engage room anytime without committing to full session
2. **Low Barrier**: Quick interaction vs. structured game commitment
3. **Coexistence**: Works alongside existing sessions, doesn't replace them
4. **Extensibility**: Designed to grow from simple prompts to complex interactions
5. **Always Available**: Room doesn't need special "mode" - feature is always there
6. **Type Diversity**: Single system supports multiple engagement patterns
7. **Future-Proof**: Architecture supports planned expansion without major rewrites

## Use Cases by Phase

### Phase 1 (Prompts)
- **Icebreaker questions** while waiting for session to start
- **Room energy checks** ("How's everyone feeling?")
- **Spontaneous engagement** when discussion lags
- **Mobile-friendly interaction** (simpler than full session)

### Phase 2 (Trivia & Polls)
- **Knowledge checks** between sessions
- **Quick decision making** ("What game next?")
- **Audience engagement** during breaks
- **Learning reinforcement** for educational content

### Phase 3 (Advanced)
- **Scheduled interactions** for recurring meetings
- **User-generated content** for community engagement
- **Multimedia interactions** with images/videos
- **Complex workflows** with multi-step interactions

## Implementation Phases

### Phase 1: Core Prompt System (Current Focus)
- **Data Model**: AsyncInteraction (prompt type only)
- **Basic Flow**: Host sends prompt → Members respond → Real-time display
- **UI Integration**: Simple overlay, doesn't interfere with session UI
- **Real-time Updates**: WebSocket integration for live responses
- **Testing**: Validate core interaction pattern before expansion

### Phase 2: Type Expansion (Near Future)
- **Trivia Integration**: Questions with correct/incorrect validation
- **Poll System**: Multiple choice with real-time result visualization
- **User Prompts**: Queue system for member-submitted content
- **Enhanced UI**: Type selection, specialized creation interfaces
- **Analytics**: Response tracking and engagement metrics

### Phase 3: Advanced Features (Future)
- **Scheduling**: Time-delayed or recurring interactions
- **Multimedia**: Image/video support in interactions
- **Complex Workflows**: Multi-step interactions, conditional logic
- **Integration**: Connect with external content sources
- **Advanced Analytics**: Engagement patterns, user preferences

## Detailed Component Designs

### Send Prompt Modal
```
┌─────────────────────────────────────────┐
│ 🎯 Send Quick Interaction               │
├─────────────────────────────────────────┤
│                                         │
│ Type: [Prompt ▼]                        │
│ ────────────────────────────────────── │
│                                         │
│ Question:                               │
│ ┌─────────────────────────────────────┐ │
│ │ How's everyone feeling today?      │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ (Optional) Description:                 │
│ ┌─────────────────────────────────────┐ │
│ │ Let me know your energy level!     │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ ☑️ Allow anonymous responses            │
│ ☑️ Show response count to participants  │
│                                         │
│               [Cancel] [Send Prompt]    │
└─────────────────────────────────────────┘
```

### Results View Modal
```
┌─────────────────────────────────────────┐
│ 📊 Interaction Results                  │
├─────────────────────────────────────────┤
│ 📝 "How's everyone feeling?"            │
│ ⏰ Sent 5 minutes ago                   │
│ 👥 5 responses                          │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ 👤 John: "Great! Ready to play!"   │ │
│ │ 👤 Sarah: "A bit tired but excited"│ │
│ │ 👤 Mike: "Feeling good!"           │ │
│ │ 👤 Alex: "Ready when you are!"     │ │
│ │ 👤 Sam: "Let's do this!"           │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ [Close Prompt] [Send Follow-up]         │
└─────────────────────────────────────────┘
```

### History View
```
┌─────────────────────────────────────────┐
│ 📜 Interaction History                   │
├─────────────────────────────────────────┤
│                                         │
│ 🟢 Active Interactions (2)              │
│ ────────────────────────────────────── │
│ 📝 "Icebreaker"     👥 4/5  2m ago    │
│ 📝 "Game choice?"   👥 2/5  5m ago    │
│                                         │
│ 🟵 Past Interactions (12)               │
│ ────────────────────────────────────── │
│ 📝 "Energy check"   👥 5/5  1h ago    │
│ 📝 "Food break?"    👥 3/5  2h ago    │
│ 📝 "Weekend plans"  👥 4/5  Yesterday │
│ ... [Load More]                          │
│                                         │
└─────────────────────────────────────────┘
```

## Mobile Considerations

### Bottom Sheet Approach (Mobile)
```
┌─────────────────────────────────────────┐
│ Room: ABCD                    [≡] [🎯] │
├─────────────────────────────────────────┤
│                                         │
│  [Current Phase/Game Content]           │
│                                         │
│  [RoomInfoRail]                         │
│  (Room info & memberships)              │
│                                         │
└─────────────────────────────────────────┘
├─────────────────────────────────────────┤
│ 🎯 Quick Interactions      [↑] [Close] │
│ ────────────────────────────────────── │
│ 📝 "How's everyone feeling?" 👥 3/5    │
│ [Send New] [View Results]               │
└─────────────────────────────────────────┘
```

## Integration Points

### When Session is Active
- Async interactions appear as a **non-intrusive overlay**
- Session controls remain primary focus
- Small indicator shows active async interactions
- Host can switch between session and interaction management

### When No Session is Active
- Async interactions become **primary engagement tool**
- Larger, more prominent in the UI
- Helps maintain room engagement between sessions

## Prompt Sources for Hosts

### 1. Manual Creation (Primary Method)
Hosts can create prompts on-demand through the "Send Prompt" interface:

```
┌─────────────────────────────────────────┐
│ 🎯 Send Quick Interaction               │
├─────────────────────────────────────────┤
│                                         │
│ Question:                               │
│ ┌─────────────────────────────────────┐ │
│ │ [Host types their question here]  │ │
│ └─────────────────────────────────────┘ │
│                                         │
│               [Cancel] [Send Prompt]    │
└─────────────────────────────────────────┘
```

### 2. Prompt Library/Template System
Pre-built prompts organized by category:

```
┌─────────────────────────────────────────┐
│ 📚 Prompt Library                       │
├─────────────────────────────────────────┤
│ 🔍 [Search prompts...]                  │
│                                         │
│ 📋 Categories:                          │
│ • Icebreakers (12)                       │
│ • Energy Checks (8)                      │
│ • Game Prep (15)                         │
│ • Feedback (10)                          │
│ • Custom (3)                             │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ 🧊 Icebreaker Questions             │ │
│ │ • "What's your favorite game?"      │ │
│ │ • "Best thing that happened today?" │ │
│ │ • "If you could have any superpower?"│ │
│ │                                   [Use]│ │
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

### 3. User-Submitted Prompts (Phase 2)
Community members can suggest prompts:

```
┌─────────────────────────────────────────┐
│ 💡 User Prompt Suggestions               │
├─────────────────────────────────────────┤
│                                         │
│ 🟢 Approved (5)                         │
│ ────────────────────────────────────── │
│ 👤 Sarah: "Best snack for gaming?"     │
│ 👤 Mike: "Dream vacation destination?"  │
│                                   [Use] │
│                                         │
│ 🟡 Pending Review (3)                   │
│ ────────────────────────────────────── │
│ 👤 Alex: "Worst game ever played?"     │
│                             [Approve] │
│                                         │
│ ➕ [View All Suggestions]               │
└─────────────────────────────────────────┘
```

### 4. Recent/Favorites System
Quick access to frequently used prompts:

```
┌─────────────────────────────────────────┐
│ ⭐ Quick Prompts                         │
├─────────────────────────────────────────┤
│                                         │
│ 🔄 Recently Used                         │
│ • "How's everyone feeling?"             │
│ • "Ready to start?"                     │
│ • "What should we play next?"           │
│                                         │
│ ⭐ Favorites                             │
│ • "Best gaming memory?"                  │
│ • "Weekend plans?"                      │
│                                         │
│ ➕ [Add to Favorites]                    │
└─────────────────────────────────────────┘
```

## Prompt Management Workflow

### Host Prompt Creation Flow
```
1. Host clicks "Send Prompt"
2. Choose source:
   - [Create New] → Type question manually
   - [From Library] → Browse categories
   - [Recent/Favorites] → Quick selection
   - [User Suggestions] → Community prompts (Phase 2)
3. Customize (optional):
   - Add description/context
   - Set anonymity preferences
   - Adjust response visibility
4. Send to room
```

### Library Management
```
┌─────────────────────────────────────────┐
│ 📚 Manage Prompt Library                 │
├─────────────────────────────────────────┤
│                                         │
│ ➕ Add New Prompt                         │
│ ┌─────────────────────────────────────┐ │
│ │ Question: [Type prompt]             │ │
│ │ Category: [Select ▼]                │ │
│ │ Tags: #icebreaker #energy            │ │
│ │                                     │ │
│ │ ☑️ Add to my favorites              │ │
│ │ ☑️ Share with community             │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ 📝 Your Custom Prompts (3)              │
│ • "Best gaming snack?"        [Edit]   │
│ • "Weekend gaming plans?"     [Delete] │
│                                         │
│ 🌍 Community Prompts (45)                │
│ • "Favorite game genre?"      [Like]   │
│                                         │
└─────────────────────────────────────────┘
```

## Prompt Quality & Moderation

### Community Guidelines
- Prompts should be inclusive and welcoming
- No controversial or sensitive topics
- Keep questions appropriate for all ages
- Encourage positive engagement

### Approval Workflow (Phase 2)
```
User Submits Prompt → Auto-Filter → Moderator Review → Approved/Live
```

### Prompt Analytics
Hosts can see which prompts work best:
- Response rate
- Engagement time
- Participant feedback
- Popular categories

## Integration with Existing Features

### Connection to Sessions
- Prompts can be used **between** sessions to maintain engagement
- Icebreaker prompts while waiting for participants
- Feedback prompts after sessions end

### VIBox Integration
- Prompts could trigger VIBox animations
- "Energy level" prompts could affect music selection
- Response celebrations with sound effects

### Mobile Optimization
- Quick prompt templates for mobile hosts
- Voice-to-text prompt creation
- Gesture-based prompt selection

## Phase 1 Implementation (Current Focus)

### Minimal Viable Product
- **Manual creation only** - Host types prompts
- **No library system** - Simple text input
- **Basic categorization** - Maybe tags like "icebreaker", "energy"
- **Recent prompts** - Simple local storage of last 5 used

### Simple UI for Phase 1
```
┌─────────────────────────────────────────┐
│ 🎯 Send Quick Prompt                    │
├─────────────────────────────────────────┤
│                                         │
│ Question:                               │
│ ┌─────────────────────────────────────┐ │
│ │ [Type your prompt here...]         │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ 💡 Quick ideas:                         │
│ • "How's everyone feeling?"             │
│ • "Ready to start?"                     │
│ • "What should we play next?"           │
│                                         │
│               [Cancel] [Send Prompt]    │
└─────────────────────────────────────────┘
```

This phased approach starts simple with manual prompt creation and builds up to a comprehensive prompt management system as the feature matures.

## Visual Design Considerations

### Color Coding
- 🟢 **Green**: Active interactions
- 🔵 **Blue**: Participant responses
- 🟡 **Yellow**: Pending/follow-up needed
- ⚪ **Gray**: Inactive/historical

### Iconography
- 🎯 **Target**: Quick interactions main icon
- 📝 **Memo**: Text prompts
- 📊 **Chart**: Results/analytics
- 👥 **People**: Participant count
- ⏰ **Clock**: Timing information

### Animation
- **Slide-up** for new interaction notifications
- **Fade-in** for new responses
- **Pulse** for interaction count updates
- **Slide-down** for interaction panels

## Questions to Consider

### Phase 1 (Prompts)
1. **UI Priority**: How do interactions display when a session is active?
2. **Notification Strategy**: How prominent should interaction notifications be?
3. **Response Visibility**: Do participants see who else has responded?
4. **Host Controls**: Can host delete/close interactions? Set time limits?
5. **Data Retention**: How long do we keep interaction history?
6. **Abuse Prevention**: Rate limiting for hosts sending interactions?

### Phase 2+ (Future Types)
1. **Type Selection**: How do hosts choose interaction types?
2. **UI Consistency**: Maintain similar UX across different interaction types?
3. **Response Validation**: How to handle trivia answers vs. free text?
4. **Result Display**: Different visualization needs for polls vs. prompts?
5. **User Content**: Moderation workflow for user-generated prompts?
6. **Complexity Management**: Prevent UI overwhelm with many interaction types?

## Next Steps

### Phase 1 Implementation
1. **Define Base Data Model**: AsyncInteraction table with type extensibility
2. **Implement Prompt Flow**: Basic prompt-response functionality
3. **Design UI Integration**: How it coexists with existing RoomPage and sessions
4. **Plan API Endpoints**: Creation, response submission, real-time updates
5. **Create Technical Spec**: WebSocket events, database schema, component structure
6. **Define Test Strategy**: Validate interaction pattern before expansion

### Future Preparation
1. **Type System Design**: Plan extensible type system for future interactions
2. **UI Component Architecture**: Design reusable components for different types
3. **Analytics Framework**: Prepare data tracking for engagement metrics
4. **Content Moderation**: Plan for user-generated content workflows

This design maintains the current session-focused experience while adding powerful async interaction capabilities that don't compete with the main game flow.
