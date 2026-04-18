// =============================================================================
// HOST GAME CONTEXT
// =============================================================================
// Provides host game state to components, reducing prop drilling.

import { createContext, useContext, type ReactNode } from 'react';
import type { Session, Room, RoomMembership } from '../../../shared/types';
import type { Sociale, Socialite } from '../../../domain/types/sociale.types';
import type { SessionPlayer } from '../../../services/sessionPlayerService';

export interface HostGameContextValue {
  // Session state
  session: Session | null;
  sessionId: string | null;
  
  // Room state
  room: Room | null;
  roomMemberships: RoomMembership[];
  roomCode: string;
  
  // Sociale state
  activeSociale: Sociale | null;
  
  // Players
  sessionPlayers: SessionPlayer[];
  socialites: Socialite[];
  
  // Computed
  playerCount: number;
  isLoading: boolean;
}

const HostGameContext = createContext<HostGameContextValue | null>(null);

export interface HostGameProviderProps {
  value: HostGameContextValue;
  children: ReactNode;
}

export function HostGameProvider({ value, children }: HostGameProviderProps) {
  return (
    <HostGameContext.Provider value={value}>
      {children}
    </HostGameContext.Provider>
  );
}

/**
 * Hook to access host game context
 * @throws Error if used outside HostGameProvider
 */
export function useHostGame(): HostGameContextValue {
  const context = useContext(HostGameContext);
  if (!context) {
    throw new Error('useHostGame must be used within HostGameProvider');
  }
  return context;
}
