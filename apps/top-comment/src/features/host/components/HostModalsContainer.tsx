import { Modal, Button } from "@social/ui";
import type { User } from "@supabase/supabase-js";
import type { Session, Room, RoomMembership } from "../../../shared/types";
import type { Sociale, SocialeMode } from "../../../domain/types/sociale.types";
import type { CreateSocialeRequest, UpdateSocialeRequest } from "../../../domain/types/sociale.types";
import type { PromptLibraryId } from "../../../shared/promptLibraries";
// Type definitions for modal props
// Note: Using flexible types to avoid conflicts with existing codebase
type ToastFunction = (options: { 
  title: string; 
  variant?: 'success' | 'error' | 'info'; 
  description?: string; 
}) => void;

// Create session form type (shared with useHostState.ts)
type CreateSessionForm = { 
  venueName: string; 
  gameMode: 'classic' | 'mashup'; 
  selectedLibraries: string[]; 
  totalRounds?: number;
};

import type { SetStateAction } from 'react';

import { CreateRoomModal } from "./CreateRoomModal";
import { SocialeCreateModal } from "./SocialeCreateModal";
import { CreateSessionModal, JoinSessionModal, JoinSocialeModal } from "../Phases";
import { PromptLibrarySelector } from "./PromptLibrarySelector";
import { BannedPlayersManager } from "./BannedPlayersManager";
import { VIBoxJukebox } from "../../../shared/components/vibox";
import { PlayerAuthModal } from "../../auth/PlayerAuthModal";
import { VenueAuthModal } from "../../auth/VenueAuthModal";
import { VenueRoomChecker } from "../../auth/VenueRoomChecker";

interface HostModalsContainerProps {
  // Room modals
  showRoomCreateModal: boolean;
  onCloseRoomModal: () => void;
  onRoomCreateSuccess: (room: Room) => void;
  room: Room | null | undefined;

  // Sociale modals
  showSocialeModal: boolean;
  setShowSocialeModal: (show: boolean) => void;
  storedRoomId: string | null;
  settingsSociale: Sociale | null;
  onCreateSociale: (request: CreateSocialeRequest) => Promise<void>;
  onUpdateSociale: (updates: {
    title?: string;
    description?: string;
    mode?: SocialeMode;
    totalRounds?: number;
    voiceProfile?: string;
  }) => Promise<void>;

  // Session modals
  showCreateModal: boolean;
  handleCreateModalClose: () => void;
  showEditModal: boolean;
  setShowEditModal: (show: boolean) => void;
  createForm: CreateSessionForm;
  setCreateForm: React.Dispatch<React.SetStateAction<CreateSessionForm>>;
  createErrors: Record<string, string>;
  isCreating: boolean;
  isUpdatingSession: boolean;
  canCreateSession: boolean;
  onCreateSession: (event: React.FormEvent<HTMLFormElement>) => Promise<void>;
  onUpdateSession: (event: React.FormEvent<HTMLFormElement>) => Promise<void>;

  // Join modals
  showJoinModal: boolean;
  setShowJoinModal: (show: boolean) => void;
  showJoinSocialeModal: boolean;
  setShowJoinSocialeModal: (show: boolean) => void;
  onJoinSession: (code: string) => Promise<void>;
  onJoinSociale: (code: string) => Promise<void>;
  isJoiningSession: boolean;
  isJoiningSociale: boolean;

  // Prompt library modal
  showPromptLibraryModal: boolean;
  setShowPromptLibraryModal: (show: boolean) => void;
  session: Session | null;
  selectedPromptLibraryId: PromptLibraryId;
  onPromptLibrarySelect: (id: PromptLibraryId) => void;
  isUpdatingPromptLibrary: boolean;
  isDark: boolean;

  // End session modal
  showEndSessionModal: boolean;
  setShowEndSessionModal: (show: boolean) => void;
  onConfirmEndSession: () => void;
  isEndingSession: boolean;

  // Banned players modal
  showBannedPlayersModal: boolean;
  setShowBannedPlayersModal: (show: boolean) => void;
  toast: ToastFunction;

  // VIBox modal
  showVIBoxModal: boolean;
  setShowVIBoxModal: (show: boolean) => void;
  roomMemberships: RoomMembership[] | undefined;

  // Venue auth modal
  showVenueAuthPrompt: boolean;
  setShowVenueAuthPrompt: (show: boolean) => void;
  onNavigateVenueAuth: () => void;

  // Auth modals
  showPlayerAuthModal: boolean;
  setShowPlayerAuthModal: (show: boolean) => void;
  showVenueAuthModal: boolean;
  setShowVenueAuthModal: (show: boolean) => void;
  onOpenVenueLogin: () => void;

  // Venue room checker
  onVenueRoomCreated: (roomCodeOrId: string) => void;
}

export function HostModalsContainer({
  showRoomCreateModal,
  onCloseRoomModal,
  onRoomCreateSuccess,
  room,
  showSocialeModal,
  setShowSocialeModal,
  storedRoomId,
  settingsSociale,
  onCreateSociale,
  onUpdateSociale,
  showCreateModal,
  handleCreateModalClose,
  showEditModal,
  setShowEditModal,
  createForm,
  setCreateForm,
  createErrors,
  isCreating,
  isUpdatingSession,
  canCreateSession,
  onCreateSession,
  onUpdateSession,
  showJoinModal,
  setShowJoinModal,
  showJoinSocialeModal,
  setShowJoinSocialeModal,
  onJoinSession,
  onJoinSociale,
  isJoiningSession,
  isJoiningSociale,
  showPromptLibraryModal,
  setShowPromptLibraryModal,
  session,
  selectedPromptLibraryId,
  onPromptLibrarySelect,
  isUpdatingPromptLibrary,
  isDark,
  showEndSessionModal,
  setShowEndSessionModal,
  onConfirmEndSession,
  isEndingSession,
  showBannedPlayersModal,
  setShowBannedPlayersModal,
  toast,
  showVIBoxModal,
  setShowVIBoxModal,
  roomMemberships,
  showVenueAuthPrompt,
  setShowVenueAuthPrompt,
  onNavigateVenueAuth,
  showPlayerAuthModal,
  setShowPlayerAuthModal,
  showVenueAuthModal,
  setShowVenueAuthModal,
  onVenueRoomCreated,
  onOpenVenueLogin,
}: HostModalsContainerProps) {
  return (
    <>
      <CreateRoomModal
        isOpen={showRoomCreateModal}
        onClose={onCloseRoomModal}
        onSuccess={onRoomCreateSuccess}
        onDeleted={() => window.location.reload()}
        existingRoom={room ?? undefined}
      />

      <SocialeCreateModal
        isOpen={showSocialeModal}
        onClose={() => setShowSocialeModal(false)}
        roomId={storedRoomId || ''}
        existingSociale={
          settingsSociale
            ? {
                id: settingsSociale.id,
                title: settingsSociale.title,
                description: settingsSociale.description,
                mode: settingsSociale.mode,
                totalRounds: settingsSociale.totalRounds,
                ambientPackId: settingsSociale.ambientPackId,
              }
            : null
        }
        onCreateSociale={onCreateSociale}
        onUpdateSociale={onUpdateSociale}
      />

      <CreateSessionModal
        open={showCreateModal}
        onClose={handleCreateModalClose}
        createForm={createForm}
        setCreateForm={setCreateForm}
        createErrors={createErrors}
        isCreating={isCreating}
        canCreateSession={canCreateSession}
        onSubmit={onCreateSession}
        onOpenVenueLogin={onOpenVenueLogin}
      />

      <CreateSessionModal
        open={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Session settings"
        submitLabel={isUpdatingSession ? "Saving..." : "Save settings"}
        createForm={createForm}
        setCreateForm={setCreateForm}
        createErrors={createErrors}
        isCreating={isUpdatingSession}
        canCreateSession={canCreateSession}
        onSubmit={onUpdateSession}
        onOpenVenueLogin={onOpenVenueLogin}
      />
      
      <JoinSessionModal
        open={showJoinModal}
        onClose={() => setShowJoinModal(false)}
        onJoin={onJoinSession}
        isJoining={isJoiningSession}
      />
      
      <JoinSocialeModal
        open={showJoinSocialeModal}
        onClose={() => setShowJoinSocialeModal(false)}
        onJoin={onJoinSociale}
        isJoining={isJoiningSociale}
      />

      <Modal
        open={showPromptLibraryModal && Boolean(session)}
        onClose={() => setShowPromptLibraryModal(false)}
        title="Choose a prompt library"
        isDark={isDark}
        footer={
          <Button variant="ghost" onClick={() => setShowPromptLibraryModal(false)}>
            Done
          </Button>
        }
      >
        {session ? (
          <div className="space-y-3">
            <PromptLibrarySelector
              selectedId={selectedPromptLibraryId}
              onSelect={onPromptLibrarySelect}
              disabled={isUpdatingPromptLibrary || session.status !== "lobby"}
            />
            <p className="text-xs text-slate-400">
              You can switch decks any time before the first round begins.
            </p>
          </div>
        ) : (
          <p className="text-sm text-slate-300">
            Start a session to choose your prompt library.
          </p>
        )}
      </Modal>

      <Modal
        open={showEndSessionModal}
        onClose={() => setShowEndSessionModal(false)}
        title="End Session"
        isDark={isDark}
        footer={
          <div className="flex w-full items-center justify-between">
            <Button variant="ghost" onClick={() => setShowEndSessionModal(false)}>
              Back
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                setShowEndSessionModal(false);
                onConfirmEndSession();
              }}
              disabled={isEndingSession}
              isLoading={isEndingSession}
            >
              Confirm
            </Button>
          </div>
        }
      >
        <p className="text-sm text-slate-200">
          Are you sure you want to end this session? This action cannot be undone
          and all players will be disconnected.
        </p>
      </Modal>
      
      <BannedPlayersManager
        roomId={storedRoomId}
        isOpen={showBannedPlayersModal}
        onClose={() => setShowBannedPlayersModal(false)}
        toast={toast}
      />
      
      <VIBoxJukebox
        isOpen={showVIBoxModal}
        onClose={() => setShowVIBoxModal(false)}
        toast={toast}
        room={room}
        memberships={roomMemberships || []}
        mode="host"
        allowUploads={true}
      />

      <Modal
        open={showVenueAuthPrompt}
        onClose={() => setShowVenueAuthPrompt(false)}
        title="Venue account required"
        isDark={isDark}
        footer={
          <div className="flex w-full items-center justify-between">
            <Button variant="ghost" onClick={() => setShowVenueAuthPrompt(false)}>
              Maybe later
            </Button>
            <Button
              onClick={() => {
                setShowVenueAuthPrompt(false);
                onNavigateVenueAuth();
              }}
            >
              Go to venue login
            </Button>
          </div>
        }
      >
        <p className={`text-sm ${!isDark ? 'text-slate-600' : 'text-slate-300'}`}>
          Only approved venue accounts can start Söcial sessions. Use your venue
          credentials to sign in before creating a game.
        </p>
      </Modal>
      
      {showPlayerAuthModal && (
        <PlayerAuthModal
          open={showPlayerAuthModal}
          onClose={() => setShowPlayerAuthModal(false)}
        />
      )}
      
      {showVenueAuthModal && (
        <VenueAuthModal
          open={showVenueAuthModal}
          onClose={() => setShowVenueAuthModal(false)}
        />
      )}
      
      <VenueRoomChecker 
        onRoomCreated={onVenueRoomCreated}
      />
    </>
  );
}
