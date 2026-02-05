import { Button } from '../../../components/Button';
import { Timer } from '../../../components/Timer';
import { getPhaseConfig, isActionPhase } from '../utils/phaseConfig';
import type { GamePhase } from '../types';

interface PhaseButtonProps {
  phase: GamePhase;
  hasSubmitted: boolean;
  onClick: () => void;
  disabled?: boolean;
  endsAt?: string;
}

export function PhaseButton({
  phase,
  hasSubmitted,
  onClick,
  disabled = false,
  endsAt,
}: PhaseButtonProps) {
  const config = getPhaseConfig(phase);
  const isAction = isActionPhase(phase);

  const buttonText = hasSubmitted ? config.submittedText : config.buttonText;
  const subText = hasSubmitted 
    ? 'Click to change your submission'
    : isAction 
      ? config.description 
      : undefined;

  return (
    <Button
      onClick={onClick}
      disabled={disabled || (!isAction && phase !== 'results')}
      variant={hasSubmitted ? 'secondary' : 'primary'}
      size="lg"
      className="w-full py-6 text-lg relative"
      aria-label={buttonText}
      aria-pressed={hasSubmitted}
    >
      <div className="flex flex-col items-center">
        <span className="font-semibold">{buttonText}</span>
        {subText && (
          <span className="text-sm opacity-80 mt-1">{subText}</span>
        )}
        {endsAt && (
          <Timer
            endTime={endsAt}
            size="sm"
            aria-label="Time remaining"
          />
        )}
      </div>
    </Button>
  );
}
