import type { SocialeRound, SocialeResponse, SocialeVote, Socialite } from '../../../domain/types/sociale.types';
import { Card } from '@social/ui';
import { useTheme } from '../../../shared/providers/ThemeProvider';

interface VotePhaseProps {
  currentRound: SocialeRound | null;
  responses: SocialeResponse[];
  votes: SocialeVote[];
  socialites: Socialite[];
  isDark?: boolean;
}

export function VotePhase({ currentRound, responses, votes, socialites, isDark = false }: VotePhaseProps) {
  const { isDark: themeDark } = useTheme();
  const dark = isDark ?? themeDark;

  // Count votes per response
  const voteCounts = responses.reduce<Record<string, number>>((acc, r) => {
    acc[r.id] = votes.filter(v => v.targetResponseId === r.id).length;
    return acc;
  }, {});

  const sorted = [...responses].sort((a, b) => (voteCounts[b.id] ?? 0) - (voteCounts[a.id] ?? 0));

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
      {sorted.map(r => {
        const author = socialites.find(s => s.id === r.socialiteId)?.displayName ?? 'Unknown';
        const count = voteCounts[r.id] ?? 0;
        return (
          <Card key={r.id} isDark={dark}>
            <p className="font-semibold">{typeof r.value === 'string' ? r.value : JSON.stringify(r.value)}</p>
            <div className="mt-2 flex items-center justify-between">
              <span className={`text-xs ${!dark ? 'text-slate-500' : 'text-cyan-400'}`}>{author}</span>
              <span className={`text-sm font-bold ${!dark ? 'text-slate-700' : 'text-pink-400'}`}>
                {count} vote{count === 1 ? '' : 's'}
              </span>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
