import type { ReactNode } from "react";
import type { User } from "@supabase/supabase-js";
import type { Session, Room, RoomMembership, RoundGroup, Answer, Vote, SessionAnalytics } from "../../../shared/types";
import type { PromptLibrary } from "../../../shared/promptLibraries";
import type { Sociale } from "../../../domain/types/sociale.types";
import type { AudienceSubmission } from "../../../services/audienceSubmissionService";
import { HostHeaderCard } from "./HostHeaderCard";
import { HostVenueLoginPrompt } from "./HostVenueLoginPrompt";
import { HostSidePanel } from "./HostSidePanel";
import { HostModalsContainer } from "./HostModalsContainer";
import { HostPhaseContent } from "./HostPhaseContent";
import type { CreateSessionForm } from "../types/host-handler.types";
import type { PromptLibraryId } from "../../../shared/promptLibraries";

interface HostMainContentProps {
  user: User | null;
  isDark: boolean;
  session: Session | null;
  sessionId: string | null;
  room: Room | null | undefined;
  roomMemberships: RoomMembership[];
  storedRoomId: string | null;
  storedRoomCode: string | null;
  canCreateSession: boolean;
  venueAccountLoading: boolean;
  presenterButton: ReactNode;
  onNavigateAnalytics: () => void;
  onOpenRoomSettings: () => void;
  onOpenVIBox: () => void;
  onOpenVenueLogin: () => void;

  phaseContentProps: {
    isDark: boolean;
    sessionId: string | null;
    session: Session | null;
    storedRoomId: string | null;
    room: Room | null | undefined;
    roomMemberships: RoomMembership[];
    primarySocialeId: string | null | undefined;
    userId: string | undefined;
    lobbyControls: ReactNode;
    sessionControlButtons: ReactNode;
    activePhaseSessionControls: ReactNode;
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
    roundSummaries: { group: RoundGroup; index: number; answers: Answer[]; winners: Answer[] }[];
    players: RoomMembership[];
    gameStateVotes: Vote[];
    leaderboard: { id: string; rank: number; playerName: string; score: number; mascotId?: number }[];
    analytics: SessionAnalytics | null;
    allSubmissions: AudienceSubmission[];
    pendingSubmissionCount: number;
    approveSubmission: (id: string) => Promise<AudienceSubmission | undefined>;
    rejectSubmission: (id: string, reason?: string) => Promise<AudienceSubmission | undefined>;
  };

  sidePanelProps: {
    inviteLink: string;
    roomJoinCode: string;
    isDark: boolean;
    storedRoomId: string | null;
    session: Session | null;
    room: Room | null | undefined;
    roomLobbyMembers: RoomMembership[];
    isRoomMembersOpen: boolean;
    setIsRoomMembersOpen: (open: boolean) => void;
    kickingPlayerId: string | null;
    banningPlayerId: string | null;
    onKickPlayer: (memberId: string, userId: string, roomId: string) => void;
    onBanPlayer: (memberId: string, userId: string, roomId: string) => void;
    onShowBannedPlayers: () => void;
    onCopyLink: (link: string) => void;
    allSubmissions: AudienceSubmission[];
    pendingSubmissionCount: number;
    onApproveSubmission: (id: string) => Promise<AudienceSubmission | undefined>;
    onRejectSubmission: (id: string, reason?: string) => Promise<AudienceSubmission | undefined>;
  };

  modalsProps: React.ComponentProps<typeof HostModalsContainer>;
}

export function HostMainContent({
  user,
  isDark,
  session,
  room,
  storedRoomId,
  storedRoomCode,
  canCreateSession,
  venueAccountLoading,
  presenterButton,
  onNavigateAnalytics,
  onOpenRoomSettings,
  onOpenVIBox,
  onOpenVenueLogin,
  phaseContentProps,
  sidePanelProps,
  modalsProps,
}: HostMainContentProps) {
  return (
    <>
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <HostHeaderCard
          room={room}
          session={session}
          storedRoomId={storedRoomId}
          storedRoomCode={storedRoomCode}
          user={user}
          isDark={isDark}
          presenterButton={presenterButton}
          onNavigateAnalytics={onNavigateAnalytics}
          onOpenRoomSettings={onOpenRoomSettings}
          onOpenVIBox={onOpenVIBox}
        />

        <HostVenueLoginPrompt
          show={!session && !venueAccountLoading && !canCreateSession}
          isDark={isDark}
          onOpenVenueLogin={onOpenVenueLogin}
        />

        <section className="grid grid-cols-1 gap-6 md:grid-cols-[3fr_1fr] lg:grid-cols-[minmax(0,_2fr)_minmax(0,_1fr)]">
          <div className="flex flex-col gap-6">
            <HostPhaseContent {...phaseContentProps} />
          </div>

          <HostSidePanel {...sidePanelProps} />
        </section>
      </div>

      <HostModalsContainer {...modalsProps} />
    </>
  );
}
