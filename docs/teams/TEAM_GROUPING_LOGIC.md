# Team Grouping Logic

## Overview
Deterministic grouping algorithm for forming teams with the same prompt, optimized for party/bar game scenarios.

## Rules
1. Groups start at size 2
2. Maximum number of groups is 4
3. Create as many 2-team groups as possible (up to 4 groups)
4. Once 4 groups are reached, distribute extra teams evenly across existing groups

## Algorithm

### Step 1: Determine number of groups
```
groupCount = min(floor(N / 2), 4)
```
- Can't have groups with fewer than 2 teams
- Can't have more than 4 groups

### Step 2: Initialize groups
- Create `groupCount` groups
- Put 2 teams in each group
- Teams used so far: `teamsUsed = groupCount * 2`
- Remaining teams: `remainingTeams = N - teamsUsed`

### Step 3: Distribute remaining teams evenly
Loop through groups in order, adding 1 team per group per pass, until no teams remain.

This ensures:
- Group sizes differ by at most 1
- No group gets stacked unfairly

## Pseudocode

```javascript
function createGroups(totalTeams) {
    const groups = [];
    
    // Step 1: Determine number of groups
    const groupCount = Math.min(Math.floor(totalTeams / 2), 4);
    
    // Step 2: Initialize groups with 2 teams each
    for (let i = 0; i < groupCount; i++) {
        groups[i] = 2;
    }
    
    // Step 3: Distribute remaining teams evenly
    let remainingTeams = totalTeams - (groupCount * 2);
    let index = 0;
    
    while (remainingTeams > 0) {
        groups[index] += 1;
        remainingTeams -= 1;
        index = (index + 1) % groupCount;
    }
    
    return groups;
}
```

## Worked Examples

| Teams | Groups | Group Sizes |
|-------|--------|-------------|
| 2     | 1      | 2           |
| 4     | 2      | 2, 2        |
| 6     | 3      | 2, 2, 2     |
| 8     | 4      | 2, 2, 2, 2  |
| 10    | 4      | 3, 3, 2, 2  |
| 11    | 4      | 3, 3, 3, 2  |
| 12    | 4      | 3, 3, 3, 3  |
| 13    | 4      | 4, 3, 3, 3  |
| 14    | 4      | 4, 4, 3, 3  |
| 15    | 4      | 4, 4, 4, 3  |

## Benefits for Party/Bar Games

✅ **Even distribution** - Groups stay balanced in size  
✅ **No solo teams** - Every group has at least 2 teams  
✅ **Scales smoothly** - Works from small to large crowds  
✅ **Easy to explain** - "We add one team per group as people join"  
✅ **Predictable** - Same input always produces same grouping  

## Implementation Notes

- The algorithm is deterministic and fair
- Group sizes will never differ by more than 1 team
- Perfect for real-time team formation in social gaming environments
- Can be easily adapted to different programming languages
