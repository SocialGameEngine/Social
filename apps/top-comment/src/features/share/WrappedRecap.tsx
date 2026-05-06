import { useState, useRef, useEffect } from 'react';
import { StoryCard } from './StoryCard';
import type { StoryCard as StoryCardData } from '../../domain/share/generateStoryCards';

interface WrappedRecapProps {
  cards: StoryCardData[];
  playerName: string;
  onClose: () => void;
}

export function WrappedRecap({ cards, playerName, onClose }: WrappedRecapProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Minimum swipe distance (in px)
  const minSwipeDistance = 50;

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe && currentIndex < cards.length - 1) {
      setCurrentIndex(prev => prev + 1);
    }
    if (isRightSwipe && currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'ArrowRight' && currentIndex < cards.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else if (e.key === 'ArrowLeft' && currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, cards.length]);

  const goToNext = () => {
    if (currentIndex < cards.length - 1) {
      setCurrentIndex(prev => prev + 1);
    }
  };

  const goToPrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  const goToCard = (index: number) => {
    setCurrentIndex(index);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black">
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-50 w-12 h-12 flex items-center justify-center rounded-full bg-white bg-opacity-20 hover:bg-opacity-30 transition-all text-white text-2xl"
        aria-label="Close"
      >
        ×
      </button>

      {/* Progress indicators */}
      <div className="absolute top-4 left-4 right-16 z-50 flex gap-2">
        {cards.map((_, index) => (
          <button
            key={index}
            onClick={() => goToCard(index)}
            className="flex-1 h-1 rounded-full transition-all"
            style={{
              backgroundColor: index <= currentIndex 
                ? 'rgba(255, 255, 255, 0.9)' 
                : 'rgba(255, 255, 255, 0.3)',
            }}
            aria-label={`Go to card ${index + 1}`}
          />
        ))}
      </div>

      {/* Story container */}
      <div
        ref={containerRef}
        className="relative w-full h-full overflow-hidden"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Cards */}
        <div
          className="flex h-full transition-transform duration-300 ease-out"
          style={{
            transform: `translateX(-${currentIndex * 100}%)`,
            width: `${cards.length * 100}%`,
          }}
        >
          {cards.map((card, index) => (
            <div
              key={index}
              className="flex-shrink-0 w-full h-full flex items-center justify-center"
              style={{ width: `${100 / cards.length}%` }}
            >
              <div className="transform scale-[0.5] origin-center">
                <StoryCard card={card} playerName={playerName} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Navigation arrows (desktop) */}
      <div className="hidden md:block">
        {currentIndex > 0 && (
          <button
            onClick={goToPrevious}
            className="absolute left-8 top-1/2 -translate-y-1/2 w-16 h-16 flex items-center justify-center rounded-full bg-white bg-opacity-20 hover:bg-opacity-30 transition-all text-white text-4xl"
            aria-label="Previous card"
          >
            ‹
          </button>
        )}
        {currentIndex < cards.length - 1 && (
          <button
            onClick={goToNext}
            className="absolute right-8 top-1/2 -translate-y-1/2 w-16 h-16 flex items-center justify-center rounded-full bg-white bg-opacity-20 hover:bg-opacity-30 transition-all text-white text-4xl"
            aria-label="Next card"
          >
            ›
          </button>
        )}
      </div>

      {/* Card counter */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white text-2xl font-medium opacity-70">
        {currentIndex + 1} / {cards.length}
      </div>

      {/* Tap zones for mobile (invisible) */}
      <div className="md:hidden absolute inset-0 flex">
        <button
          onClick={goToPrevious}
          className="flex-1"
          disabled={currentIndex === 0}
          aria-label="Previous card"
        />
        <button
          onClick={goToNext}
          className="flex-1"
          disabled={currentIndex === cards.length - 1}
          aria-label="Next card"
        />
      </div>
    </div>
  );
}
