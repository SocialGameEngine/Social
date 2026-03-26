import { getPhaseConfig, isActionPhase } from '../utils/phaseConfig';
import type { GamePhase } from '../types';

interface PhaseButtonProps {
  phase: GamePhase;
  hasSubmitted: boolean;
  onClick: () => void;
  disabled?: boolean;
  endsAt?: string;
  customText?: string;
  customSubText?: string;
}

export function PhaseButton({
  phase,
  hasSubmitted,
  onClick,
  disabled = false,
  endsAt,
  customText,
  customSubText,
}: PhaseButtonProps) {
  // Currently unused but may be needed for future timer functionality
  void endsAt;
  
  const config = getPhaseConfig(phase);
  const isAction = isActionPhase(phase);

  const buttonText = customText || (hasSubmitted ? config.submittedText : config.buttonText);
  const subText = customSubText || (hasSubmitted 
    ? 'Click to change your submission'
    : isAction 
      ? config.description 
      : undefined);

  // Use hero session button design for all phases
  return (
    <div className="pt-2">
      <div className="relative rounded-[28px] p-3 overflow-visible">
        {/* spotlight */}
        {/* <div className="absolute inset-0 -z-10 rounded-[28px] bg-gradient-radial from-fuchsia-500/25 via-cyan-400/10 to-transparent blur-xl" /> */}
        
        <button 
          className="w-full chaos-session-button"
          data-phase={phase}
          onClick={onClick}
          disabled={disabled || (!isAction && phase !== 'results')}
        >
          <div className="flex items-center justify-between">
            <div className="text-left">
              <div className="text-2xl font-black tracking-tight">
                {buttonText}
              </div>
              <div className="text-xs font-bold uppercase tracking-widest opacity-80">
                {subText || config.description}
              </div>
            </div>
            <div className="ml-3">
              {phase === 'lobby' && (
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z"/>
                </svg>
              )}
              {phase === 'answer' && (
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 20h9" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4 12.5-12.5z" />
                </svg>
              )}
              {phase === 'vote' && (
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="8" strokeWidth="2"/>
                </svg>
              )}
              {phase === 'results' && (
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5s8.268 2.943 9.542 7c-1.274 4.057-5.065 7-9.542 7s-8.268-2.943-9.542-7z" />
                </svg>
              )}
              {phase === 'ended' && (
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
            </div>
          </div>
        </button>
      </div>
    </div>
  );
}
