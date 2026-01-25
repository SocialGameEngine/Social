import { createContext, useContext, useState, type PropsWithChildren } from "react";
import type { SessionStatus } from "../types";

interface CurrentPhaseContextValue {
  currentPhase: SessionStatus | null;
  setCurrentPhase: (phase: SessionStatus | null) => void;
}

const CurrentPhaseContext = createContext<CurrentPhaseContextValue | undefined>(
  undefined,
);

export function CurrentPhaseProvider({ children }: PropsWithChildren) {
  const [currentPhase, setCurrentPhase] = useState<SessionStatus | null>(null);

  return (
    <CurrentPhaseContext.Provider value={{ currentPhase, setCurrentPhase }}>
      {children}
    </CurrentPhaseContext.Provider>
  );
}

export function useCurrentPhase() {
  const context = useContext(CurrentPhaseContext);
  if (!context) {
    // Return a no-op if context is not available (for pages that don't need it)
    return { currentPhase: null, setCurrentPhase: () => {} };
  }
  return context;
}

