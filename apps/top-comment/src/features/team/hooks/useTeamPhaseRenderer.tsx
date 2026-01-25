import { useMemo } from "react";
import type { Session, Team, Answer, Vote, RoundGroup } from "../../../shared/types";
import type { RoundSummary } from "../../../application/utils/transformers";
import {
  LobbyPhase,
  CategorySelectPhase,
  AnswerPhase,
  VotePhase,
  ResultsPhase,
  EndedPhase,
} from "../Phases";

interface LeaderboardTeam extends Team {
  rank: number;
}

interface UseTeamPhaseRendererProps {
  session: Session | null;
  teams: Team[];
  currentTeam: Team | null;
  myGroup: RoundGroup | null;
  roundGroups: RoundGroup[];
  myAnswer: Answer | null;
  answerText: string;
  setAnswerText: (text: string) => void;
  handleSubmitAnswer: () => void;
  isSubmittingAnswer: boolean;
  handleSelectCategory: (categoryId: string, promptIndex: number) => void;
  isSubmittingCategorySelection: boolean;
  totalSeconds: number;
  activeGroup: RoundGroup | null;
  activeGroupIndex: number;
  totalGroups: number;
  activeGroupAnswers: Answer[];
  voteCounts: Map<string, number>;
  myActiveVote: Vote | null;
  activeGroupWinnerIds: Set<string>;
  handleVote: (answerId: string) => void;
  isSubmittingVote: boolean;
  voteSummaryActive: boolean;
  isVotingOnOwnGroup: boolean;
  finalLeaderboard: LeaderboardTeam[];
  votesForMe: number;
  myRoundPoints: number;
  scrollToMyRank: () => void;
  selfieImage: string | null;
  startSelfie: () => void;
  shareSelfie: () => void;
  downloadSelfie: () => void;
  setSelfieImage: (image: string | null) => void;
  isTakingSelfie: boolean;
  handleLeave: () => void;
  scoreboardRef: any;
  roundSummaries: RoundSummary[];
  votes: Vote[];
  answers: Answer[];
}

export function useTeamPhaseRenderer({
  session,
  teams,
  currentTeam,
  myGroup,
  roundGroups,
  myAnswer,
  answerText,
  setAnswerText,
  handleSubmitAnswer,
  isSubmittingAnswer,
  handleSelectCategory,
  isSubmittingCategorySelection,
  totalSeconds,
  activeGroup,
  activeGroupIndex,
  totalGroups,
  activeGroupAnswers,
  voteCounts,
  myActiveVote,
  activeGroupWinnerIds,
  handleVote,
  isSubmittingVote,
  voteSummaryActive,
  isVotingOnOwnGroup,
  finalLeaderboard,
  votesForMe,
  myRoundPoints,
  scrollToMyRank,
  selfieImage,
  startSelfie,
  shareSelfie,
  downloadSelfie,
  setSelfieImage,
  isTakingSelfie,
  handleLeave,
  scoreboardRef,
  roundSummaries,
  votes,
  answers,
}: UseTeamPhaseRendererProps) {
  return useMemo(() => {
    if (!session) return null;

    switch (session.status) {
      case "lobby":
        return <LobbyPhase teams={teams} />;
      case "category-select":
        return (
          <CategorySelectPhase
            session={session}
            currentTeam={currentTeam}
            myGroup={myGroup}
            onSelectCategory={handleSelectCategory}
            isSubmitting={isSubmittingCategorySelection}
          />
        );
      case "answer":
        return (
          <AnswerPhase
            session={session}
            myGroup={myGroup}
            roundGroups={roundGroups}
            myAnswer={myAnswer}
            answerText={answerText}
            setAnswerText={setAnswerText}
            handleSubmitAnswer={handleSubmitAnswer}
            isSubmittingAnswer={isSubmittingAnswer}
            totalSeconds={totalSeconds}
          />
        );
      case "vote":
        return (
          <VotePhase
            session={session}
            activeGroup={activeGroup}
            roundGroups={roundGroups}
            activeGroupIndex={activeGroupIndex}
            totalGroups={totalGroups}
            activeGroupAnswers={activeGroupAnswers}
            voteCounts={voteCounts}
            myActiveVote={myActiveVote}
            activeGroupWinnerIds={activeGroupWinnerIds}
            handleVote={handleVote}
            isSubmittingVote={isSubmittingVote}
            voteSummaryActive={voteSummaryActive}
            teams={teams}
            totalSeconds={totalSeconds}
            currentTeam={currentTeam}
            isVotingOnOwnGroup={isVotingOnOwnGroup}
          />
        );
      case "results":
        return (
          <ResultsPhase
            session={session}
            finalLeaderboard={finalLeaderboard}
            currentTeam={currentTeam}
            votesForMe={votesForMe}
            myRoundPoints={myRoundPoints}
            votes={votes}
            answers={activeGroupAnswers}
            roundGroups={roundGroups}
          />
        );
      case "ended":
        return (
          <EndedPhase
            currentTeam={currentTeam}
            finalLeaderboard={finalLeaderboard}
            scrollToMyRank={scrollToMyRank}
            selfieImage={selfieImage}
            startSelfie={startSelfie}
            shareSelfie={shareSelfie}
            downloadSelfie={downloadSelfie}
            setSelfieImage={setSelfieImage}
            isTakingSelfie={isTakingSelfie}
            handleLeave={handleLeave}
            scoreboardRef={scoreboardRef}
          />
        );
      default:
        return null;
    }
  }, [
    session,
    teams,
    currentTeam,
    myGroup,
    handleSelectCategory,
    isSubmittingCategorySelection,
    activeGroup,
    roundGroups,
    activeGroupIndex,
    totalGroups,
    myAnswer,
    answerText,
    handleSubmitAnswer,
    isSubmittingAnswer,
    activeGroupAnswers,
    voteCounts,
    myActiveVote,
    activeGroupWinnerIds,
    handleVote,
    isSubmittingVote,
    voteSummaryActive,
    totalSeconds,
    isVotingOnOwnGroup,
    finalLeaderboard,
    votesForMe,
    myRoundPoints,
    scrollToMyRank,
    selfieImage,
    startSelfie,
    shareSelfie,
    downloadSelfie,
    setSelfieImage,
    isTakingSelfie,
    handleLeave,
    scoreboardRef,
    roundSummaries,
  ]);
}
