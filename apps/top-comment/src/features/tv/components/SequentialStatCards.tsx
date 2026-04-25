import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRoundStats } from '../hooks/useRoundStats';
import type { Sociale } from '../../../domain/types/sociale.types';

interface SequentialStatCardsProps {
  sociale: Sociale;
  isActive: boolean;
  onNext?: () => void;
  onSkip?: () => void;
  onPause?: () => void;
  onResume?: () => void;
  isPaused?: boolean;
}

interface StatCard {
  id: string;
  type: 'top_answerer' | 'fastest_answer' | 'most_upvotes' | 'perfect_round';
  title: string;
  value: string;
  subtitle: string;
  socialiteName?: string;
  socialiteAvatar?: string;
  icon: string;
  color: string;
}

export function SequentialStatCards({
  sociale,
  isActive,
  onNext,
  onSkip,
  onPause,
  onResume,
  isPaused = false,
}: SequentialStatCardsProps) {
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [stats, setStats] = useState<StatCard[]>([]);

  const roundStats = useRoundStats(isActive ? sociale.id : null);

  // Build stat cards from real stats-finalize data
  useEffect(() => {
    if (!isActive) return;

    const cards: StatCard[] = [];

    if (roundStats.topAnswerer) {
      cards.push({
        id: 'top_answerer',
        type: 'top_answerer',
        title: 'Top Answer',
        value: roundStats.topAnswerer.displayName,
        subtitle: roundStats.topAnswerer.responseTime != null
          ? `First correct in ${roundStats.topAnswerer.responseTime}s`
          : 'First to answer correctly',
        socialiteName: roundStats.topAnswerer.displayName,
        icon: '🏆',
        color: 'from-yellow-400 to-orange-500',
      });
    }

    if (roundStats.fastestAnswer) {
      cards.push({
        id: 'fastest_answer',
        type: 'fastest_answer',
        title: 'Fastest',
        value: roundStats.fastestAnswer.responseTime != null
          ? `${roundStats.fastestAnswer.responseTime}s`
          : roundStats.fastestAnswer.displayName,
        subtitle: 'Lightning quick response',
        socialiteName: roundStats.fastestAnswer.displayName,
        icon: '⚡',
        color: 'from-blue-400 to-purple-500',
      });
    }

    if (roundStats.mostUpvoted) {
      cards.push({
        id: 'most_upvotes',
        type: 'most_upvotes',
        title: 'Most Upvotes',
        value: String(roundStats.mostUpvoted.upvoteCount ?? 0),
        subtitle: 'Crowd favorite answer',
        socialiteName: roundStats.mostUpvoted.displayName,
        icon: '👍',
        color: 'from-green-400 to-teal-500',
      });
    }

    if (roundStats.perfectRound) {
      cards.push({
        id: 'perfect_round',
        type: 'perfect_round',
        title: 'Perfect Round',
        value: '100%',
        subtitle: `${roundStats.perfectRound.correctAnswers}/${roundStats.perfectRound.totalAnswers} correct`,
        socialiteName: roundStats.perfectRound.displayName,
        icon: '💯',
        color: 'from-pink-400 to-rose-500',
      });
    }

    if (cards.length > 0) {
      setCurrentCardIndex(0);
      setStats(cards);
    }
  }, [isActive, roundStats]);

  // Auto-advance logic
  useEffect(() => {
    if (!isActive || isPaused || stats.length === 0) return;

    const timers = [400, 800, 1200, 1600]; // Stagger timing in ms
    const totalDuration = timers[timers.length - 1] + 1000; // Add 1s at the end

    const timer = setTimeout(() => {
      if (currentCardIndex < stats.length - 1) {
        setCurrentCardIndex(prev => prev + 1);
      } else {
        // Auto-advance to next phase when all cards are shown
        onNext?.();
      }
    }, currentCardIndex < timers.length ? timers[currentCardIndex] : totalDuration);

    return () => clearTimeout(timer);
  }, [currentCardIndex, isActive, isPaused, stats.length, onNext]);

  const handleNext = () => {
    if (currentCardIndex < stats.length - 1) {
      setCurrentCardIndex(prev => prev + 1);
    } else {
      onNext?.();
    }
  };

  const handleSkip = () => {
    onSkip?.();
  };

  const currentCard = stats[currentCardIndex];

  if (!isActive || !currentCard) {
    return null;
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentCard.id}
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: -20 }}
          transition={{ 
            type: "spring", 
            stiffness: 300, 
            damping: 25,
            duration: 0.3
          }}
          className="relative"
        >
          {/* Card Background */}
          <div className={`
            relative bg-black/80 backdrop-blur-xl rounded-3xl p-8
            border-2 border-white/20 shadow-2xl
            min-w-[400px] max-w-[500px]
            transform-gpu
          `}>
            {/* Gradient Glow */}
            <div className={`
              absolute inset-0 rounded-3xl opacity-30
              bg-gradient-to-br ${currentCard.color}
              blur-xl
            `} />

            {/* Card Content */}
            <div className="relative z-10 text-center">
              {/* Icon */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
                className="text-6xl mb-4"
              >
                {currentCard.icon}
              </motion.div>

              {/* Title */}
              <motion.h2
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-3xl font-bold text-white mb-2"
              >
                {currentCard.title}
              </motion.h2>

              {/* Value */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
                className="text-5xl font-black text-white mb-2"
              >
                {currentCard.value}
              </motion.div>

              {/* Socialite Name */}
              {currentCard.socialiteName && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="flex items-center justify-center gap-3 mb-2"
                >
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-white/20 to-white/10 border border-white/30 flex items-center justify-center">
                    <span className="text-xl font-bold text-white">
                      {currentCard.socialiteName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <span className="text-xl font-semibold text-white/90">
                    {currentCard.socialiteName}
                  </span>
                </motion.div>
              )}

              {/* Subtitle */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="text-white/70 text-sm"
              >
                {currentCard.subtitle}
              </motion.p>

              {/* Progress Indicators */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="flex justify-center gap-2 mt-6"
              >
                {stats.map((_, index) => (
                  <div
                    key={index}
                    className={`
                      h-2 rounded-full transition-all duration-300
                      ${index === currentCardIndex
                        ? 'w-8 bg-white'
                        : index < currentCardIndex
                        ? 'w-2 bg-white/60'
                        : 'w-2 bg-white/20'
                      }
                    `}
                  />
                ))}
              </motion.div>
            </div>

            {/* Host Controls */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="flex justify-center gap-3 mt-6"
            >
              <button
                onClick={isPaused ? onResume : onPause}
                className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-colors text-sm font-medium"
              >
                {isPaused ? 'Resume' : 'Pause'}
              </button>
              
              <button
                onClick={handleNext}
                className="px-4 py-2 bg-white text-black rounded-lg hover:bg-white/90 transition-colors text-sm font-medium"
              >
                Next
              </button>
              
              <button
                onClick={handleSkip}
                className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-colors text-sm font-medium"
              >
                Skip
              </button>
            </motion.div>
          </div>

          {/* Floating particles effect */}
          <div className="absolute inset-0 pointer-events-none">
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ 
                  opacity: 0, 
                  scale: 0,
                  x: Math.random() * 400 - 200,
                  y: Math.random() * 300 - 150
                }}
                animate={{
                  opacity: [0, 1, 0],
                  scale: [0, 1, 0],
                  x: Math.random() * 400 - 200,
                  y: Math.random() * 300 - 150,
                }}
                transition={{
                  duration: 3 + Math.random() * 2,
                  repeat: Infinity,
                  delay: Math.random() * 2,
                  ease: "easeInOut"
                }}
                className={`
                  absolute w-2 h-2 rounded-full
                  bg-gradient-to-br ${currentCard.color}
                  blur-sm
                `}
              />
            ))}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
