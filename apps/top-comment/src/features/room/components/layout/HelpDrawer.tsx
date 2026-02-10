import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import type { SessionStatus } from '../../../../shared/types';

const steps = [
  {
    emoji: '🎮',
    title: 'What is Söcial?',
    description: [
      'Teams compete with short, clever, or hilarious answers',
      'Answer quirky prompts—don\'t be correct, be funny!',
      'Vote for your favorite answer, earn points, and climb the leaderboard.',
    ],
  },
  {
    emoji: '🎟️',
    title: 'Join the game',
    description: [
      'Enter the 6-character room code or use the QR code to join',
      'Pick a team name and get ready to play',
    ],
  },
  {
    emoji: '🕹️',
    title: 'Hang out in the lobby',
    description: [
      'Wait for the host to start the game',
      'See which teams have joined so far',
    ],
  },
  {
    emoji: '✏️',
    title: 'Answer the prompt',
    description: [
      'Teams are given a prompt for a funny answer',
      'Submit your answer in 120 characters or less',
      'All answers are anonymous',
      'You have 90 seconds—be quick and creative!',
    ],
  },
  {
    emoji: '🗳️',
    title: 'Vote for the best answer',
    description: [
      'Vote for your favorite (not your own)',
      'Answers are shown anonymously',
      'Voting lasts 30 seconds—cheer for the funniest!',
      'Earn points for voting! +100 per vote, +200 if you pick the winner, +300 for voting in all groups',
    ],
  },
  {
    emoji: '💰',
    title: 'Earning points',
    description: [
      'As an Answer Creator: Earn 100 points for each vote your answer receives',
      'As a Voter: Earn points for participating and accuracy',
      'Voter rewards: +100 per vote, +200 if you pick the winner, +300 for voting in all groups',
      'Group Winners: Earn +1000 bonus points for winning your group!',
      'Second Place: Earn +500 bonus points for placing second in your group!',
      '💡 Tip: Vote thoughtfully in every group to maximize your points!',
    ],
  },
  {
    emoji: '📊',
    title: 'See the results',
    description: [
      'Check the round leaderboard',
      'See points earned and votes received',
      'View your voter rewards breakdown',
      'Results appear for 12 seconds before the next round',
    ],
  },
  {
    emoji: '🔁',
    title: 'Repeat the fun',
    description: [
      'Steps 3-5 repeat for up to 15 rounds',
      'Keep laughing, strategizing, and cheering!',
    ],
  },
  {
    emoji: '🏆',
    title: 'Celebrate and share',
    description: [
      'Final leaderboard shows the champions',
      'Take or share a selfie with your score',
      'Leave the session or start a new game!',
    ],
  },
];

// Map session phases to step indices
function getStepIndexForPhase(phase: SessionStatus | null | undefined): number | null {
  if (!phase) return 1;
  
  switch (phase) {
    case "lobby":
      return 2;
    case "answer":
      return 3;
    case "vote":
      return 4;
    case "results":
      return 6;
    case "ended":
      return 8;
    default:
      return null;
  }
}

interface HelpDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  initialPhase?: SessionStatus | null;
}

export function HelpDrawer({ isOpen, onClose, initialPhase }: HelpDrawerProps) {
  const [openSteps, setOpenSteps] = useState<Set<number>>(new Set());
  const contentRef = useRef<HTMLDivElement>(null);

  const toggleStep = (index: number) => {
    setOpenSteps((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  useEffect(() => {
    if (!isOpen) {
      setOpenSteps(new Set());
    } else {
      const stepIndex = getStepIndexForPhase(initialPhase);
      if (stepIndex !== null) {
        setOpenSteps(new Set([stepIndex]));
        setTimeout(() => {
          if (contentRef.current) {
            const stepElement = contentRef.current.children[stepIndex] as HTMLElement;
            if (stepElement) {
              stepElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
          }
        }, 100);
      }
    }
  }, [isOpen, initialPhase]);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 sm:hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Drawer - slides up from bottom */}
      <div className="absolute bottom-0 left-0 right-0 max-h-[75vh] flex flex-col bg-slate-900 border-t border-slate-700/50 rounded-t-2xl shadow-2xl animate-slide-up">
        {/* Handle bar */}
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-10 h-1 rounded-full bg-slate-600" />
        </div>

        {/* Header with close */}
        <div className="flex items-center justify-between px-4 pb-2 shrink-0">
          <h2 className="text-sm font-semibold text-slate-300">How To Play</h2>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white transition-colors"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 min-h-0 overflow-y-auto px-4 pb-4" ref={contentRef}>
          <div className="space-y-3">
            {steps.map((step, index) => {
              const isStepOpen = openSteps.has(index);
              return (
                <div
                  key={step.title}
                  className="bg-slate-800/50 rounded-lg overflow-hidden"
                >
                  <button
                    type="button"
                    onClick={() => toggleStep(index)}
                    className="w-full flex items-center gap-3 p-3 text-left transition-colors hover:bg-slate-700/50"
                  >
                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border-2 border-cyan-400 bg-cyan-400/10 text-lg">
                      {step.emoji}
                    </div>
                    <h2 className="flex-1 text-sm font-bold uppercase tracking-wide text-slate-200">
                      {step.title}
                    </h2>
                    <svg
                      className={`h-4 w-4 flex-shrink-0 text-slate-400 transition-transform duration-200 ${
                        isStepOpen ? 'rotate-180' : ''
                      }`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>
                  {isStepOpen && (
                    <div className="px-3 pb-3 pl-14">
                      <ul className="list-disc space-y-1 pl-4 text-sm text-slate-300">
                        {step.description.map((item, idx) => (
                          <li key={idx}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Got it button */}
        <div className="shrink-0 border-t border-slate-700/50 p-3">
          <button
            type="button"
            className="w-full rounded-lg bg-cyan-500 hover:bg-cyan-400 px-4 py-2 text-sm font-semibold text-white transition-colors"
            onClick={onClose}
          >
            Got it
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
