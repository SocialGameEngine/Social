interface ChallengeResultsProps {
  isOpen: boolean;
  onClose: () => void;
  winnerName: string | null;
  loserName: string | null;
  points: number;
  isDraw: boolean;
}

export function ChallengeResults({
  isOpen,
  onClose,
  winnerName,
  loserName,
  points,
  isDraw,
}: ChallengeResultsProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-xs mx-4 bg-slate-800 border border-slate-700 rounded-xl shadow-xl p-6 text-center space-y-4">
        {isDraw ? (
          <>
            <div className="text-4xl">🤝</div>
            <h3 className="text-lg font-bold text-white">It's a draw!</h3>
            <p className="text-sm text-slate-400">No points exchanged.</p>
          </>
        ) : (
          <>
            <div className="text-4xl">🏆</div>
            <h3 className="text-lg font-bold text-amber-400">
              {winnerName} wins!
            </h3>
            {points > 0 && (
              <p className="text-sm text-slate-300">
                +{points} points from {loserName}
              </p>
            )}
          </>
        )}
        <button
          onClick={onClose}
          className="w-full px-4 py-2 text-sm font-medium text-slate-300 bg-slate-700 rounded-lg hover:bg-slate-600 transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  );
}
