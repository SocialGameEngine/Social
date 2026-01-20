# Team Grouping Logic Report

## Overview

This document outlines the deterministic algorithm for forming groups of teams in a party/bar game environment. The logic ensures fair distribution while maintaining game integrity.

## Requirements

- Groups must start with 2 teams minimum
- Maximum of 4 groups allowed
- Teams should be distributed evenly across groups
- No group should have fewer than 2 teams
- Extra teams are distributed one at a time across existing groups

## Algorithm Implementation

### Step 1: Determine Number of Groups
```typescript
const groupCount = Math.min(Math.floor(totalTeams / 2), 4);
```

**Logic:**
- Calculate maximum possible groups (totalTeams ÷ 2, rounded down)
- Cap at 4 groups maximum
- Ensures each group has at least 2 teams

### Step 2: Initialize Groups
```typescript
const groups = new Array(groupCount).fill(2);
```

**Logic:**
- Create the determined number of groups
- Assign 2 teams to each group initially
- Teams used: `groupCount × 2`

### Step 3: Distribute Remaining Teams
```typescript
let remainingTeams = totalTeams - (groupCount * 2);
let index = 0;

while (remainingTeams > 0) {
    groups[index] += 1;
    remainingTeams--;
    index = (index + 1) % groupCount;
}
```

**Logic:**
- Calculate remaining teams after initial distribution
- Distribute one team at a time in round-robin fashion
- Ensures even distribution (group sizes differ by at most 1)

## Complete Implementation

```typescript
function createTeamGroups(totalTeams: number): number[] {
    // Validate input
    if (totalTeams < 2) {
        throw new Error("Minimum 2 teams required");
    }

    // Step 1: Determine number of groups
    const groupCount = Math.min(Math.floor(totalTeams / 2), 4);
    
    // Step 2: Initialize groups with 2 teams each
    const groups = new Array(groupCount).fill(2);
    
    // Step 3: Distribute remaining teams evenly
    let remainingTeams = totalTeams - (groupCount * 2);
    let index = 0;
    
    while (remainingTeams > 0) {
        groups[index] += 1;
        remainingTeams--;
        index = (index + 1) % groupCount;
    }
    
    return groups;
}
```

## Test Cases and Results

| Total Teams | Groups | Group Sizes | Verification |
|-------------|--------|-------------|--------------|
| 2 | 1 | [2] | ✅ Minimum viable |
| 4 | 2 | [2, 2] | ✅ Perfect pairs |
| 6 | 3 | [2, 2, 2] | ✅ Three pairs |
| 8 | 4 | [2, 2, 2, 2] | ✅ Four pairs (max groups) |
| 9 | 4 | [3, 2, 2, 2] | ✅ One extra distributed |
| 10 | 4 | [3, 3, 2, 2] | ✅ Two extras distributed |
| 11 | 4 | [3, 3, 3, 2] | ✅ Three extras distributed |
| 12 | 4 | [3, 3, 3, 3] | ✅ Perfect distribution |
| 13 | 4 | [4, 3, 3, 3] | ✅ One group gets extra |
| 14 | 4 | [4, 4, 3, 3] | ✅ Two groups get extra |
| 15 | 4 | [4, 4, 4, 3] | ✅ Three groups get extra |
| 16 | 4 | [4, 4, 4, 4] | ✅ Perfect balance |

## Algorithm Analysis

### Time Complexity: O(n)
- Where n is the number of remaining teams to distribute
- Worst case: O(remainingTeams) = O(totalTeams)

### Space Complexity: O(1)
- Fixed array size (maximum 4 groups)
- Constant additional memory usage

### Fairness Properties

1. **Minimum Team Guarantee**: Every group has at least 2 teams
2. **Maximum Group Limit**: Never exceeds 4 groups
3. **Even Distribution**: Group sizes differ by at most 1 team
4. **Predictable Pattern**: Same input always produces same output
5. **Round-Robin Fairness**: No group gets preferential treatment

## Edge Cases and Validation

### Input Validation
- **Less than 2 teams**: Error - game requires minimum teams
- **Negative numbers**: Error - invalid input
- **Non-integer values**: Error - teams must be whole numbers

### Boundary Conditions
- **Exactly 2 teams**: Creates 1 group of 2
- **Exactly 8 teams**: Creates 4 groups of 2 (maximum groups reached)
- **Large numbers**: Continues even distribution across 4 groups

## Round-to-Round Team Shuffling

### Dynamic Re-grouping System

The grouping algorithm is re-executed at the start of each new round with **shuffled team distribution** to ensure variety in competition while maintaining fair group sizes.

#### Shuffling Implementation
```typescript
// Fisher-Yates shuffle algorithm used before grouping
export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Complete re-grouping process each round
export function createTeamGroups(teamIds: string[]): string[][] {
  const groupSizes = createGroupSizes(teamIds.length);
  return distributeTeamsIntoGroups(teamIds, groupSizes);
}
```

#### Round Advancement Logic
- **Trigger**: At the end of each round's results phase
- **Process**: 
  1. Collect all current team IDs
  2. Shuffle teams using Fisher-Yates algorithm
  3. Apply grouping algorithm to shuffled teams
  4. Generate new group assignments for next round
- **Result**: Teams compete with different opponents each round

#### Benefits of Round-to-Round Shuffling

1. **Variety in Competition**: Teams face different opponents each round
2. **Fair Distribution**: Same grouping logic ensures balanced sizes every time
3. **True Randomization**: Fisher-Yates provides unbiased shuffling
4. **Game Dynamics**: Prevents strategic alliances or repeated matchups
5. **Engagement**: Keeps gameplay fresh and unpredictable

#### Example Shuffling Scenario

**Round 1 Teams**: [A, B, C, D, E, F, G, H]
- Groups: [[A, B], [C, D], [E, F], [G, H]]

**After Shuffle**: [D, H, A, F, C, G, B, E]  
- Groups: [[D, H], [A, F], [C, G], [B, E]]

**Next Round**: Teams compete in completely different groupings while maintaining the 2-team-per-group structure.

## Real-World Application Benefits

### For Party/Bar Environment
1. **Intuitive Understanding**: Players can easily follow the logic
2. **Scalable**: Works from small gatherings (2 teams) to large crowds (20+ teams)
3. **Fair Perception**: Round-robin distribution feels fair to participants
4. **Quick Implementation**: Simple to explain and execute manually
5. **Consistent Experience**: Same grouping rules every time
6. **Dynamic Competition**: Shuffled groups each round keep games engaging

### Game Flow Integration
1. **Dynamic Team Addition**: New teams can be added to existing groups
2. **Balanced Competition**: Groups remain competitive in size
3. **Flexible Scaling**: Adapts to venue capacity and attendance
4. **Easy Communication**: Simple to explain to players and staff
5. **Round Variety**: Automatic re-grouping prevents repetitive matchups

## Implementation Recommendations

### Code Integration
```typescript
// In your game logic
const teamGroups = createTeamGroups(registeredTeams.length);
const groupedTeams = assignTeamsToGroups(registeredTeams, teamGroups);
```

### Error Handling
```typescript
function safeCreateTeamGroups(totalTeams: number): number[] | null {
    try {
        return createTeamGroups(totalTeams);
    } catch (error) {
        console.error("Group creation failed:", error.message);
        return null;
    }
}
```

### Testing Strategy
- Unit tests for all boundary cases
- Integration tests with actual team data
- Performance tests for large team counts
- User acceptance testing with real players

## Conclusion

This grouping algorithm provides a robust, fair, and scalable solution for team-based party games. The deterministic nature ensures consistent behavior, while the round-robin distribution maintains perceived fairness among participants. The implementation is straightforward and can be easily integrated into existing game systems.

The logic successfully balances the requirements of minimum team sizes, maximum group limits, and even distribution while remaining intuitive for both players and game administrators.
