import { Card } from "@social/ui";
import type { Session, Room, RoomMembership, RoundGroup, Answer, Vote, SessionAnalytics } from "../../../shared/types";
import type { PromptLibrary } from "../../../shared/promptLibraries";
import type { AudienceSubmission } from "../../../services/audienceSubmissionService";
import {
  AnswerPhase,
  VotePhase,
  ResultsPhase,
  EndedPhase,
} from "../Phases";
import { HostInteractionsPanel } from "./HostInteractionsPanel";
import { SessionsPanel } from "./SessionsPanel";
import { SocialesPanel } from "./SocialesPanel";
import { HostPromptLibraryCard } from "./HostPromptLibraryCard";
import { SubmissionReviewPanel } from "../../room/components/submissions/SubmissionReviewPanel";
import { SessionSkeleton } from "../../../shared/components/skeletons/SessionSkeleton";

interface UIRoundSummary {
  group: RoundGroup;
  index: number;
  answers: Answer[];
  winners: Answer[];
}

interface HostPhaseContentProps {
  isDark: boolean;
  sessionId: string | null;
  session: Session | null;
  storedRoomId: string | null;
  room: Room | null | undefined;
  roomMemberships: RoomMembership[];
  primarySocialeId: string | null | undefined;
  userId: string | undefined;
  lobbyControls: React.ReactNode;
  sessionControlButtons: React.ReactNode;
  activePhaseSessionControls: React.ReactNode;
  copyLinkHandler: (link: string) => void;
  roomJoinCode: string;
  inviteLink: string;
  currentPromptLibrary: PromptLibrary | null;
  isUpdatingPromptLibrary: boolean;
  onChangePrompts: () => void;
  onEditLibraries: () => void;
  onOpenSocialeSettings: () => void;
  onOpenLoadSociale: () => void;
  onSocialeChange: (socialeId: string | null) => void;
  roundGroups: RoundGroup[];
  totalGroups: number;
  playerLookup: Map<string, string>;
  activeGroupIndex: number;
  activeGroup: RoundGroup | null;
  activeGroupAnswers: Answer[];
  voteCounts: Map<string, number>;
  activeGroupVote: string | null;
  hostVoteHandler: (answerId: string) => void;
  isSubmittingVote: boolean;
  roundSummaries: UIRoundSummary[];
  players: RoomMembership[];
  gameStateVotes: Vote[];
  leaderboard: { id: string; rank: number; playerName: string; score: number; mascotId?: number }[];
  analytics: SessionAnalytics | null;
  allSubmissions: AudienceSubmission[];
  pendingSubmissionCount: number;
  approveSubmission: (id: string) => Promise<AudienceSubmission | undefined>;
  rejectSubmission: (id: string, reason?: string) => Promise<AudienceSubmission | undefined>;
}

export function HostPhaseContent(props: HostPhaseContentProps) {
  const {
    isDark,
    sessionId,
    session,
    storedRoomId,
    room,
    roomMemberships,
    primarySocialeId,
    userId,
    lobbyControls,
    sessionControlButtons,
    activePhaseSessionControls,
    copyLinkHandler,
    roomJoinCode,
    inviteLink,
    currentPromptLibrary,
    isUpdatingPromptLibrary,
    onChangePrompts,
    onEditLibraries,
    onOpenSocialeSettings,
    onOpenLoadSociale,
    onSocialeChange,
    roundGroups,
    totalGroups,
    playerLookup,
    activeGroupIndex,
    activeGroup,
    activeGroupAnswers,
    voteCounts,
    activeGroupVote,
    hostVoteHandler,
    isSubmittingVote,
    roundSummaries,
    players,
    gameStateVotes,
    leaderboard,
    analytics,
    allSubmissions,
    pendingSubmissionCount,
    approveSubmission,
    rejectSubmission,
  } = props;

  const promptLibraryCard = session && session.status === "lobby" ? (
    <HostPromptLibraryCard
      session={session}
      currentPromptLibrary={currentPromptLibrary}
      isUpdatingPromptLibrary={isUpdatingPromptLibrary}
      isDark={isDark}
      onChangePrompts={onChangePrompts}
      onEditLibraries={onEditLibraries}
    />
  ) : null;

  const renderSocialesPanel = () => {
    if (!storedRoomId) return null;
    return (
      <SocialesPanel
        isDark={isDark}
        roomId={storedRoomId ?? ''}
        userId={userId}
        primarySocialeId={primarySocialeId}
        onSocialeChange={onSocialeChange}
        onOpenSocialeSettings={onOpenSocialeSettings}
        onOpenLoadSociale={onOpenLoadSociale}
      />
    );
  };

  const renderHostInteractionsPanel = () => (
    <HostInteractionsPanel
      isDark={isDark}
      room={room ? { id: room.id, code: room.code } : null}
      roomMemberships={roomMemberships}
      onOpenSettings={onOpenSocialeSettings}
    />
  );

  const renderHostMainStack = (sessionsPanel: JSX.Element | null) => (
    <div className="space-y-6">
      {renderSocialesPanel()}
      {sessionsPanel}
      {renderHostInteractionsPanel()}
    </div>
  );

  const pendingSubmissionsNode = pendingSubmissionCount > 0 ? (
    <SubmissionReviewPanel
      submissions={allSubmissions}
      pendingCount={pendingSubmissionCount}
      isLoading={false}
      onApprove={approveSubmission}
      onReject={rejectSubmission}
    />
  ) : null;

  if (sessionId && !session) {
    return <SessionSkeleton />;
  }

  if (!session) {
    if (storedRoomId) {
      if (primarySocialeId) {
        return renderHostMainStack(null);
      }
      
      return renderHostMainStack(
        <SessionsPanel
          isDark={isDark}
          session={null}
          sessionId={null}
          sessionControls={lobbyControls}
          copyLinkHandler={copyLinkHandler}
          roomJoinCode={roomJoinCode}
          inviteLink={inviteLink}
        />
      );
    }
    
    return (
      <Card className="min-h-[360px] flex items-center justify-center" isDark={isDark}>
        <p className="text-lg text-cyan-300">
          Create a room to get started.
        </p>
      </Card>
    );
  }

  switch (session.status) {
    case "lobby":
      return renderHostMainStack(
        <SessionsPanel
          isDark={isDark}
          session={session}
          sessionId={sessionId}
          sessionControls={sessionControlButtons}
          promptLibraryContent={promptLibraryCard}
          copyLinkHandler={copyLinkHandler}
          roomJoinCode={roomJoinCode}
          inviteLink={inviteLink}
        />
      );

    case "answer":
      return renderHostMainStack(
        <SessionsPanel
          isDark={isDark}
          session={session}
          sessionId={sessionId}
          sessionControls={activePhaseSessionControls}
          phaseContent={
            <AnswerPhase
              sessionRoundIndex={session.roundIndex}
              totalGroups={totalGroups}
              roundGroups={roundGroups}
              teamLookup={playerLookup}
              sessionEndsAt={session.endsAt}
              answerSecs={session.settings.answerSecs ?? 90}
              sessionPaused={session.paused}
              promptLibraryId={session.promptLibraryId}
            />
          }
          room={room}
          roomMemberships={roomMemberships}
          pendingSubmissions={pendingSubmissionsNode}
          copyLinkHandler={copyLinkHandler}
          roomJoinCode={roomJoinCode}
          inviteLink={inviteLink}
        />
      );

    case "vote":
      return renderHostMainStack(
        <SessionsPanel
          isDark={isDark}
          session={session}
          sessionId={sessionId}
          sessionControls={activePhaseSessionControls}
          phaseContent={
            <VotePhase
              totalGroups={totalGroups}
              activeGroupIndex={activeGroupIndex}
              activeGroup={activeGroup}
              roundGroups={roundGroups}
              activeGroupAnswers={activeGroupAnswers}
              voteCounts={voteCounts}
              activeGroupVote={activeGroupVote}
              handleHostVote={hostVoteHandler}
              isSubmittingVote={isSubmittingVote}
              roundSummaries={roundSummaries}
              sessionEndsAt={session.endsAt}
              voteSecs={session.settings.voteSecs ?? 90}
              sessionPaused={session.paused}
              votes={gameStateVotes}
              teams={players}
              currentRoundIndex={session.roundIndex}
            />
          }
          room={room}
          roomMemberships={roomMemberships}
          pendingSubmissions={pendingSubmissionsNode}
          copyLinkHandler={copyLinkHandler}
          roomJoinCode={roomJoinCode}
          inviteLink={inviteLink}
        />
      );

    case "results":
      return renderHostMainStack(
        <SessionsPanel
          isDark={isDark}
          session={session}
          sessionId={sessionId}
          sessionControls={activePhaseSessionControls}
          phaseContent={
            <ResultsPhase
              sessionRoundIndex={session.roundIndex}
              roundSummaries={roundSummaries}
              voteCounts={voteCounts}
              sessionEndsAt={session.endsAt}
              resultsSecs={session.settings.resultsSecs ?? 12}
              sessionPaused={session.paused}
            />
          }
          room={room}
          roomMemberships={roomMemberships}
          pendingSubmissions={pendingSubmissionsNode}
          copyLinkHandler={copyLinkHandler}
          roomJoinCode={roomJoinCode}
          inviteLink={inviteLink}
        />
      );

    case "ended":
      return renderHostMainStack(
        <SessionsPanel
          isDark={isDark}
          session={session}
          sessionId={sessionId}
          sessionControls={sessionControlButtons}
          promptLibraryContent={<EndedPhase leaderboard={leaderboard} analytics={analytics} />}
          copyLinkHandler={copyLinkHandler}
          roomJoinCode={roomJoinCode}
          inviteLink={inviteLink}
        />
      );

    default:
      return null;
  }
}
