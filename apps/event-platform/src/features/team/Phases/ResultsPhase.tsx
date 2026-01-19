import { Card, Leaderboard } from "@social/ui";
import type { Session, Team, Vote, Answer } from "../../../shared/types";
import { statusHeadline } from "../../../shared/constants";
import { useTheme } from "../../../shared/providers/ThemeProvider";
import { useMemo } from "react";

interface LeaderboardTeam extends Team {
  rank: number;
}

interface ResultsPhaseProps {
  session: Session;
  finalLeaderboard: LeaderboardTeam[];
  currentTeam: Team | null;
  votesForMe: number;
  myRoundPoints: number;
  votes: Vote[];
  answers: Answer[];
  roundGroups: any[];
}

export function ResultsPhase({
  session,
  finalLeaderboard,
  currentTeam,
  votesForMe,
  myRoundPoints,
  votes,
  answers,
  roundGroups,
}: ResultsPhaseProps) {
  const { isDark } = useTheme();
  
  // Calculate voter rewards for current team
  const voterRewards = useMemo(() => {
    if (!currentTeam || !votes || !answers || !roundGroups.length) {
      return { 
        participationPoints: 0, 
        accuracyPoints: 0, 
        completionBonus: 0,
        totalVoterPoints: 0,
        votesCount: 0,
        accurateVotes: 0
      };
    }
    
    // Get votes cast by current team
    const myVotes = votes.filter(v => 
      v.voterId === currentTeam.id && 
      v.roundIndex === session.roundIndex
    );
    
    const votesCount = myVotes.length;
    const groupsVotedIn = new Set(myVotes.map(v => v.groupId));
    
    // Count accurate votes (votes for winners)
    let accurateVotes = 0;
    const voteCounts = new Map<string, number>();
    
    // Count votes per answer
    votes.forEach(vote => {
      if (vote.roundIndex === session.roundIndex) {
        const current = voteCounts.get(vote.answerId) || 0;
        voteCounts.set(vote.answerId, current + 1);
      }
    });
    
    // Check each vote for accuracy
    for (const vote of myVotes) {
      const answer = answers.find(a => a.id === vote.answerId);
      if (answer) {
        const voteCount = voteCounts.get(answer.id) || 0;
        const groupAnswers = answers.filter(a => a.groupId === answer.groupId && a.roundIndex === session.roundIndex);
        const maxVotes = Math.max(...groupAnswers.map(a => voteCounts.get(a.id) || 0));
        if (voteCount === maxVotes && maxVotes > 0) {
          accurateVotes++;
        }
      }
    }
    
    // Calculate actual points (backend logic)
    const participationPoints = votesCount * 1; // 1 point per vote
    const accuracyPoints = accurateVotes * 2; // 2 points per accurate vote
    const completionBonus = groupsVotedIn.size === roundGroups.length ? 3 : 0;
    
    // Apply 100x display multiplier
    const displayMultiplier = 100;
    
    return {
      participationPoints: participationPoints * displayMultiplier,
      accuracyPoints: accuracyPoints * displayMultiplier,
      completionBonus: completionBonus * displayMultiplier,
      totalVoterPoints: (participationPoints + accuracyPoints + completionBonus) * displayMultiplier,
      votesCount,
      accurateVotes
    };
  }, [currentTeam, votes, answers, roundGroups, session.roundIndex]);
  
  // Get bonus information for current team's group
  const myBonus = useMemo(() => {
    const currentRound = session.rounds?.[session.roundIndex];
    if (!currentRound || !currentTeam) return null;
    
    // Find the group this team belongs to
    const myGroup = currentRound.groups?.find(g => 
      g.teamIds.includes(currentTeam.id)
    );
    
    return myGroup?.selectedBonus || null;
  }, [session, currentTeam]);
  
  return (
    <Card className="space-y-5" isDark={isDark}>
      <div className="space-y-2 text-center">
        <h2 className="text-2xl font-bold text-white">
          {statusHeadline[session.status]}
        </h2>
        <p className="text-sm text-slate-300">
          Round {session.roundIndex + 1} recap & leaderboard.
        </p>
      </div>
      <div className="elevated-card p-5">
        <h3 className="text-sm font-semibold uppercase tracking-wide transition-all duration-200 text-cyan-400 drop-shadow-sm">
          Current leaderboard
        </h3>
        <div className="mt-3">
          <Leaderboard
            leaderboard={finalLeaderboard}
            highlightTeamId={currentTeam?.id}
            variant="presenter"
            className="grid gap-3 text-lg font-semibold lg:grid-cols-2"
            isDark={isDark}
          />
        </div>
      </div>
      <div className="rounded-3xl p-5 text-center shadow-2xl bg-slate-800">
        <p className="text-sm font-semibold text-slate-300">
          You earned {votesForMe} vote{votesForMe === 1 ? "" : "s"} this round.
        </p>
        
        {/* Bonus Display */}
        {myBonus && votesForMe > 0 && (
          <div className="mt-3 space-y-1">
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${
              myBonus.bonusType === 'multiplier' 
                ? 'bg-gradient-to-r from-purple-500 to-pink-500' 
                : 'bg-gradient-to-r from-yellow-400 to-yellow-600'
            }`}>
              <span className="text-white font-bold text-lg">
                {myBonus.bonusType === 'multiplier' ? `${myBonus.bonusValue}× MULTIPLIER!` : `+${myBonus.bonusValue} BONUS!`}
              </span>
            </div>
          </div>
        )}
        
        <p className={`mt-3 text-xs font-semibold ${!isDark ? 'text-brand-primary' : 'text-cyan-400'}`}>
          +{myRoundPoints}
        </p>
      </div>
      
      {/* Voter Rewards Display */}
      {voterRewards.votesCount > 0 && (
        <div className="rounded-3xl p-5 text-center shadow-2xl bg-slate-800">
          <h3 className={`text-lg font-bold text-center mb-3 ${!isDark ? 'text-slate-900' : 'text-cyan-400'}`}>
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
            <p className={`text-xs text-center mt-2 ${!isDark ? 'text-slate-600' : 'text-slate-400'}`}>
              Accuracy: {Math.round((voterRewards.accurateVotes / voterRewards.votesCount) * 100)}%
            </p>
          )}
        </div>
      )}
    </Card>
  );
}

