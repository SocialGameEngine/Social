import type { SocialeScoreboardEntry } from '../../../domain/types/sociale.types';
import { Card, Leaderboard } from '@social/ui';
import { useTheme } from '../../../shared/providers/ThemeProvider';

interface EndedPhaseProps {
  scoreboard: SocialeScoreboardEntry[];
  isDark?: boolean;
}

export function EndedPhase({ scoreboard, isDark = false }: EndedPhaseProps) {
  const { isDark: themeDark } = useTheme();
  const dark = isDark ?? themeDark;

  // Map SocialeScoreboardEntry to LeaderboardTeam format
  const mappedScoreboard = scoreboard.map(entry => ({
    id: entry.socialiteId,
    rank: entry.rank,
    teamName: entry.displayName,
    score: entry.score,
    mascotId: entry.mascotId,
  }));

  return (
    <Card isDark={dark} className="text-center">
      <h2 className={`text-3xl font-black ${!dark ? 'text-slate-900' : 'text-pink-400'}`}>
        That's a wrap!
      </h2>
      <div className="mt-6">
        <Leaderboard
          leaderboard={mappedScoreboard}
          variant="presenter"
          className="grid gap-3 text-lg font-semibold lg:grid-cols-2"
          isDark={dark}
        />
      </div>
    </Card>
  );
}
