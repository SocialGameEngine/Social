import { useState, useEffect } from 'react';
import type { Interaction } from '../../../../shared/types';

function PhaseChip({ label, status }: { label: string; status: string }) {
  const cls =
    status === 'active' ? 'chaos-chip chaos-chip--active'
    : status === 'voting' ? 'chaos-chip chaos-chip--voting'
    : status === 'results' ? 'chaos-chip chaos-chip--results'
    : 'chaos-chip chaos-chip--closed';

  return <span className={cls}>{label}</span>;
}

function CountdownChip({ endsAt }: { endsAt?: string | null }) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(t);
  }, []);

  if (!endsAt) return null;

  const ms = new Date(endsAt).getTime() - now;
  const s = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(s / 60);
  const ss = (s % 60).toString().padStart(2, '0');

  return <span className="chaos-chip chaos-chip--timer">{m}:{ss}</span>;
}

interface InteractionCardProps {
  interaction: Interaction;
  isModerator: boolean;
  hasActed: boolean;
  hasRecentActivity?: boolean; // Add recent activity prop
  onRespond?: () => void;
  onVote?: () => void;
  onViewResponses?: () => void;
  onViewResults?: () => void;
  onAutoAdvanceToResults?: (interactionId: string) => Promise<void>;
}

export function InteractionCard({
  interaction,
  isModerator,
  hasActed,
  hasRecentActivity,
  onRespond,
  onVote,
  onViewResponses,
  onViewResults,
  onAutoAdvanceToResults,
}: InteractionCardProps) {
  const [timeRemaining, setTimeRemaining] = useState<number>(0);

  // Phase-aware CTA label
  const baseAction =
    interaction.status === "active"
      ? (interaction.type === "headline_fibbage" ? "LIE" : "ANSWER")
      : interaction.status === "voting"
        ? "VOTE"
        : interaction.status === "results"
          ? "VIEW"
          : "OPEN";

  const ctaLabel =
    interaction.status === "results"
      ? "VIEW"
      : hasActed
        ? "CHANGE"
        : baseAction;

  const getCtaIcon = () => {
    if (interaction.status === "results") {
      return (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5s8.268 2.943 9.542 7c-1.274 4.057-5.065 7-9.542 7s-8.268-2.943-9.542-7z" />
        </svg>
      );
    }

    if (hasActed) {
      // CHANGE
      return (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9M20 20v-5h-.581m0 0a8.003 8.003 0 01-15.357-2" />
        </svg>
      );
    }

    if (interaction.status === "voting") {
      return (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="8" strokeWidth="2"/>
        </svg>
      );
    }

    // ANSWER / LIE
    return (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 20h9" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4 12.5-12.5z" />
      </svg>
    );
  };


  // Timer countdown for active and voting phases
  useEffect(() => {
    const endTime = interaction.status === 'active' ? interaction.answerEndsAt : interaction.votingEndsAt;
    if (!endTime) return;

    const calculateTimeRemaining = () => {
      const now = new Date().getTime();
      const end = new Date(endTime!).getTime();
      const remaining = Math.max(0, Math.floor((end - now) / 1000));
      setTimeRemaining(remaining);
      
      // Auto-advance when timer ends
      if (remaining === 0) {
        if (interaction.status === 'active' && onAutoAdvanceToResults) {
          onAutoAdvanceToResults(interaction.id);
        }
      }
      return remaining > 0;
    };

    const hasTime = calculateTimeRemaining();
    
    // Auto-advance if time has already ended
    if (!hasTime && interaction.status === 'active' && onAutoAdvanceToResults) {
      void onAutoAdvanceToResults(interaction.id);
    }

    const interval = setInterval(calculateTimeRemaining, 1000);
    return () => clearInterval(interval);
  }, [interaction.status, interaction.answerEndsAt, interaction.votingEndsAt, onAutoAdvanceToResults]);

  useEffect(() => {
    if (timeRemaining === 0 && interaction.status !== 'results' && onAutoAdvanceToResults) {
      void onAutoAdvanceToResults(interaction.id);
    }
  }, [timeRemaining, interaction.status, interaction.id, onAutoAdvanceToResults]);


  // Determine if the card is clickable and what action to take
  const handleClick = () => {
    if (interaction.status === 'results') {
      // Everyone can view results
      if (onViewResults) onViewResults();
    } else if (isModerator) {
      if (interaction.status === 'closed' && onViewResults) {
        onViewResults();
      } else if (interaction.type === 'topic' || interaction.type === 'poll') {
        // For topics and polls, use onRespond to open the appropriate modal
        if (onRespond) onRespond();
      } else if (onViewResponses) {
        onViewResponses();
      }
    } else if (interaction.status === 'voting') {
      // Allow users to vote or change their vote during voting phase
      if (onVote) onVote();
    } else if (interaction.status === 'active') {
      // Allow users to respond or change their response during active phase
      if (onRespond) onRespond();
    }
  };

  // Card is only disabled when there's truly nothing to do
  const isDisabled = false; // Users can always interact to change answers/votes

  const phaseLabel =
  interaction.status === "active"
    ? (interaction.type === "headline_fibbage" ? "LIE" 
       : interaction.type === "topic" ? "TOPIC"
       : interaction.type === "poll" ? "VOTE"
       : "ANSWER")
    : interaction.status === "voting"
      ? "VOTE"
      : interaction.status === "results"
        ? "RESULTS"
        : "CLOSED";

  return (
  <div className="w-full flex justify-start px-2 mb-4">
    {/* Activity pulse effect */}
    {hasRecentActivity && (
      <div className="absolute -inset-3 rounded-lg border-4 border-cyan-400 animate-pulse pointer-events-none z-40 shadow-lg shadow-cyan-400/50" />
    )}
    
    <div className="interaction-row relative flex items-stretch gap-2 w-[95%] max-w-[600px] scale-[0.96] origin-left">
      <div className="chaos-chip-rail">
        <div className="chaos-chip-stack-left">
          <span className="chaos-chip chaos-chip--type">
            {interaction.type === "headline_fibbage" ? "FIBBAGE" : "PROMPT"}
          </span>
        </div>

        <div className="chaos-chip-right">
          <CountdownChip
            endsAt={
              interaction.status === "active"
                ? interaction.answerEndsAt
                : interaction.votingEndsAt
            }
          />
        </div>
      </div>

      {/* Main card button */}
      <div className="flex-1 relative">
        <button
          type="button"
          onClick={handleClick}
          disabled={isDisabled}
          key={`card-${interaction.responseCount}-${interaction.voteCount}`}
          className={[
            "chaos-interaction-card relative overflow-visible w-full",
            "grid grid-rows-[var(--chip-rail-safe)_1fr_var(--phase-chip-safe)]",
            "min-h-[80px] sm:min-h-[100px]",
            "px-1",
            hasActed ? "interacted" : "",
            "animate-[card-activity_0.6s_ease-out]",
          ].join(" ")}
        >
          {/* Row 1: Response/Vote count indicator */}
          <div className="row-start-1 flex justify-end items-start pt-1 pr-2">
            {(interaction.responseCount > 0 || interaction.voteCount > 0) && (
              <div className="flex items-center gap-1">
                {interaction.responseCount > 0 && (
                  <span 
                    key={`response-${interaction.responseCount}`}
                    className="text-xs font-bold text-white bg-blue-500 rounded-full w-5 h-5 flex items-center justify-center animate-[scale-in_0.3s_ease-out]"
                  >
                    {interaction.responseCount}
                  </span>
                )}
                {interaction.voteCount > 0 && (
                  <span 
                    key={`vote-${interaction.voteCount}`}
                    className="text-xs font-bold text-white bg-green-500 rounded-full w-5 h-5 flex items-center justify-center animate-[scale-in_0.3s_ease-out]"
                  >
                    {interaction.voteCount}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Row 2: only this row is centered */}
          <div className="row-start-2 grid place-items-center">
            <div className="w-full text-center">
              <p className="text-base font-black tracking-tight text-black leading-tight line-clamp-1">
                {interaction.type === "headline_fibbage"
                  ? `🎭 ${(interaction.settings as any)?.headlineBlank || interaction.question}` 
                  : interaction.question}
              </p>

              {interaction.type === "headline_fibbage" && (
                <p className="text-xs text-gray-600 mt-1">
                  {(interaction.settings as any)?.sourceName} • {" "}
                  {(interaction.settings as any)?.publishedAt
                    ? new Date((interaction.settings as any).publishedAt).toLocaleDateString()
                    : ""}
                </p>
              )}
            </div>
          </div>
        </button>

        {/* Phase chip: hovers over card bottom */}
        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 pointer-events-none">
          <PhaseChip status={interaction.status} label={phaseLabel} />
        </div>
      </div>

      {/* Right action tile */}
      <button
        type="button"
        onClick={handleClick}
        disabled={isDisabled}
        className={[
          "chaos-action-tile flex items-center justify-center",
          hasActed ? "chaos-action-tile--acted" : "chaos-action-tile--fresh",
        ].join(" ")}
        aria-label={ctaLabel}
      >
        {getCtaIcon()}
      </button>
    </div>
  </div>
);
}
