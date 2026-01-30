import { useMemo, useState } from "react";
import { useTTS, useToast } from "../shared/hooks";
import { useTTSContext } from "../shared/providers/TTSProvider";
import type { VoiceProfile } from "../shared/services/voiceProfiles";
import Button from "./Button";

interface TTSControlsProps {
  text: string;
  label?: string;
  className?: string;
  disabled?: boolean;
  showMethod?: boolean; // Show which TTS method is being used
  profile?: VoiceProfile;
}

export function TTSControls({
  text,
  label = "Speak",
  className,
  disabled = false,
  showMethod = false,
  profile: profileProp,
}: TTSControlsProps) {
  const { toast } = useToast();
  const { selectedProfile: contextProfile } = useTTSContext();
  const [hasShownMethodToast, setHasShownMethodToast] = useState(false);
  
  const activeProfile = profileProp ?? contextProfile;
  
  const { play, stop, toggleMute, isPlaying, isLoading, isMuted, isAvailable, method } = useTTS({
    profile: activeProfile,
    onError: (error: Error) => {
      console.error("TTS Error:", error);
      toast({ title: error.message || "Speech synthesis failed", variant: "error" });
    },
    onStart: () => {
      if (showMethod && !hasShownMethodToast) {
        const methodName = method === "google-cloud" ? "Google Cloud TTS (Premium)" : "Browser Speech (Free)";
        toast({ title: `Using ${methodName}`, variant: "info" });
        setHasShownMethodToast(true);
      }
    },
  });

  const resolvedText = useMemo(() => text.trim(), [text]);

  if (!resolvedText || !isAvailable) {
    return null;
  }

  const handlePlay = (): void => {
    if (isPlaying) {
      stop();
      return;
    }
    void play(resolvedText);
  };

  const methodBadge = showMethod && method ? (
    <span 
      className="text-xs px-2 py-0.5 rounded-full bg-cyan-900/30 text-cyan-300 border border-cyan-400/50"
      title={method === "google-cloud" ? "Using Google Cloud TTS for premium quality" : "Using browser speech synthesis"}
    >
      {method === "google-cloud" ? "Premium" : "Browser"}
    </span>
  ) : null;

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className ?? ""}`}>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={handlePlay}
        isLoading={isLoading}
        disabled={disabled}
        title={isPlaying ? "Stop speech" : `${label} - ${method === "google-cloud" ? "Premium quality" : "Browser native"}`}
      >
        {isPlaying ? "Stop" : label}
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={toggleMute}
        disabled={disabled}
        aria-pressed={isMuted}
        title={isMuted ? "Unmute TTS" : "Mute TTS"}
      >
        {isMuted ? "Unmute" : "Mute"}
      </Button>
      {methodBadge}
    </div>
  );
}

export default TTSControls;
