# Sociale Game Flow Implementation

## Current Issues
- Game phases don't match the intended flow for different round types
- Topics and Trivia both have unnecessary Discussion phase
- Trivia has inappropriate Vote phase
- Reveal phase comes after Results instead of before

## New Game Flow Requirements

### 1. Topics Mode Flow
```
Answer Phase → Reveal Phase → Results Phase
```

**Phases:**
- **Answer Phase**: Players submit topic responses
- **Reveal Phase**: Show the most voted-for response (the "topic")
- **Results Phase**: Show leaderboard after points are awarded

### 2. Trivia Mode Flow  
```
Answer Phase → Reveal Phase → Results Phase
```

**Phases:**
- **Answer Phase**: Players submit trivia answers
- **Reveal Phase**: Show the correct trivia answer
- **Results Phase**: Show leaderboard after points are awarded

### 3. Alternating Mode Flow
```
For each round:
  - If Topic: Answer → Reveal → Results
  - If Trivia: Answer → Reveal → Results
```

## Phase Implementation Details

### Answer Phase
- **Purpose**: Players submit their responses
- **Duration**: Configurable (default 60 seconds)
- **UI**: Response input, timer, player list
- **Valid for**: All round types (topic, trivia)

### Reveal Phase
- **Purpose**: Show the "answer" for the round
- **Duration**: Short (default 5-10 seconds)
- **UI**: 
  - **Topics**: Most voted response highlighted
  - **Trivia**: Correct answer revealed
- **Valid for**: All round types (topic, trivia)

### Results Phase
- **Purpose**: Show updated leaderboard
- **Duration**: Short (default 5-10 seconds)  
- **UI**: Scoreboard, round winner, points awarded
- **Valid for**: All round types (topic, trivia)

## Removed Phases

### Discussion Phase
- **Status**: REMOVED for both Topics and Trivia
- **Reason**: Unnecessary, adds no value, slows down game

### Vote Phase (Trivia only)
- **Status**: REMOVED for Trivia rounds
- **Reason**: Trivia questions have factual answers, no voting needed
- **Status**: KEPT for Topic rounds (embedded in Answer phase logic)

## Technical Implementation

### Phase Configuration
```typescript
const phaseConfig = {
  topic: ['answer', 'reveal', 'results'],
  trivia: ['answer', 'reveal', 'results']
};
```

### Phase Duration Defaults
```typescript
const phaseDurations = {
  answer: 60,    // seconds
  reveal: 5,      // seconds  
  results: 5      // seconds
};
```

### Phase Logic Changes
1. **Phase Generation**: Use round type to determine phase sequence
2. **Phase Advancement**: Skip removed phases automatically
3. **UI Rendering**: Conditionally render based on current phase and round type
4. **Scoring**: Award points in Reveal phase, show in Results phase

## Files to Modify

### Core Phase Logic
- `src/features/sociale/socialeService.ts` - Phase advancement logic
- `src/domain/sociale/roundRegistry.ts` - Phase configuration

### Phase Components  
- `src/features/host/SocialePhases/SocialeAnswerPhase.tsx`
- `src/features/host/SocialePhases/SocialeRevealPhase.tsx` (new)
- `src/features/host/SocialePhases/SocialeResultsPhase.tsx`
- `src/features/host/SocialePhases/SocialeVotePhase.tsx` (modify for topics only)

### Player View
- `src/features/player/SocialePlayerView.tsx` - Phase rendering logic

## Implementation Steps

1. **Update Phase Configuration** - Define new phase sequences
2. **Create Reveal Phase Component** - Handle both topic and trivia reveal
3. **Modify Phase Advancement** - Skip removed phases
4. **Update Vote Phase** - Only show for topic rounds
5. **Update Player View** - Handle new phase flow
6. **Test All Modes** - Topics, Trivia, Alternating
7. **Update Documentation** - Reflect new game flow

## Success Criteria

- ✅ Topics: Answer → Reveal → Results
- ✅ Trivia: Answer → Reveal → Results  
- ✅ Alternating: Correct flow based on round type
- ✅ No Discussion phase for either mode
- ✅ No Vote phase for trivia rounds
- ✅ Reveal shows appropriate content (topic vs answer)
- ✅ Results shows updated leaderboard
- ✅ Smooth phase transitions
- ✅ Proper scoring integration
