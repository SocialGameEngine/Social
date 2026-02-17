interface ChallengeButtonProps {
  onChallenge: () => void;
  playerName: string;
}

export function ChallengeButton({ onChallenge, playerName }: ChallengeButtonProps) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onChallenge();
      }}
      className="p-1 rounded transition-colors text-slate-500 hover:text-amber-400 hover:bg-amber-500/10"
      title={`Challenge ${playerName}`}
      aria-label={`Challenge ${playerName}`}
    >
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    </button>
  );
}
