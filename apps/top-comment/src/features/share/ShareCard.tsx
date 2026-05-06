import type { BragStat } from '../../domain/share/pickBragStat';

interface ShareCardProps {
  bragStat: BragStat;
  playerName: string;
  venueName?: string;
  totalScore: number;
  roundsPlayed: number;
  accuracy: number;
  correctnessPattern?: boolean[];
}

export function ShareCard({
  bragStat,
  playerName,
  venueName,
  totalScore,
  roundsPlayed,
  accuracy,
  correctnessPattern = [],
}: ShareCardProps) {
  return (
    <div
      className="relative overflow-hidden bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400"
      style={{
        width: '1080px',
        height: '1920px',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
          backgroundSize: '40px 40px',
        }} />
      </div>

      {/* Content container */}
      <div className="relative h-full flex flex-col items-center justify-between p-16 text-white">
        
        {/* Header */}
        <div className="text-center">
          <div className="text-5xl font-black tracking-tight mb-4">
            SOCIAL GAME ENGINE
          </div>
          {venueName && (
            <div className="text-3xl font-medium opacity-90">
              @ {venueName}
            </div>
          )}
        </div>

        {/* Main brag stat */}
        <div className="flex-1 flex flex-col items-center justify-center text-center px-12">
          <div className="text-[180px] mb-8 leading-none">
            {bragStat.emoji}
          </div>
          <div className="text-7xl font-black mb-6 leading-tight">
            {bragStat.headline}
          </div>
          <div className="text-4xl font-medium opacity-90">
            {bragStat.subtext}
          </div>
        </div>

        {/* Stats grid */}
        <div className="w-full max-w-4xl">
          <div className="grid grid-cols-3 gap-8 mb-12">
            <div className="text-center">
              <div className="text-6xl font-black mb-2">
                {totalScore.toLocaleString()}
              </div>
              <div className="text-2xl font-medium opacity-80">
                Points
              </div>
            </div>
            <div className="text-center">
              <div className="text-6xl font-black mb-2">
                {roundsPlayed}
              </div>
              <div className="text-2xl font-medium opacity-80">
                Rounds
              </div>
            </div>
            <div className="text-center">
              <div className="text-6xl font-black mb-2">
                {Math.round(accuracy * 100)}%
              </div>
              <div className="text-2xl font-medium opacity-80">
                Accuracy
              </div>
            </div>
          </div>

          {/* Correctness pattern (emoji-dot grid) */}
          {correctnessPattern.length > 0 && (
            <div className="mb-12">
              <div className="text-2xl font-medium mb-4 text-center opacity-80">
                Performance
              </div>
              <div className="flex flex-wrap justify-center gap-3">
                {correctnessPattern.slice(0, 20).map((correct, i) => (
                  <div
                    key={i}
                    className="w-12 h-12 rounded-full flex items-center justify-center text-2xl"
                    style={{
                      backgroundColor: correct 
                        ? 'rgba(34, 197, 94, 0.3)' 
                        : 'rgba(239, 68, 68, 0.3)',
                      border: correct 
                        ? '3px solid rgba(34, 197, 94, 0.8)' 
                        : '3px solid rgba(239, 68, 68, 0.8)',
                    }}
                  >
                    {correct ? '✓' : '✗'}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Player name */}
          <div className="text-center">
            <div className="text-5xl font-black mb-2">
              {playerName}
            </div>
            <div className="text-2xl font-medium opacity-70">
              played at {venueName || 'Social Game Engine'}
            </div>
          </div>
        </div>

        {/* Footer CTA */}
        <div className="text-center">
          <div className="text-3xl font-bold mb-3">
            Join the game
          </div>
          <div className="text-2xl font-medium opacity-80">
            socialgameengine.com
          </div>
        </div>
      </div>
    </div>
  );
}
