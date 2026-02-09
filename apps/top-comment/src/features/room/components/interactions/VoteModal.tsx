import { useState, useEffect } from "react";
import type { InteractionResponse, InteractionVote } from "../../../../shared/types";
import { useAuth } from "../../../../shared/providers/AuthContext";
import { Button } from "../../../../components/Button";

interface VoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  interaction: {
    id: string;
    question: string;
    votingEndsAt?: string | null;
    votingSeconds?: number;
  };
  responses: InteractionResponse[];
  myVote?: InteractionVote | null;
  onSubmitVote: (responseId: string) => void;
}

export function VoteModal({
  isOpen,
  onClose,
  interaction,
  responses,
  myVote,
  onSubmitVote,
}: VoteModalProps) {
  const { user } = useAuth();
  const [selectedResponse, setSelectedResponse] = useState<string>("");
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Timer countdown
  useEffect(() => {
    if (!isOpen || !interaction.votingEndsAt) return;

    const calculateTimeRemaining = () => {
      const now = new Date().getTime();
      const endTime = new Date(interaction.votingEndsAt!).getTime();
      const remaining = Math.max(0, Math.floor((endTime - now) / 1000));
      setTimeRemaining(remaining);
      return remaining > 0;
    };

    // Initial calculation
    const hasTime = calculateTimeRemaining();
    if (!hasTime) return;

    // Set up interval
    const interval = setInterval(calculateTimeRemaining, 1000);

    return () => clearInterval(interval);
  }, [isOpen, interaction.votingEndsAt]);

  
  // Set initial selected response based on existing vote
  useEffect(() => {
    if (myVote) {
      setSelectedResponse(myVote.responseId);
    } else {
      setSelectedResponse("");
    }
  }, [myVote]);

  if (!isOpen) return null;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleSubmit = async () => {
    if (!selectedResponse || !user) return;

    setIsSubmitting(true);
    try {
      await onSubmitVote(selectedResponse);
      onClose();
    } catch (error) {
      console.error("Failed to submit vote:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const hasVoted = !!myVote;
  const isExpired = timeRemaining === 0;

  return (
    <div className="fixed inset-0 z-50 flex sm:items-center sm:justify-center sm:p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="relative w-full h-full sm:h-auto sm:max-h-[90vh] sm:max-w-2xl overflow-y-auto shadow-2xl bg-slate-900">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between p-4 border-b border-slate-700/50 bg-slate-900">
          <h2 className="text-lg font-bold text-white">Vote for Response</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 transition-colors"
            aria-label="Close"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="space-y-6 p-3 sm:space-y-8 sm:p-5">
          {/* Question */}
          <div className="chaos-interaction-card px-3 py-3 text-center sm:px-4 sm:py-4 shadow-xl border-2 border-black/80">
            <p className="text-xl font-black tracking-tight drop-shadow-lg sm:text-2xl text-black">
              {interaction.question}
            </p>
            {!isExpired ? (
              <p className="text-sm font-medium text-black/60 mt-2">
                Time remaining: {formatTime(timeRemaining)}
              </p>
            ) : (
              <p className="text-sm font-medium text-black/60 mt-2">
                Voting period has ended
              </p>
            )}
          </div>

          {/* Responses */}
          <div className="space-y-3">
            {responses.map((response) => (
              <button
                key={response.id}
                onClick={() => setSelectedResponse(response.id)}
                disabled={isExpired}
                className={`w-full text-left p-4 rounded-2xl border-2 transition-all ${
                  selectedResponse === response.id
                    ? "border-cyan-500 bg-cyan-500/10"
                    : "border-slate-600/50 bg-slate-800/50 hover:border-slate-500"
                } ${
                  isExpired
                    ? "cursor-not-allowed opacity-60"
                    : "cursor-pointer hover:scale-[1.02]"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <p className="text-white font-medium">{response.text}</p>
                    <p className="text-sm text-slate-400 mt-1">
                      — {response.playerName || "Anonymous"}
                    </p>
                  </div>
                  {selectedResponse === response.id && (
                    <div className="w-6 h-6 rounded-full bg-cyan-500 flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>

          {/* Submit Button */}
          <Button
            onClick={handleSubmit}
            disabled={!selectedResponse || isSubmitting}
            isLoading={isSubmitting}
            fullWidth
            size="sm"
            className="chaos-cta-button font-black text-xs sm:text-sm"
          >
            {isSubmitting ? "Submitting..." : hasVoted ? "Change Vote" : "Submit Vote"}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default VoteModal;
