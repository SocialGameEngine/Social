// Host-side tie-break status panel.
// Shown in SocialePhaseRenderer when sociale.isTieBreak is true.
// Displays participating players and tie-break round number.

import type { Sociale } from '../../../domain/types/sociale.types';
import type { Socialite } from '../../../domain/types/sociale.types';

interface TieBreakControlsProps {
  sociale: Sociale;
  socialites: Socialite[];
  onAdvancePhase: () => void;
}

export function TieBreakControls({
  sociale,
  socialites,
  onAdvancePhase,
}: TieBreakControlsProps) {
  const participants = sociale.tieBreakParticipants ?? [];
  const roundNumber = sociale.tieBreakRoundNumber ?? 1;

  const participantNames = participants.map((id) => {
    const match = socialites.find((s) => s.id === id || s.userId === id);
    return match?.displayName ?? id;
  });

  return (
    <div className="rounded-2xl border border-orange-500/40 bg-orange-500/10 p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <span className="text-2xl">🔥</span>
        <div>
          <p className="text-sm font-black uppercase tracking-widest text-orange-400">
            Tie-Break Active
          </p>
          <p className="text-xs text-orange-300/70">
            Sudden death round {roundNumber} · 10 s · ×2 points
          </p>
        </div>
      </div>

      {/* Participant list */}
      <div className="flex flex-wrap gap-2">
        {participantNames.map((name, i) => (
          <span
            key={i}
            className="px-3 py-1 rounded-full bg-orange-500/20 border border-orange-500/30 text-orange-200 text-sm font-semibold"
          >
            {name}
          </span>
        ))}
      </div>

      {/* Advance button */}
      <button
        type="button"
        onClick={onAdvancePhase}
        className="w-full rounded-xl bg-orange-500 hover:bg-orange-400 text-white text-sm font-black py-2.5 uppercase tracking-wider transition-colors"
      >
        Advance Phase
      </button>
    </div>
  );
}
