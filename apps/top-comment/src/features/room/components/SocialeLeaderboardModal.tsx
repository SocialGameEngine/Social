import { useState, useRef, useCallback } from 'react';
import { Leaderboard } from '@social/ui';
import { Button } from '../../../components/Button';

export interface SocialeLeaderboardTeam {
  id: string;
  teamName: string; // Changed from displayName to teamName to match LeaderboardTeam
  score: number;
  rank: number;
  mascotId?: number;
}

interface SocialeLeaderboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  finalLeaderboard: SocialeLeaderboardTeam[];
  currentSocialiteId?: string;
  onLeave: () => void;
}

export function SocialeLeaderboardModal({
  isOpen,
  onClose,
  finalLeaderboard,
  currentSocialiteId,
  onLeave,
}: SocialeLeaderboardModalProps) {
  const [selfieImage, setSelfieImage] = useState<string | null>(null);
  const [isTakingSelfie, setIsTakingSelfie] = useState(false);
  const scoreboardRef = useRef<HTMLDivElement>(null);

  const scrollToMyRank = useCallback(() => {
    if (scoreboardRef.current) {
      // Find the element for current socialite and scroll to it
      const myRankElement = scoreboardRef.current.querySelector('[data-is-current="true"]');
      if (myRankElement) {
        myRankElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, []);

  const startSelfie = useCallback(() => {
    setIsTakingSelfie(true);
    // TODO: Implement camera capture logic
    // This would integrate with the camera API similar to EndedPhase
    setTimeout(() => {
      setIsTakingSelfie(false);
      // Placeholder: set actual image from camera
      setSelfieImage('/placeholder-selfie.png');
    }, 1000);
  }, []);

  const shareSelfie = useCallback(() => {
    if (!selfieImage) return;
    // TODO: Implement share functionality
    console.log('Sharing selfie:', selfieImage);
  }, [selfieImage]);

  const downloadSelfie = useCallback(() => {
    if (!selfieImage) return;
    const link = document.createElement('a');
    link.href = selfieImage;
    link.download = 'sociale-selfie.png';
    link.click();
  }, [selfieImage]);

  if (!isOpen) return null;

  const currentSocialite = finalLeaderboard.find(s => s.id === currentSocialiteId);

  return (
    <div className="fixed inset-0 z-[100] flex sm:items-center sm:justify-center sm:p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="relative w-full h-full sm:h-auto sm:max-h-[90vh] sm:max-w-lg overflow-y-auto shadow-2xl bg-slate-900">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between p-4 border-b border-slate-700/50 bg-slate-900">
          <span className="text-pink-400 font-black text-lg">
            Sociale Complete!
          </span>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 transition-colors"
            aria-label="Close"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="space-y-5 p-4">
          {/* Title Section */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-pink-400">
                Final Scoreboard
              </h2>
              <p className="text-sm text-cyan-300">Thanks for playing!</p>
            </div>
            {currentSocialite ? (
              <Button
                variant="secondary"
                onClick={scrollToMyRank}
                className="px-4 py-2 text-xs"
              >
                My rank
              </Button>
            ) : null}
          </div>

          {/* Selfie Section */}
          {currentSocialite && (
            <div className="space-y-3">
              <div className="text-center">
                <h3 className="text-lg font-semibold text-brand-primary">
                  Celebrate Your Victory!
                </h3>
                <p className="text-sm text-slate-300">Take a selfie with your score</p>
              </div>

              {selfieImage ? (
                <div className="space-y-3">
                  <div className="flex justify-center">
                    <img
                      src={selfieImage}
                      alt="Selfie with score"
                      className="max-w-full h-auto rounded-2xl shadow-lg"
                      style={{ maxHeight: "300px" }}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={shareSelfie}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      📤 Share Selfie
                    </Button>
                    <Button
                      onClick={downloadSelfie}
                      variant="secondary"
                      className="flex-1"
                    >
                      💾 Download
                    </Button>
                  </div>
                  <Button
                    onClick={() => setSelfieImage(null)}
                    variant="ghost"
                    fullWidth
                  >
                    Take Another Selfie
                  </Button>
                </div>
              ) : (
                <Button
                  onClick={startSelfie}
                  disabled={isTakingSelfie}
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                >
                  {isTakingSelfie ? "Starting Camera..." : "📸 Take Selfie"}
                </Button>
              )}
            </div>
          )}

          {/* Leaderboard */}
          <div
            ref={scoreboardRef}
            className="elevated-card max-h-80 overflow-y-auto p-4"
          >
            <Leaderboard
              leaderboard={finalLeaderboard}
              highlightTeamId={currentSocialiteId}
              className="grid gap-3 text-lg font-semibold lg:grid-cols-2"
              isDark={true}
            />
          </div>

          {/* Leave Button */}
          <Button variant="ghost" onClick={onLeave} fullWidth>
            Leave Sociale
          </Button>
        </div>
      </div>
    </div>
  );
}

export default SocialeLeaderboardModal;
