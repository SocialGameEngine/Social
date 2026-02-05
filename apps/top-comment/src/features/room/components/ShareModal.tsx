import { Button } from '@social/ui';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomCode?: string;
  score?: number;
  rank?: number;
}

export function ShareModal({ isOpen, onClose, roomCode, score, rank }: ShareModalProps) {
  if (!isOpen) return null;

  const shareText = `I just played VIBox! ${rank ? `Rank #${rank}` : ''} ${score ? `with ${score} points` : ''} 🎉 Join room ${roomCode || 'now'}!`;

  const handleShareTwitter = () => {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`;
    window.open(url, '_blank');
  };

  const handleShareCopy = () => {
    navigator.clipboard.writeText(shareText);
    // Could add toast here
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full h-full sm:h-auto sm:max-w-md sm:mx-4 sm:rounded-2xl rounded-none mx-0 bg-slate-900 shadow-2xl overflow-hidden border-0 sm:border border-slate-700">
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-pink-400">Share Your Results!</h2>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <p className="text-slate-300">Let everyone know how you did!</p>

          <div className="p-4 bg-slate-800 rounded-lg">
            <p className="text-sm text-slate-400 mb-2">Preview:</p>
            <p className="text-white">{shareText}</p>
          </div>

          <div className="space-y-2">
            <Button onClick={handleShareTwitter} fullWidth className="bg-[#1DA1F2] hover:bg-[#1a91da]">
              Share on X / Twitter
            </Button>
            <Button variant="secondary" onClick={handleShareCopy} fullWidth>
              Copy to Clipboard
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ShareModal;
