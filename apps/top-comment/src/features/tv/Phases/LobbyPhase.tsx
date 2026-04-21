import type { Sociale, Socialite } from '../../../domain/types/sociale.types';
import { DrinkTank } from '../../../components/DrinkTank';
import { useTheme } from '../../../shared/providers/ThemeProvider';

interface LobbyPhaseProps {
  sociale: Sociale;
  socialites: Socialite[];
  roomCode: string;
  isDark?: boolean;
}

export function LobbyPhase({ sociale, socialites, roomCode, isDark = false }: LobbyPhaseProps) {
  const { isDark: themeDark } = useTheme();
  const dark = isDark ?? themeDark;

  return (
    <div className="flex flex-col gap-6">
      <p className={`text-center text-lg ${!dark ? 'text-slate-600' : 'text-cyan-300'}`}>
        {socialites.length} player{socialites.length === 1 ? '' : 's'} joined - scan the QR to join
      </p>
      {/* Reuse DrinkTank if it accepts Socialite[], otherwise render a simple name grid */}
      {/* Check DrinkTank prop types first - it may expect RoomMembership[] */}
      {/* If incompatible, render a simple grid of socialite display names instead */}
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
        {socialites.map(s => (
          <div key={s.id} className={`rounded-xl p-3 text-center text-sm font-semibold ${!dark ? 'bg-slate-100 text-slate-800' : 'bg-slate-800 text-cyan-100'}`}>
            {s.displayName}
          </div>
        ))}
      </div>
    </div>
  );
}
