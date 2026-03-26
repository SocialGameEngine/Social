import type { ReactNode } from 'react';
import { useState, useEffect } from 'react';

interface InteractionTypeButtonProps {
  icon: ReactNode;
  label: string;
  count?: number;
  variant: 'interaction' | 'social' | 'misc' | 'session';
  onClick: () => void;
  isLive?: boolean;
  participantCount?: number;
}

export function InteractionTypeButton({
  icon,
  label,
  count,
  variant,
  onClick,
  isLive,
  participantCount,
}: InteractionTypeButtonProps) {
  const variantClass = `section-button--${variant}`;
  const [animateClass, setAnimateClass] = useState('');
  const [isPressed, setIsPressed] = useState(false);

  // Force animation restart when participantCount changes
  useEffect(() => {
    if (isPressed) return; // Don't animate while pressed
    
    setAnimateClass('');
    
    // Start animation
    setTimeout(() => {
      setAnimateClass('animate-[card-activity_0.6s_ease-out]');
    }, 50);
  }, [participantCount, isPressed]);

  const handleMouseDown = () => {
    setIsPressed(true);
    setAnimateClass(''); // Stop animation during press
  };

  const handleMouseUp = () => {
    setIsPressed(false);
    // Restart animation when released
    setTimeout(() => {
      setAnimateClass('animate-[card-activity_0.6s_ease-out]');
    }, 50);
  };

  return (
    <button
      onClick={onClick}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp} // Reset if mouse leaves
      className={`section-button ${variantClass} relative ${animateClass}`}
    >
      {/* Live indicator */}
      {isLive && (
        <div className="absolute top-2 right-2">
          <div className="flex items-center gap-1 bg-red-500 text-white px-2 py-1 rounded-full text-xs font-medium">
            <div className="w-2 h-2 bg-white rounded-full" />
            LIVE
          </div>
        </div>
      )}
      
      {/* Participant count */}
      {participantCount && participantCount > 0 && !isLive && (
        <div className="absolute top-2 right-2 bg-slate-800/90 text-white px-2 py-1 rounded-full text-xs font-medium backdrop-blur-sm">
          {participantCount}
        </div>
      )}
      
      <div className="section-button__icon flex items-center justify-center text-white">
        {icon}
      </div>
      <div className="section-button__label">{label}</div>
      {count !== undefined && count > 0 && (
        <div className="section-button__count">{count}</div>
      )}
    </button>
  );
}
