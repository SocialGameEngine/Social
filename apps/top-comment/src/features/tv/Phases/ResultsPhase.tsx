import type { Sociale, SocialeRound, SocialeResponse } from '../../../domain/types/sociale.types';
import type { SocialeScoreboardEntry } from '../../../domain/types/sociale.types';
import { Card, Leaderboard } from '@social/ui';
import { useTheme } from '../../../shared/providers/ThemeProvider';
import { DualLeaderboard } from '../components/DualLeaderboard';
import { useRoomAllTimeLeaderboard } from '../hooks/useRoomAllTimeLeaderboard';

interface ResultsPhaseProps {
  sociale: Sociale;
  currentRound: SocialeRound | null;
  responses: SocialeResponse[];
  scoreboard: SocialeScoreboardEntry[];
  roomId?: string;
  isDark?: boolean;
}

export function ResultsPhase({ sociale, scoreboard, roomId, isDark = false }: ResultsPhaseProps) {
  const { isDark: themeDark } = useTheme();
  const dark = isDark ?? themeDark;

  const isAmbient = sociale.mode === 'ambient';

  const allTimeQuery = useRoomAllTimeLeaderboard(isAmbient ? roomId : undefined);

  const mappedScoreboard = scoreboard.map((entry) => ({
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
        {isAmbient ? (
          <DualLeaderboard
            tonightEntries={mappedScoreboard}
            allTimeEntries={allTimeQuery.data ?? []}
            isDark={dark}
          />
        ) : (
          <Leaderboard
            leaderboard={mappedScoreboard}
            variant="presenter"
            className="grid gap-3 text-lg font-semibold lg:grid-cols-2"
            isDark={dark}
          />
        )}
      </div>
    </Card>
  );
}
