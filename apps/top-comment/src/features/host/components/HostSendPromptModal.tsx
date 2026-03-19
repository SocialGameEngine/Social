import { useState } from 'react';
import { Button } from '@social/ui';
import { HostModal } from './HostModal';

interface HostSendPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSend: (question: string, description?: string) => Promise<void>;
}

const CHAR_LIMIT = 200;

export function HostSendPromptModal({ isOpen, onClose, onSend }: HostSendPromptModalProps) {
  const [question, setQuestion] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!question.trim()) {
      setError('Please enter a question');
      return;
    }

    setIsSending(true);
    try {
      await onSend(question.trim(), undefined);
      setQuestion('');
      onClose();
    } catch (err) {
      setError('Failed to send prompt');
    } finally {
      setIsSending(false);
    }
  };

  const handleClose = () => {
    if (!isSending) {
      setQuestion('');
      setError(null);
      onClose();
    }
  };

  return (
    <HostModal 
      isOpen={isOpen} 
      onClose={handleClose} 
      title="Send Quick Prompt"
      maxWidth="lg"
      disabled={isSending}
    >
      <div className="space-y-6">
        {error && (
          <div className="px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/50">
            <p className="text-sm text-red-500 font-semibold">{error}</p>
          </div>
        )}

        <div className="flex items-center gap-3">
          <span className="text-3xl">💭</span>
          <h2 className="text-2xl font-bold text-white">
            Send Quick Prompt
          </h2>
        </div>

        <p className="text-sm text-slate-400">
          Send a quick question to your room for members to respond to.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-cyan-200">
              Question *
            </label>
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="What's your favorite movie and why?"
              maxLength={CHAR_LIMIT}
              disabled={isSending}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed resize-none"
              rows={3}
            />
            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-400">
                {question.length}/{CHAR_LIMIT} characters
              </span>
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t border-slate-700">
            <Button
              variant="secondary"
              onClick={handleClose}
              disabled={isSending}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!question.trim() || isSending}
              isLoading={isSending}
              className="flex-1"
            >
              {isSending ? 'Sending...' : 'Send Prompt'}
            </Button>
          </div>
        </form>
      </div>
    </HostModal>
  );
}

export default HostSendPromptModal;
