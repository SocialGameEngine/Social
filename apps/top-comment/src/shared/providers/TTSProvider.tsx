import React, { createContext, useContext, useState, useCallback, useMemo } from "react";
import { VOICE_PROFILES, DEFAULT_VOICE_PROFILE, type VoiceProfile } from "../services/voiceProfiles";

interface TTSContextType {
  selectedProfile: VoiceProfile;
  setProfile: (id: string) => void;
  availableProfiles: VoiceProfile[];
}

const TTSContext = createContext<TTSContextType | undefined>(undefined);

export function TTSProvider({ children }: { children: React.ReactNode }) {
  const [selectedProfile, setSelectedProfile] = useState<VoiceProfile>(DEFAULT_VOICE_PROFILE);

  const setProfile = useCallback((id: string) => {
    const profile = VOICE_PROFILES.find((p) => p.id === id);
    if (profile) {
      setSelectedProfile(profile);
    }
  }, []);

  const value = useMemo(
    () => ({
      selectedProfile,
      setProfile,
      availableProfiles: VOICE_PROFILES,
    }),
    [selectedProfile, setProfile]
  );

  return <TTSContext.Provider value={value}>{children}</TTSContext.Provider>;
}

export function useTTSContext() {
  const context = useContext(TTSContext);
  if (context === undefined) {
    throw new Error("useTTSContext must be used within a TTSProvider");
  }
  return context;
}
