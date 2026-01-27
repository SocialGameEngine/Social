import { useState, useRef, useEffect } from "react";
import { Modal } from "@social/ui";
import { useTheme } from "../../shared/providers/ThemeProvider";
import type { SessionStatus } from "../../shared/types";

const steps = [
  {
    emoji: '🎮',
    title: 'What is Söcial?',
    description: [
      'Teams compete with short, clever, or hilarious answers',
      'Answer quirky prompts—don’t be correct, be funny!',
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


interface HowToPlayModalProps {
  open: boolean;
  onClose: () => void;
  initialPhase?: SessionStatus | null; // Optional - if not provided, defaults to "Join the game"
}

// Map session phases to step indices
function getStepIndexForPhase(phase: SessionStatus | null | undefined): number | null {
  if (!phase) return 1; // Join the game (skip the "What is SideBets?" intro step)
  
  switch (phase) {
    case "lobby":
      return 2; // Hang out in the lobby
    case "answer":
      return 3; // Answer the prompt
    case "vote":
      return 4; // Vote for the best answer
    case "results":
      return 6; // See the results (skip the earning points step)
    case "ended":
      return 8; // Celebrate and share
    default:
      return null;
  }
}

export function HowToPlayModal({ open, onClose, initialPhase }: HowToPlayModalProps) {
  const { isDark } = useTheme();
  const [openSteps, setOpenSteps] = useState<Set<number>>(new Set());
  const [showScrollIndicator, setShowScrollIndicator] = useState(true);
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
    if (!open) {
      setOpenSteps(new Set());
      setShowScrollIndicator(true);
    } else {
      // When modal opens, open the step corresponding to the phase when button was clicked
      const stepIndex = getStepIndexForPhase(initialPhase);
      if (stepIndex !== null) {
        setOpenSteps(new Set([stepIndex]));
        // Scroll to the opened step after a brief delay to ensure it's rendered
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
  }, [open, initialPhase]);

  useEffect(() => {
    const checkScroll = () => {
      if (contentRef.current) {
        const { scrollTop, scrollHeight, clientHeight } = contentRef.current;
        const isScrollable = scrollHeight > clientHeight;
        const isAtBottom = scrollTop + clientHeight >= scrollHeight - 10;
        setShowScrollIndicator(isScrollable && !isAtBottom);
      }
    };

    const container = contentRef.current;
    if (!container) return;

    container.addEventListener('scroll', checkScroll);
    checkScroll();
    return () => {
      container.removeEventListener('scroll', checkScroll);
    };
  }, [open, openSteps]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="HOW TO PLAY"
      isDark={isDark}
      footer={
        <button
          type="button"
          className="rounded-full bg-brand-primary px-5 py-2 text-sm font-semibold text-white"
          onClick={onClose}
        >
          Got it
        </button>
      }
    >
      <div className="relative">
        <div
          ref={contentRef}
          className="max-h-[60vh] overflow-y-auto pr-2 space-y-3 sm:space-y-4"
          style={{ scrollbarWidth: 'thin' }}
        >
          {steps.map((step, index) => {
            const isOpen = openSteps.has(index);
            return (
              <div
                key={step.title}
                className={`elevated-card overflow-hidden transition-all ${!isDark ? '' : 'bg-slate-700/50'}`}
              >
                <button
                  type="button"
                  onClick={() => toggleStep(index)}
                  className={`w-full flex items-center gap-3 p-4 sm:p-5 text-left transition-colors ${!isDark ? 'hover:bg-slate-100/50' : 'hover:bg-cyan-500/10'}`}
                >
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border-2 border-brand-primary bg-brand-primary/10 text-2xl sm:h-12 sm:w-12">
                    {step.emoji}
                  </div>
                  <h2 className={`flex-1 text-base font-black uppercase tracking-wide sm:text-lg ${!isDark ? 'text-slate-900' : 'text-white'}`}>
                    {step.title}
                  </h2>
                  <svg
                    className={`h-5 w-5 flex-shrink-0 text-slate-400 transition-transform duration-200 ${
                      isOpen ? 'rotate-180' : ''
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
                {isOpen && (
                  <div className="px-4 pb-4 sm:px-5 sm:pb-5 sm:pl-20">
                    <ul className={`list-disc space-y-2 pl-5 text-sm font-medium sm:text-base ${!isDark ? 'text-slate-700' : 'text-slate-300'}`}>
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
        {showScrollIndicator && (
          <div className={`absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t pointer-events-none flex items-end justify-center pb-2 ${!isDark ? 'from-white to-transparent' : 'from-slate-800 to-transparent'}`}>
            <svg
              className="h-6 w-6 text-slate-400 animate-bounce"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 14l-7 7m0 0l-7-7m7 7V3"
              />
            </svg>
          </div>
        )}
      </div>
    </Modal>
  );
}

export default HowToPlayModal;
