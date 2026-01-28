# Future Multi-Game Event Platform

## Overview
This document outlines the planned multi-game event functionality that was originally implemented in the EventManager class. The EventManager was removed due to TypeScript errors and lack of current usage, but the concept remains valuable for future development.

## Vision
Create a multi-game event platform that allows hosts to orchestrate complex events with multiple games, rounds, and tournaments.

## Core Concepts

### Event Structure
```typescript
interface EventRound {
  gameId: GameId;           // Which game to play
  duration: number;          // How long the round lasts (seconds)
  settings?: Record<string, unknown>; // Game-specific settings
}

interface EventConfig {
  name: string;              // Event name
  venueId?: string;          // Venue/location
  rounds: EventRound[];       // Sequence of games/rounds
}
```

### Use Cases

#### 1. Tournament Style Events
```
Event: "Friday Night Gaming"
Rounds: [
  { gameId: "top-comment", duration: 300, settings: { category: "funny" } },
  { gameId: "trivia-quiz", duration: 240, settings: { difficulty: "medium" } },
  { gameId: "top-comment", duration: 300, settings: { category: "serious" } }
]
```

#### 2. Multi-Game Sessions
```
Event: "Variety Night"
Rounds: [
  { gameId: "music-quiz", duration: 180 },
  { gameId: "top-comment", duration: 240 },
  { gameId: "word-puzzle", duration: 200 }
]
```

#### 3. Progressive Events
```
Event: "Gaming Championship"
Rounds: [
  { gameId: "top-comment", duration: 300, settings: { round: 1, category: "qualifying" } },
  { gameId: "top-comment", duration: 300, settings: { round: 2, category: "semi-finals" } },
  { gameId: "top-comment", duration: 300, settings: { round: 3, category: "finals" } }
]
```

## Planned API

### EventManager Class
```typescript
class EventManager {
  constructor(registry: GameRegistry)
  
  async createEvent(client: SupabaseClient, config: EventConfig): Promise<string>
  async startEvent(client: SupabaseClient, sessionId: string): Promise<void>
  async advanceToNextRound(client: SupabaseClient, sessionId: string, currentRound: number): Promise<void>
  // Future methods:
  async pauseEvent(client: SupabaseClient, sessionId: string): Promise<void>
  async resumeEvent(client: SupabaseClient, sessionId: string): Promise<void>
  async endEvent(client: SupabaseClient, sessionId: string): Promise<void>
  async getEventResults(client: SupabaseClient, sessionId: string): Promise<EventResults>
}
```

## Integration Points

### Event Platform App
- Multi-game event host interface
- Event scheduling and management
- Tournament bracket visualization
- Real-time event monitoring

### Game Engine
- Game Registry for available games
- Round transition orchestration
- Score aggregation across games
- Leaderboard management

### Individual Games
- Support for game-specific settings
- Round-aware game logic
- Event result reporting

## Database Schema Considerations

### Sessions Table Extensions
```sql
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS event_config JSONB;
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS current_round INTEGER DEFAULT 0;
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS total_rounds INTEGER DEFAULT 1;
```

### Event Results Table
```sql
CREATE TABLE IF NOT EXISTS event_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES sessions(id),
  round_number INTEGER,
  game_id TEXT,
  results JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);
```

## Implementation Priority

### Phase 1: Core Event Management
- [ ] Basic EventManager class
- [ ] Event creation and start/stop
- [ ] Round transitions
- [ ] Database schema updates

### Phase 2: Event Platform UI
- [ ] Event creation interface
- [ ] Event scheduling calendar
- [ ] Real-time event monitoring
- [ ] Event history and results

### Phase 3: Advanced Features
- [ ] Tournament brackets
- [ ] Multi-venue support
- [ ] Event templates
- [ ] Automated event scheduling

### Phase 4: Game Integration
- [ ] Game-specific settings UI
- [ ] Score aggregation system
- [ ] Cross-game leaderboards
- [ ] Event result analytics

## Technical Considerations

### Game Registry Integration
- Dynamic game loading
- Game compatibility checking
- Setting validation per game

### Real-time Updates
- Event state synchronization
- Round progress broadcasting
- Live score updates

### Error Handling
- Game failure recovery
- Round timeout handling
- Event rollback capabilities

## Notes for Future Implementation

1. **Start Simple**: Begin with basic two-game events before complex tournaments
2. **Backward Compatibility**: Ensure existing single-game sessions continue to work
3. **Modular Design**: Keep event logic separate from individual game logic
4. **Testing Strategy**: Multi-game events will need comprehensive integration testing
5. **Performance**: Consider impact of game switching on user experience

## Related Files
- `src/types.ts` - Core game types
- `src/GameRegistry.ts` - Game registration system
- `src/GameEngine.ts` - Core game orchestration

---
*This document serves as a roadmap for implementing multi-game events when the platform is ready for this level of complexity.*
