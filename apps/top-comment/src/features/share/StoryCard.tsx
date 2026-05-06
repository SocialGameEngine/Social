import type { StoryCard as StoryCardData } from '../../domain/share/generateStoryCards';

interface StoryCardProps {
  card: StoryCardData;
  playerName: string;
}

export function StoryCard({ card, playerName }: StoryCardProps) {
  return (
    <div
      className={`relative overflow-hidden bg-gradient-to-br from-${card.gradient.from} ${card.gradient.via ? `via-${card.gradient.via}` : ''} to-${card.gradient.to}`}
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
        
        {/* Header - Player name */}
        <div className="text-center">
          <div className="text-4xl font-bold opacity-90">
            {playerName}
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 flex flex-col items-center justify-center text-center px-12">
          {/* Emoji */}
          <div className="text-[200px] mb-12 leading-none">
            {card.emoji}
          </div>

          {/* Title */}
          <div className="text-8xl font-black mb-8 leading-tight">
            {card.title}
          </div>

          {/* Subtitle */}
          {card.subtitle && (
            <div className="text-5xl font-medium mb-12 opacity-90">
              {card.subtitle}
            </div>
          )}

          {/* Main value */}
          <div className="text-[140px] font-black mb-6 leading-none">
            {card.mainValue}
          </div>

          {/* Secondary value */}
          {card.secondaryValue && (
            <div className="text-5xl font-medium opacity-80">
              {card.secondaryValue}
            </div>
          )}

          {/* Visual data */}
          {card.visualData && (
            <div className="mt-16 w-full max-w-3xl">
              {renderVisualData(card.visualData)}
            </div>
          )}
        </div>

        {/* Footer - Story indicator */}
        <div className="text-center">
          <div className="text-3xl font-medium opacity-70">
            Social Game Engine
          </div>
        </div>
      </div>
    </div>
  );
}

function renderVisualData(visualData: StoryCardData['visualData']) {
  if (!visualData) return null;

  switch (visualData.type) {
    case 'bar':
      return <BarChart data={visualData.data as number[]} />;
    case 'dots':
      return <DotsPattern data={visualData.data as boolean[]} />;
    case 'arc':
      return <RankArc data={visualData.data as number[]} />;
    case 'line':
      return <LineChart data={visualData.data as number[]} />;
    default:
      return null;
  }
}

function BarChart({ data }: { data: number[] }) {
  const maxValue = Math.max(...data);
  
  return (
    <div className="flex items-end justify-center gap-4 h-64">
      {data.map((value, i) => {
        const height = maxValue > 0 ? (value / maxValue) * 100 : 0;
        return (
          <div
            key={i}
            className="flex-1 bg-white bg-opacity-30 rounded-t-lg transition-all"
            style={{ height: `${height}%`, minHeight: '8px' }}
          />
        );
      })}
    </div>
  );
}

function DotsPattern({ data }: { data: boolean[] }) {
  return (
    <div className="flex flex-wrap justify-center gap-4">
      {data.slice(0, 20).map((correct, i) => (
        <div
          key={i}
          className="w-16 h-16 rounded-full flex items-center justify-center text-3xl font-bold"
          style={{
            backgroundColor: correct 
              ? 'rgba(34, 197, 94, 0.3)' 
              : 'rgba(239, 68, 68, 0.3)',
            border: correct 
              ? '4px solid rgba(34, 197, 94, 0.8)' 
              : '4px solid rgba(239, 68, 68, 0.8)',
          }}
        >
          {correct ? '✓' : '✗'}
        </div>
      ))}
    </div>
  );
}

function RankArc({ data }: { data: number[] }) {
  const [startRank, endRank] = data;
  const improved = startRank > endRank;
  
  return (
    <div className="flex flex-col items-center gap-8">
      <div className="flex items-center justify-between w-full max-w-2xl">
        <div className="text-center">
          <div className="text-6xl font-black mb-2">#{startRank}</div>
          <div className="text-3xl font-medium opacity-80">Start</div>
        </div>
        
        <div className="flex-1 mx-8 relative h-24">
          <svg
            viewBox="0 0 200 100"
            className="w-full h-full"
            style={{ overflow: 'visible' }}
          >
            <path
              d={improved 
                ? "M 10 80 Q 100 -20 190 20"
                : "M 10 20 Q 100 120 190 80"
              }
              stroke="white"
              strokeWidth="8"
              fill="none"
              strokeLinecap="round"
              opacity="0.6"
            />
            <path
              d={improved 
                ? "M 10 80 Q 100 -20 190 20"
                : "M 10 20 Q 100 120 190 80"
              }
              stroke="white"
              strokeWidth="8"
              fill="none"
              strokeLinecap="round"
              strokeDasharray="10 10"
              opacity="0.9"
            />
          </svg>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-5xl">
            {improved ? '📈' : '💪'}
          </div>
        </div>
        
        <div className="text-center">
          <div className="text-6xl font-black mb-2">#{endRank}</div>
          <div className="text-3xl font-medium opacity-80">Final</div>
        </div>
      </div>
    </div>
  );
}

function LineChart({ data }: { data: number[] }) {
  const maxValue = Math.max(...data);
  const minValue = Math.min(...data);
  const range = maxValue - minValue;
  
  const points = data.map((value, i) => {
    const x = (i / (data.length - 1)) * 100;
    const y = range > 0 ? 100 - ((value - minValue) / range) * 100 : 50;
    return `${x},${y}`;
  }).join(' ');
  
  return (
    <div className="w-full h-64">
      <svg viewBox="0 0 100 100" className="w-full h-full" preserveAspectRatio="none">
        <polyline
          points={points}
          stroke="white"
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.8"
        />
        {data.map((value, i) => {
          const x = (i / (data.length - 1)) * 100;
          const y = range > 0 ? 100 - ((value - minValue) / range) * 100 : 50;
          return (
            <circle
              key={i}
              cx={x}
              cy={y}
              r="2"
              fill="white"
              opacity="0.9"
            />
          );
        })}
      </svg>
    </div>
  );
}
