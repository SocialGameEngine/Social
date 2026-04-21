import type { Sociale, SocialeRound, SocialeResponse } from '../../../domain/types/sociale.types';
import type { SocialeScoreboardEntry } from '../../../domain/types/sociale.types';
import { Card, Leaderboard } from '@social/ui';
import { useTheme } from '../../../shared/providers/ThemeProvider';

interface ResultsPhaseProps {
  sociale: Sociale;
  currentRound: SocialeRound | null;
  responses: SocialeResponse[];
  scoreboard: SocialeScoreboardEntry[];
  isDark?: boolean;
}

export function ResultsPhase({ scoreboard, isDark = false }: ResultsPhaseProps) {
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
    <Card isDark={dark}>
      <p className={`text-sm font-semibold uppercase tracking-[0.3em] ${!dark ? 'text-slate-600' : 'text-slate-300'}`}>
        Leaderboard
      </p>
      <div className="mt-4">
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
