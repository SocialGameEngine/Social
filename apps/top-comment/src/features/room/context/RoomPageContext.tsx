import { createContext, useContext, useReducer, type ReactNode } from 'react';
import type { RoomPageState, RoomPageAction, RoomPageContextValue } from '../types';
import type { Room, RoomMembership } from '../../../shared/types';
import type { Session } from '../../../shared/types';

const initialState: RoomPageState = {
  activeModal: null,
  submissionStatus: {
    answer: false,
    vote: false,
  },
  error: null,
  isLoading: false,
};

function roomPageReducer(state: RoomPageState, action: RoomPageAction): RoomPageState {
  switch (action.type) {
    case 'OPEN_MODAL':
      return {
        ...state,
        activeModal: action.payload,
        error: null,
      };
    case 'CLOSE_MODAL':
      return {
        ...state,
        activeModal: null,
      };
    case 'SET_SUBMISSION_STATUS':
      return {
        ...state,
        submissionStatus: {
          ...state.submissionStatus,
          [action.payload.type]: action.payload.submitted,
        },
      };
    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
        isLoading: false,
      };
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      };
    case 'RESET_SUBMISSIONS':
      return {
        ...state,
        submissionStatus: {
          answer: false,
          vote: false,
        },
      };
    default:
      return state;
  }
}

interface RoomPageProviderProps {
  children: ReactNode;
  room: Room | null;
  memberships: RoomMembership[] | null;
  session: Session | null;
  sessionId: string | null;
}

const RoomPageContext = createContext<RoomPageContextValue | null>(null);

export function RoomPageProvider({
  children,
  room,
  memberships,
  session,
  sessionId,
}: RoomPageProviderProps) {
  const [state, dispatch] = useReducer(roomPageReducer, initialState);

  const value: RoomPageContextValue = {
    state,
    room,
    memberships,
    session,
    sessionId,
    dispatch,
  };

  return (
    <RoomPageContext.Provider value={value}>
      {children}
    </RoomPageContext.Provider>
  );
}

export function useRoomPageContext(): RoomPageContextValue {
  const context = useContext(RoomPageContext);
  if (!context) {
    throw new Error('useRoomPageContext must be used within a RoomPageProvider');
  }
  return context;
}
