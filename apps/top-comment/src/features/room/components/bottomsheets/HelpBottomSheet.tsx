import { useEffect, useRef, useState } from 'react';
import type { SessionStatus } from '../../../../shared/types';
import { BottomSheet } from '../../../../shared/components/BottomSheet';

const steps = [
  {
    emoji: '🎮',
    title: 'What is Social?',
    description: [
      'Teams compete with short, clever, or hilarious answers.',
      'Answer quirky prompts. Be funny, not just correct.',
      'Vote for your favorite answer, earn points, and climb the leaderboard.',
    ],
  },
  {
    emoji: '🎟️',
    title: 'Join the game',
    description: [
      'Enter the 6-character room code or use the QR code to join.',
      'Pick a team name and get ready to play.',
    ],
  },
  {
    emoji: '🕹️',
    title: 'Hang out in the lobby',
    description: [
      'Wait for the host to start the game.',
      'See which teams have joined so far.',
    ],
  },
  {
    emoji: '✏️',
    title: 'Answer the prompt',
    description: [
      'Teams get a prompt and submit a short answer.',
      'All answers are anonymous.',
      'You have limited time, so be quick and creative.',
    ],
  },
  {
    emoji: '🗳️',
    title: 'Vote for the best answer',
    description: [
      'Vote for your favorite response (not your own).',
      'Earn points by participating and picking winners.',
    ],
  },
  {
    emoji: '📊',
    title: 'See results',
    description: [
      'Review leaderboard movement and round outcomes.',
      'Then continue to the next round.',
    ],
  },
  {
    emoji: '🏆',
    title: 'Celebrate and share',
    description: [
      'Final leaderboard crowns winners.',
      'Take/share your selfie and start a new game.',
    ],
  },
];

function getStepIndexForPhase(phase: SessionStatus | null | undefined): number | null {
  if (!phase) return 1;
  switch (phase) {
    case 'lobby':
      return 2;
    case 'answer':
      return 3;
    case 'vote':
      return 4;
    case 'results':
      return 5;
    case 'ended':
      return 6;
    default:
      return null;
  }
}

interface HelpBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  initialPhase?: SessionStatus | null;
}

export function HelpBottomSheet({ isOpen, onClose, initialPhase }: HelpBottomSheetProps) {
  const [openSteps, setOpenSteps] = useState<Set<number>>(new Set());
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) {
      setOpenSteps(new Set());
      return;
    }
    const stepIndex = getStepIndexForPhase(initialPhase);
    if (stepIndex === null) return;

    setOpenSteps(new Set([stepIndex]));
    const timer = setTimeout(() => {
      if (!contentRef.current) return;
      const stepElement = contentRef.current.children[stepIndex] as HTMLElement | undefined;
      stepElement?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 100);
    return () => clearTimeout(timer);
  }, [isOpen, initialPhase]);

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

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title="How To Play"
      accent="neutral"
      eyebrow="Quick guide"
    >
      <div className="flex min-h-0 flex-1 flex-col">
        <div ref={contentRef} className="min-h-0 flex-1 overflow-y-auto px-4 pb-4">
          <div className="space-y-3 pt-2">
            {steps.map((step, index) => {
              const isStepOpen = openSteps.has(index);
              return (
                <div key={step.title} className="overflow-hidden rounded-lg bg-slate-800/50">
                  <button
                    type="button"
                    onClick={() => toggleStep(index)}
                    className="flex w-full items-center gap-3 p-3 text-left transition-colors hover:bg-slate-700/50"
                  >
                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border-2 border-cyan-400 bg-cyan-400/10 text-lg">
                      {step.emoji}
                    </div>
                    <h3 className="flex-1 text-sm font-bold uppercase tracking-wide text-slate-200">
                      {step.title}
                    </h3>
                    <svg
                      className={`h-4 w-4 flex-shrink-0 text-slate-400 transition-transform duration-200 ${isStepOpen ? 'rotate-180' : ''}`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {isStepOpen && (
                    <div className="px-3 pb-3 pl-14">
                      <ul className="list-disc space-y-1 pl-4 text-sm text-slate-300">
                        {step.description.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </BottomSheet>
  );
}
