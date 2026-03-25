import { useState } from 'react';

interface BlockConfirmationProps {
  isOpen: boolean;
  playerName: string;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
}

export function BlockConfirmation({
  isOpen,
  playerName,
  onConfirm,
  onCancel,
}: BlockConfirmationProps) {
  const [isBlocking, setIsBlocking] = useState(false);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    setIsBlocking(true);
    try {
      await onConfirm();
    } finally {
      setIsBlocking(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-xs mx-4 bg-slate-800 border border-slate-700 rounded-xl shadow-xl p-5 space-y-4">
        <div className="text-center space-y-2">
          <div className="text-3xl">🚫</div>
          <h3 className="text-sm font-semibold text-white">Block {playerName}?</h3>
          <p className="text-xs text-slate-400">
            You won't see their messages or responses. They won't be notified.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2 text-sm font-medium text-slate-300 bg-slate-700 rounded-lg hover:bg-slate-600 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={isBlocking}
            className="flex-1 px-4 py-2 text-sm font-medium text-white bg-rose-600 rounded-lg hover:bg-rose-500 transition-colors disabled:opacity-50"
          >
            {isBlocking ? 'Blocking...' : 'Block'}
          </button>
        </div>
      </div>
    </div>
  );
}
