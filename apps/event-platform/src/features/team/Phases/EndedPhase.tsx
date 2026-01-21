import { Card, Button, Leaderboard } from "@social/ui";
import { useTheme } from "../../../shared/providers/ThemeProvider";
import type { Team } from "../../../shared/types";

interface LeaderboardTeam extends Team {
  rank: number;
}

interface EndedPhaseProps {
  currentTeam: Team | null;
  finalLeaderboard: LeaderboardTeam[];
  scrollToMyRank: () => void;
  selfieImage: string | null;
  startSelfie: () => void;
  shareSelfie: () => void;
  downloadSelfie: () => void;
  setSelfieImage: (image: string | null) => void;
  isTakingSelfie: boolean;
  handleLeave: () => void;
  scoreboardRef: React.Ref<HTMLDivElement>;
}

export function EndedPhase({
  currentTeam,
  finalLeaderboard,
  scrollToMyRank,
  selfieImage,
  startSelfie,
  shareSelfie,
  downloadSelfie,
  setSelfieImage,
  isTakingSelfie,
  handleLeave,
  scoreboardRef,
}: EndedPhaseProps) {
  const { isDark } = useTheme();
  return (
    <Card className="space-y-5" isDark={isDark}>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-pink-400">
            Final Scoreboard
          </h2>
          <p className="text-sm text-cyan-300">Thanks for playing!</p>
        </div>
        {currentTeam ? (
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
      {currentTeam && (
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
                  style={{ maxHeight: "400px" }}
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

      <div
        ref={scoreboardRef}
        className={`elevated-card max-h-80 overflow-y-auto p-4`}
      >
        <Leaderboard
          leaderboard={finalLeaderboard}
          highlightTeamId={currentTeam?.id}
          variant="presenter"
          className="grid gap-3 text-lg font-semibold lg:grid-cols-2"
          isDark={isDark}
        />
      </div>
      <Button variant="ghost" onClick={handleLeave} fullWidth>
        Leave session
      </Button>
    </Card>
  );
}

