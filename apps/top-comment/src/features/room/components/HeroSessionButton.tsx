interface HeroSessionButtonProps {
  onStartSession: () => void;
  status?: 'ready' | 'live' | 'paused' | 'next-round' | 'ends-in';
  timeRemaining?: string;
  roundNumber?: number;
}

export function HeroSessionButton({ 
  onStartSession, 
  status = 'ready',
  timeRemaining,
  roundNumber 
}: HeroSessionButtonProps) {
  const getStatusChip = () => {
    switch (status) {
      case 'live':
        return <span className="chaos-chip chaos-chip--active pulse-neon">LIVE</span>;
      case 'paused':
        return <span className="chaos-chip chaos-chip--active">PAUSED</span>;
      case 'next-round':
        return <span className="chaos-chip chaos-chip--active">ROUND {roundNumber || 2}</span>;
      case 'ends-in':
        return <span className="chaos-chip chaos-chip--active">ENDS IN {timeRemaining || '0:25'}</span>;
      default:
        return <span className="chaos-chip chaos-chip--type">SESSION</span>;
    }
  };

  const getButtonText = () => {
    switch (status) {
      case 'live':
        return 'Round in Progress';
      case 'paused':
        return 'Round Paused';
      case 'next-round':
        return 'Start Next Round';
      case 'ends-in':
        return 'Round Active';
      default:
        return 'Start Round';
    }
  };

  const getSubtext = () => {
    switch (status) {
      case 'live':
        return 'Chaos in progress • Big energy';
      case 'paused':
        return 'Waiting to resume • Host controls';
      case 'next-round':
        return 'Ready for next chaos • Host controls';
      case 'ends-in':
        return `Time remaining • ${timeRemaining || '0:25'} left`;
      default:
        return 'Host controls • Big chaos energy';
    }
  };

  const isDisabled = status === 'live' || status === 'paused';

  return (
    <div className="px-3 pt-2">
      <div className="relative rounded-[28px] p-3 overflow-visible">
        {/* spotlight */}
        <div className="absolute inset-0 -z-10 rounded-[28px] bg-gradient-radial from-fuchsia-500/25 via-cyan-400/10 to-transparent blur-xl" />
        
        {/* sticker label */}
        <div className="absolute -top-3 left-4">
          {getStatusChip()}
        </div>

        <button 
          className="w-full chaos-session-button"
          onClick={onStartSession}
          disabled={isDisabled}
        >
          <div className="flex items-center justify-between">
            <div className="text-left">
              <div className="text-2xl font-black tracking-tight">
                {getButtonText()}
              </div>
              <div className="text-xs font-bold uppercase tracking-widest opacity-80">
                {getSubtext()}
              </div>
            </div>
            <div className="ml-3">
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z"/>
              </svg>
            </div>
          </div>
        </button>
      </div>
    </div>
  );
}
