import { useMemo, useCallback } from "react";
import type { Session } from "../../../shared/types";
import { useCommandPalette, CommandPalette } from "./shell";

interface HostCommandPaletteSectionProps {
  session: Session | null;
  sessionMachine: {
    canAdvance: boolean;
    canPause: boolean;
    canEndSession: boolean;
  };
  isPerformingAction: boolean;
  isPausingSession: boolean;
  isEndingSession: boolean;
  canCreateSession: boolean;
  isCreating: boolean;
  handlePrimaryClick: () => void;
  handlePauseToggle: () => void;
  showEndSessionModalHandler: () => void;
  handleOpenSocialeModal: () => void;
  toast: (options: { title: string; variant?: 'success' | 'error' | 'info'; description?: string }) => void;
}

export function HostCommandPaletteSection({
  session,
  sessionMachine,
  isPerformingAction,
  isPausingSession,
  isEndingSession,
  canCreateSession,
  isCreating,
  handlePrimaryClick,
  handlePauseToggle,
  showEndSessionModalHandler,
  handleOpenSocialeModal,
  toast,
}: HostCommandPaletteSectionProps) {
  const commandPalette = useCommandPalette();

  const commands = useMemo(() => [
    {
      id: 'advance-phase',
      label: 'Advance Phase',
      description: 'Move to next session phase',
      shortcut: 'Space',
      category: 'session' as const,
      action: handlePrimaryClick,
      disabled: !sessionMachine.canAdvance || isPerformingAction,
    },
    {
      id: 'pause-resume',
      label: session?.paused ? 'Resume Session' : 'Pause Session',
      description: session?.paused ? 'Resume the current session' : 'Pause the current session',
      shortcut: 'P',
      category: 'session' as const,
      action: handlePauseToggle,
      disabled: !sessionMachine.canPause || isPausingSession,
    },
    {
      id: 'end-session',
      label: 'End Session',
      description: 'End the current session for all players',
      shortcut: 'E',
      category: 'session' as const,
      action: showEndSessionModalHandler,
      disabled: !sessionMachine.canEndSession || isEndingSession,
    },
    {
      id: 'create-sociale',
      label: 'Create Sociale',
      description: 'Start a new Sociale',
      shortcut: 'N',
      category: 'session' as const,
      action: handleOpenSocialeModal,
      disabled: !canCreateSession || isCreating,
    },
    {
      id: 'toggle-participants',
      label: 'Show Participants',
      description: 'Open participants panel',
      shortcut: 'Tab',
      category: 'participants' as const,
      action: () => {
        toast({
          title: 'Participants panel',
          description: 'Coming soon in Phase 2',
          variant: 'info',
        });
      },
    },
  ], [
    sessionMachine.canAdvance,
    sessionMachine.canPause,
    sessionMachine.canEndSession,
    session?.paused,
    isPerformingAction,
    isPausingSession,
    isEndingSession,
    canCreateSession,
    isCreating,
    handlePrimaryClick,
    handlePauseToggle,
    showEndSessionModalHandler,
    toast,
  ]);

  const handleCommandExecuted = useCallback((commandId: string) => {
    commandPalette.recordCommand(commandId);
  }, [commandPalette]);

  return (
    <CommandPalette
      isOpen={commandPalette.isOpen}
      onClose={commandPalette.close}
      commands={commands}
      sessionPhase={session?.status}
      recentCommandIds={commandPalette.recentCommands}
      onCommandExecuted={handleCommandExecuted}
    />
  );
}
