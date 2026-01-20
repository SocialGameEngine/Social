# Voter Incentive System - Hybrid Approach Implementation Guide

## Overview
This guide provides a complete implementation plan for adding voter incentives to the classic game mode using a hybrid approach that rewards participation, accuracy, and completion.

## Point System Design

### Reward Structure
1. **Base Participation**: +1 point per vote cast
2. **Accuracy Bonus**: +2 points if your vote matches the winning answer(s)
3. **Completion Bonus**: +3 points for voting in all groups in a round

### Example Scenarios
- **Scenario 1**: Player votes in 2 of 3 groups, picks 1 winner
  - Base: 2 points (2 votes)
  - Accuracy: 2 points (1 winner picked)
  - Completion: 0 points (didn't vote in all groups)
  - **Total: 4 points**

- **Scenario 2**: Player votes in all 3 groups, picks 2 winners
  - Base: 3 points (3 votes)
  - Accuracy: 4 points (2 winners picked)
  - Completion: 3 points (voted in all groups)
  - **Total: 10 points**

- **Scenario 3**: Player votes in all 3 groups, picks 0 winners
  - Base: 3 points (3 votes)
  - Accuracy: 0 points (no winners picked)
  - Completion: 3 points (voted in all groups)
  - **Total: 6 points**

## Database Schema Changes

### 1. Track Voter Participation
No schema changes needed - use existing `votes` table:
```sql
-- votes table already has:
-- - voter_id (team_id of voter)
-- - answer_id (which answer they voted for)
-- - round_index
-- - group_id
-- - session_id
```

### 2. Add Voter Stats Tracking (Optional Enhancement)
```sql
-- Add columns to teams table for stats display
ALTER TABLE teams 
ADD COLUMN total_votes_cast INTEGER DEFAULT 0,
ADD COLUMN accurate_votes INTEGER DEFAULT 0,
ADD COLUMN voting_streak INTEGER DEFAULT 0;
```

## Implementation Steps

### Phase 1: Backend - Scoring Logic

#### File: `supabase/functions/sessions-advance/index.ts`

**Location**: Modify `calculateRoundScores()` function (lines 212-286)

**Changes Required**:

1. **After calculating answer creator scores**, add voter scoring logic:

```typescript
async function calculateRoundScores(supabase: any, sessionId: string, roundIndex: number) {
  // ... existing code for answer creator scoring ...
  
  // NEW: Calculate voter rewards
  await calculateVoterRewards(supabase, sessionId, roundIndex, groups, votesByTeam);
}

async function calculateVoterRewards(
  supabase: any, 
  sessionId: string, 
  roundIndex: number,
  groups: any[],
  answerVotesByTeam: Map<string, { voteCount: number; groupId: string }>
) {
  // Get all votes for this round
  const { data: allVotes } = await supabase
    .from('votes')
    .select('voter_id, answer_id, group_id, answers!inner(team_id)')
    .eq('session_id', sessionId)
    .eq('round_index', roundIndex);
  
  if (!allVotes || allVotes.length === 0) return;
  
  // Determine winners for each group (teams with most votes)
  const groupWinners = new Map<string, Set<string>>(); // groupId -> Set of winning answer_ids
  
  for (const group of groups) {
    const groupId = group.id;
    const groupAnswerVotes = Array.from(answerVotesByTeam.entries())
      .filter(([_, data]) => data.groupId === groupId);
    
    if (groupAnswerVotes.length === 0) continue;
    
    const maxVotes = Math.max(...groupAnswerVotes.map(([_, data]) => data.voteCount));
    
    // Get all answers with max votes (handles ties)
    const winningTeamIds = groupAnswerVotes
      .filter(([_, data]) => data.voteCount === maxVotes)
      .map(([teamId, _]) => teamId);
    
    // Get answer IDs for winning teams
    const { data: winningAnswers } = await supabase
      .from('answers')
      .select('id')
      .eq('session_id', sessionId)
      .eq('round_index', roundIndex)
      .eq('group_id', groupId)
      .in('team_id', winningTeamIds);
    
    if (winningAnswers) {
      groupWinners.set(groupId, new Set(winningAnswers.map((a: any) => a.id)));
    }
  }
  
  // Track voter participation and accuracy
  const voterStats = new Map<string, {
    votesCount: number;
    accurateVotes: number;
    groupsVotedIn: Set<string>;
  }>();
  
  for (const vote of allVotes) {
    const voterId = vote.voter_id;
    const answerId = vote.answer_id;
    const groupId = vote.group_id;
    
    if (!voterStats.has(voterId)) {
      voterStats.set(voterId, {
        votesCount: 0,
        accurateVotes: 0,
        groupsVotedIn: new Set(),
      });
    }
    
    const stats = voterStats.get(voterId)!;
    stats.votesCount++;
    stats.groupsVotedIn.add(groupId);
    
    // Check if this vote was for a winner
    const winners = groupWinners.get(groupId);
    if (winners && winners.has(answerId)) {
      stats.accurateVotes++;
    }
  }
  
  // Calculate and award points to voters
  const totalGroups = groups.length;
  
  for (const [voterId, stats] of voterStats.entries()) {
    let voterPoints = 0;
    
    // Base participation: +1 per vote
    voterPoints += stats.votesCount * 1;
    
    // Accuracy bonus: +2 per accurate vote
    voterPoints += stats.accurateVotes * 2;
    
    // Completion bonus: +3 if voted in all groups
    if (stats.groupsVotedIn.size === totalGroups) {
      voterPoints += 3;
    }
    
    // Award points to voter
    if (voterPoints > 0) {
      await supabase.rpc('increment_team_score', {
        team_id: voterId,
        score_delta: voterPoints,
      });
      
      console.log(`Voter ${voterId} earned ${voterPoints} points (${stats.votesCount} votes, ${stats.accurateVotes} accurate, ${stats.groupsVotedIn.size}/${totalGroups} groups)`);
    }
  }
}
```

### Phase 2: Frontend - UI Updates

#### File: `apps/event-platform/src/features/team/Phases/VotePhase.tsx`

**Update messaging to inform voters about rewards**:

```typescript
// Line 78-82: Update the instruction text
<p className={`text-xs font-medium sm:text-sm ${!isDark ? 'text-slate-600' : 'text-slate-400'}`}>
  {isVotingOnOwnGroup
    ? "Viewing your group's answers — you cannot vote in your own group."
    : "Tap your favorite answer — earn points for voting! 🎯"}
</p>
```

**Add reward information display**:

```typescript
// After line 191, before closing Card:
{!isVotingOnOwnGroup && !voteSummaryActive && (
  <div className={`text-center text-xs space-y-1 ${!isDark ? 'text-slate-600' : 'text-slate-400'}`}>
    <p className="font-semibold">💰 Voter Rewards:</p>
    <p>+1 per vote • +2 if you pick the winner • +3 for voting in all groups</p>
  </div>
)}
```

#### File: `apps/event-platform/src/features/team/Phases/ResultsPhase.tsx`

**Show voter points earned in results**:

Add a new section after the round summary that shows:
- Total voter points earned this round
- Breakdown: participation + accuracy + completion bonus
- Voting accuracy percentage

```typescript
// Add to ResultsPhase component
interface VoterRewardsSummary {
  participationPoints: number;
  accuracyPoints: number;
  completionBonus: number;
  totalVoterPoints: number;
  votesCount: number;
  accurateVotes: number;
}

// Calculate voter rewards for current team
const calculateMyVoterRewards = (): VoterRewardsSummary => {
  if (!currentTeam) return { 
    participationPoints: 0, 
    accuracyPoints: 0, 
    completionBonus: 0,
    totalVoterPoints: 0,
    votesCount: 0,
    accurateVotes: 0
  };
  
  const myVotes = votes.filter(v => 
    v.voterId === currentTeam.id && 
    v.roundIndex === session.roundIndex
  );
  
  const votesCount = myVotes.length;
  const groupsVotedIn = new Set(myVotes.map(v => v.groupId));
  
  // Count accurate votes (votes for winners)
  let accurateVotes = 0;
  for (const vote of myVotes) {
    const answer = answers.find(a => a.id === vote.answerId);
    if (answer) {
      const voteCount = voteCounts.get(answer.id) || 0;
      const groupAnswers = answers.filter(a => a.groupId === answer.groupId);
      const maxVotes = Math.max(...groupAnswers.map(a => voteCounts.get(a.id) || 0));
      if (voteCount === maxVotes && maxVotes > 0) {
        accurateVotes++;
      }
    }
  }
  
  const participationPoints = votesCount * 1;
  const accuracyPoints = accurateVotes * 2;
  const completionBonus = groupsVotedIn.size === roundGroups.length ? 3 : 0;
  
  return {
    participationPoints,
    accuracyPoints,
    completionBonus,
    totalVoterPoints: participationPoints + accuracyPoints + completionBonus,
    votesCount,
    accurateVotes
  };
};

// Add UI component to display rewards
const voterRewards = calculateMyVoterRewards();

{voterRewards.votesCount > 0 && (
  <Card className="p-4 space-y-2" isDark={isDark}>
    <h3 className={`text-lg font-bold text-center ${!isDark ? 'text-slate-900' : 'text-cyan-400'}`}>
      🎯 Your Voter Rewards
    </h3>
    <div className={`space-y-1 text-sm ${!isDark ? 'text-slate-700' : 'text-slate-300'}`}>
      <div className="flex justify-between">
        <span>Participation ({voterRewards.votesCount} votes)</span>
        <span className="font-semibold">+{voterRewards.participationPoints}</span>
      </div>
      <div className="flex justify-between">
        <span>Accuracy ({voterRewards.accurateVotes} correct)</span>
        <span className="font-semibold">+{voterRewards.accuracyPoints}</span>
      </div>
      {voterRewards.completionBonus > 0 && (
        <div className="flex justify-between">
          <span>Completion Bonus ✨</span>
          <span className="font-semibold">+{voterRewards.completionBonus}</span>
        </div>
      )}
      <div className={`flex justify-between pt-2 border-t ${!isDark ? 'border-slate-300' : 'border-slate-600'}`}>
        <span className="font-bold">Total Voter Points</span>
        <span className="font-bold text-lg">+{voterRewards.totalVoterPoints}</span>
      </div>
    </div>
    {voterRewards.votesCount > 0 && (
      <p className={`text-xs text-center ${!isDark ? 'text-slate-600' : 'text-slate-400'}`}>
        Accuracy: {Math.round((voterRewards.accurateVotes / voterRewards.votesCount) * 100)}%
      </p>
    )}
  </Card>
)}
```

#### File: `apps/event-platform/src/features/howToPlay/HowToPlayModal.tsx`

**Update instructions to explain voter rewards**:

Add a new section explaining the voter incentive system:

```typescript
<div className="space-y-2">
  <h3 className="text-lg font-bold">💰 Earning Points</h3>
  <div className="space-y-3">
    <div>
      <p className="font-semibold">As an Answer Creator:</p>
      <p className="text-sm text-slate-600">
        Earn 1 point for each vote your answer receives, plus any bonus multipliers or points!
      </p>
    </div>
    <div>
      <p className="font-semibold">As a Voter:</p>
      <ul className="text-sm text-slate-600 list-disc list-inside space-y-1">
        <li><strong>+1 point</strong> for each vote you cast</li>
        <li><strong>+2 bonus points</strong> if your vote matches the winning answer</li>
        <li><strong>+3 completion bonus</strong> for voting in all groups in a round</li>
      </ul>
      <p className="text-xs text-slate-500 mt-1">
        💡 Tip: Vote thoughtfully in every group to maximize your points!
      </p>
    </div>
  </div>
</div>
```

### Phase 3: Host Dashboard Updates

#### File: `apps/event-platform/src/features/host/Phases/VotePhase.tsx`

**Show voting participation stats**:

```typescript
// Add participation tracking display
const votingParticipation = {
  totalVoters: new Set(votes.filter(v => v.roundIndex === session.roundIndex).map(v => v.voterId)).size,
  totalTeams: teams.length,
  votesPerGroup: roundGroups.map(group => ({
    groupId: group.id,
    voteCount: votes.filter(v => v.groupId === group.id && v.roundIndex === session.roundIndex).length
  }))
};

// Display in host UI
<div className="text-sm text-slate-600">
  <p>Voting Participation: {votingParticipation.totalVoters}/{votingParticipation.totalTeams} teams</p>
</div>
```

### Phase 4: Testing Checklist

#### Unit Tests
- [ ] Test voter points calculation with various scenarios
- [ ] Test accuracy detection with ties
- [ ] Test completion bonus logic
- [ ] Test edge cases (no votes, all accurate, etc.)

#### Integration Tests
- [ ] Test full round flow with voter rewards
- [ ] Verify points are correctly added to team scores
- [ ] Test with multiple groups and voters
- [ ] Test with tie scenarios

#### Manual Testing Scenarios
1. **Single voter, all groups, all accurate**
   - Expected: Base (3) + Accuracy (6) + Completion (3) = 12 points

2. **Multiple voters, partial participation**
   - Expected: Correct individual calculations per voter

3. **Voter picks all losers**
   - Expected: Only base participation points

4. **Tie scenario (multiple winners)**
   - Expected: Accuracy bonus awarded if voted for any winner

5. **Voter votes in own group**
   - Expected: Vote should not count (existing behavior)

### Phase 5: Deployment Plan

#### Pre-deployment
1. Review and test all code changes
2. Update database if adding optional stats columns
3. Test in staging environment
4. Prepare rollback plan

#### Deployment Steps
1. Deploy backend changes (supabase functions)
2. Deploy frontend changes (event-platform)
3. Monitor error logs
4. Verify scoring calculations in live games

#### Post-deployment
1. Monitor player engagement metrics
2. Track average voter points per round
3. Gather player feedback
4. Adjust point values if needed

## Configuration Options

### Tunable Parameters
Create a configuration object for easy adjustment:

```typescript
const VOTER_REWARDS_CONFIG = {
  participationPoints: 1,    // Points per vote cast
  accuracyBonus: 2,          // Bonus for picking winner
  completionBonus: 3,        // Bonus for voting in all groups
  enabled: true,             // Feature flag
};
```

### Feature Flag
Add ability to enable/disable voter rewards per session:

```typescript
// In session settings
interface SessionSettings {
  // ... existing settings
  voterRewardsEnabled?: boolean;
}
```

## Analytics & Metrics

### Track These Metrics
- Average voter points per round
- Voting participation rate (before vs after)
- Voter accuracy percentage
- Completion rate (% voting in all groups)
- Impact on total game engagement time

### Dashboard Queries
```sql
-- Average voter points per round
SELECT 
  session_id,
  round_index,
  AVG(voter_points) as avg_voter_points
FROM voter_stats
GROUP BY session_id, round_index;

-- Voting participation rate
SELECT 
  COUNT(DISTINCT voter_id) * 100.0 / COUNT(DISTINCT team_id) as participation_rate
FROM votes v
JOIN teams t ON t.session_id = v.session_id;
```

## Future Enhancements

### Phase 6: Advanced Features (Optional)
1. **Voting Streak System**
   - Track consecutive rounds with full participation
   - Award escalating bonuses for streaks

2. **Voter Leaderboard**
   - Separate leaderboard for best voters
   - "Most Accurate Voter" badge

3. **Dynamic Point Scaling**
   - Scale voter rewards based on group size
   - Higher rewards for larger groups

4. **Voter Insights**
   - Show personal voting stats at game end
   - "You picked 80% of winners!"

5. **Social Proof**
   - Show "X players have voted" during voting phase
   - Create FOMO to encourage participation

## Rollback Plan

If voter rewards cause issues:

1. **Quick disable**: Set `voterRewardsEnabled: false` in config
2. **Database rollback**: Revert team scores using audit log
3. **Code rollback**: Revert to previous deployment
4. **Communication**: Notify players of temporary change

## Support & Maintenance

### Common Issues
- **Issue**: Voter points not appearing
  - **Fix**: Check `calculateVoterRewards()` logs, verify RPC call

- **Issue**: Incorrect accuracy calculation
  - **Fix**: Verify winner determination logic handles ties

- **Issue**: Completion bonus not awarded
  - **Fix**: Check group count comparison logic

### Monitoring
- Set up alerts for scoring anomalies
- Log all voter reward calculations
- Track error rates in `calculateVoterRewards()`

## Summary

This hybrid approach provides:
- ✅ Immediate participation rewards (base points)
- ✅ Strategic gameplay (accuracy bonus)
- ✅ Engagement incentive (completion bonus)
- ✅ Balanced point distribution
- ✅ Clear player communication
- ✅ Measurable impact on engagement

**Estimated Implementation Time**: 8-12 hours
**Complexity**: Medium
**Impact**: High (expected to significantly increase voting participation)
