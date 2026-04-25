// PNG image share button.
// Renders ShareCard off-screen via html-to-image, then lets the player
// share/download the 1080×1920 image via Web Share API or direct download.

import { useShareCard } from './hooks/useShareCard';
import { ShareCard } from './ShareCard';
import type { SessionStats } from '../../domain/share/pickBragStat';

interface ShareCardPngButtonProps {
  stats: SessionStats;
  playerName: string;
  venueName?: string | null;
  correctnessPattern?: boolean[];
  className?: string;
}

export function ShareCardPngButton({
  stats,
  playerName,
  venueName,
  correctnessPattern,
  className,
}: ShareCardPngButtonProps) {
  const { cardRef, bragStat, state, share } = useShareCard({
    stats,
    playerName,
    venueName: venueName ?? undefined,
  });

  const label = state.isGenerating
    ? 'Generating…'
    : state.error
      ? 'Try again'
      : 'Save as Image';

  return (
    <div className={className}>
      {/* Off-screen card for html-to-image capture */}
      <div
        style={{
          position: 'fixed',
          top: '-9999px',
          left: '-9999px',
          width: '1080px',
          height: '1920px',
          pointerEvents: 'none',
          zIndex: -1,
        }}
        aria-hidden="true"
      >
        <div ref={cardRef}>
          <ShareCard
            bragStat={bragStat}
            playerName={playerName}
            venueName={venueName ?? undefined}
            totalScore={stats.totalScore}
            roundsPlayed={stats.roundsPlayed}
            accuracy={stats.totalAnswers > 0 ? stats.correctAnswers / stats.totalAnswers : 0}
            correctnessPattern={correctnessPattern}
          />
        </div>
      </div>

      <button
        type="button"
        onClick={share}
        disabled={state.isGenerating}
        className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-sm font-bold text-white hover:bg-white/20 disabled:opacity-60 transition-colors"
      >
        {label}
      </button>

      {state.error && (
        <p className="mt-1 text-center text-xs text-red-400">{state.error}</p>
      )}
    </div>
  );
}
