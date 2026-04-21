// =============================================================================
// SOCIALE GAME CONTEXT
// =============================================================================
// Provides Sociale game state management with reducer pattern.
// Modeled after RoomPageContext.tsx for consistency.

import { createContext, useContext, useReducer, type ReactNode, type Dispatch } from 'react';
import type { Sociale, Socialite, SocialeResponse } from '../../../domain/types/sociale.types';
import type { GamePhase } from '../../../shared/types/game.types';

export interface SocialeGameState {
  sociale: Sociale | null;
  socialites: Socialite[];
  currentPhase: GamePhase;
  responses: SocialeResponse[];
  isLoading: boolean;
  error: Error | null;
}

export type SocialeGameAction =
  | { type: 'SET_SOCIALE'; payload: Sociale }
  | { type: 'UPDATE_SOCIALE'; payload: Partial<Sociale> }
  | { type: 'SET_SOCIALITES'; payload: Socialite[] }
  | { type: 'ADD_SOCIALITE'; payload: Socialite }
  | { type: 'UPDATE_SOCIALITE'; payload: { id: string; updates: Partial<Socialite> } }
  | { type: 'REMOVE_SOCIALITE'; payload: string }
  | { type: 'UPDATE_PHASE'; payload: GamePhase }
  | { type: 'SET_RESPONSES'; payload: SocialeResponse[] }
  | { type: 'ADD_RESPONSE'; payload: SocialeResponse }
  | { type: 'UPDATE_RESPONSE'; payload: { id: string; updates: Partial<SocialeResponse> } }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: Error | null }
  | { type: 'RESET' };

const initialState: SocialeGameState = {
  sociale: null,
  socialites: [],
  currentPhase: 'lobby',
  responses: [],
  isLoading: false,
  error: null,
};

function socialeGameReducer(
  state: SocialeGameState,
  action: SocialeGameAction
): SocialeGameState {
  switch (action.type) {
    case 'SET_SOCIALE':
      return {
        ...state,
        sociale: action.payload,
        currentPhase: (action.payload.currentPhase as GamePhase) || 'lobby',
        error: null,
      };

    case 'UPDATE_SOCIALE':
      return {
        ...state,
        sociale: state.sociale ? { ...state.sociale, ...action.payload } : null,
      };

    case 'SET_SOCIALITES':
      return {
        ...state,
        socialites: action.payload,
      };

    case 'ADD_SOCIALITE':
      return {
        ...state,
        socialites: [...state.socialites, action.payload],
      };

    case 'UPDATE_SOCIALITE':
      return {
        ...state,
        socialites: state.socialites.map(s =>
          s.id === action.payload.id ? { ...s, ...action.payload.updates } : s
        ),
      };

    case 'REMOVE_SOCIALITE':
      return {
        ...state,
        socialites: state.socialites.filter(s => s.id !== action.payload),
      };

    case 'UPDATE_PHASE':
      return {
        ...state,
        currentPhase: action.payload,
      };

    case 'SET_RESPONSES':
      return {
        ...state,
        responses: action.payload,
      };

    case 'ADD_RESPONSE':
      return {
        ...state,
        responses: [...state.responses, action.payload],
      };

    case 'UPDATE_RESPONSE':
      return {
        ...state,
        responses: state.responses.map(r =>
          r.id === action.payload.id ? { ...r, ...action.payload.updates } : r
        ),
      };

    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      };

    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
        isLoading: false,
      };

    case 'RESET':
      return initialState;

    default:
      return state;
  }
}

export interface SocialeGameContextValue {
  state: SocialeGameState;
  dispatch: Dispatch<SocialeGameAction>;
}

const SocialeGameContext = createContext<SocialeGameContextValue | null>(null);

export interface SocialeGameProviderProps {
  children: ReactNode;
  initialState?: Partial<SocialeGameState>;
}

export function SocialeGameProvider({ children, initialState: initial }: SocialeGameProviderProps) {
  const [state, dispatch] = useReducer(
    socialeGameReducer,
    initial ? { ...initialState, ...initial } : initialState
  );

  return (
    <SocialeGameContext.Provider value={{ state, dispatch }}>
      {children}
    </SocialeGameContext.Provider>
  );
}

/**
 * Hook to access Sociale game context
 * @throws Error if used outside SocialeGameProvider
 */
export function useSocialeGame(): SocialeGameContextValue {
  const context = useContext(SocialeGameContext);
  if (!context) {
    throw new Error('useSocialeGame must be used within SocialeGameProvider');
  }
  return context;
}
