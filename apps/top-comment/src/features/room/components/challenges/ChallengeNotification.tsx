import { useState, useEffect } from 'react';
import type { Interaction } from '../../../../shared/types';

interface ChallengeNotificationProps {
  challenges: Interaction[];
  onAccept: (interactionId: string) => Promise<void>;
  onDecline: (interactionId: string) => Promise<void>;
  getMemberName: (membershipId: string | null | undefined) => string;
}

export function ChallengeNotification({
  challenges,
  onAccept,
  onDecline,
  getMemberName,
}: ChallengeNotificationProps) {
  if (challenges.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
      {challenges.map((challenge) => (
        <ChallengeToast
          key={challenge.id}
          challenge={challenge}
          onAccept={onAccept}
          onDecline={onDecline}
          sourceName={getMemberName(challenge.sourceMembershipId)}
        />
      ))}
    </div>
  );
}

function ChallengeToast({
  challenge,
  onAccept,
  onDecline,
  sourceName,
}: {
  challenge: Interaction;
  onAccept: (id: string) => Promise<void>;
  onDecline: (id: string) => Promise<void>;
  sourceName: string;
}) {
  const [timeLeft, setTimeLeft] = useState(30);
  const [isResponding, setIsResponding] = useState(false);

  useEffect(() => {
    if (!challenge.challengeExpiresAt) return;

    const calc = () => {
      const ms = new Date(challenge.challengeExpiresAt!).getTime() - Date.now();
      return Math.max(0, Math.ceil(ms / 1000));
    };

    setTimeLeft(calc());
    const interval = setInterval(() => {
      const remaining = calc();
      setTimeLeft(remaining);
      if (remaining <= 0) clearInterval(interval);
    }, 250);

    return () => clearInterval(interval);
  }, [challenge.challengeExpiresAt]);

  const handleAccept = async () => {
    setIsResponding(true);
    try {
      await onAccept(challenge.id);
    } finally {
      setIsResponding(false);
    }
  };

  const handleDecline = async () => {
    setIsResponding(true);
    try {
      await onDecline(challenge.id);
    } finally {
      setIsResponding(false);
    }
  };

  const progress = challenge.challengeExpiresAt
    ? Math.max(0, (new Date(challenge.challengeExpiresAt).getTime() - Date.now()) / 30000)
    : 1;

  return (
    <div className="bg-slate-800 border border-amber-500/50 rounded-xl shadow-lg shadow-amber-500/10 p-4 animate-in slide-in-from-right">
      <div className="flex items-start gap-3">
        <div className="text-2xl shrink-0">⚡</div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-amber-400">
            {sourceName} challenges you!
          </p>
          <p className="text-xs text-slate-300 mt-1 truncate">{challenge.question}</p>
          {challenge.pointsWager && challenge.pointsWager > 0 ? (
            <p className="text-[10px] text-amber-300/70 mt-0.5">
              {challenge.pointsWager} pts wagered
            </p>
          ) : null}
        </div>
        <span className="text-xs font-mono text-slate-500 shrink-0">{timeLeft}s</span>
      </div>

      {/* Progress bar */}
      <div className="mt-2 h-0.5 bg-slate-700 rounded-full overflow-hidden">
        <div
          className="h-full bg-amber-400 transition-all duration-250"
          style={{ width: `${progress * 100}%` }}
        />
      </div>

      <div className="flex gap-2 mt-3">
        <button
          onClick={handleDecline}
          disabled={isResponding || timeLeft <= 0}
          className="flex-1 px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-700 rounded-lg hover:bg-slate-600 transition-colors disabled:opacity-50"
        >
          Decline
        </button>
        <button
          onClick={handleAccept}
          disabled={isResponding || timeLeft <= 0}
          className="flex-1 px-3 py-1.5 text-xs font-medium text-white bg-amber-600 rounded-lg hover:bg-amber-500 transition-colors disabled:opacity-50"
        >
          {isResponding ? '...' : 'Accept'}
        </button>
      </div>
    </div>
  );
}
