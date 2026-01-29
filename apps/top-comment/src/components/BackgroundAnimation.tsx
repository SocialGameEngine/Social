import { useEffect, useRef } from "react";
import { clsx } from "clsx";
import { useTheme } from "../shared/providers/ThemeProvider";

interface BackgroundAnimationProps {
  show: boolean;
  className?: string;
}

export function BackgroundAnimation({ show, className }: BackgroundAnimationProps) {
  const { theme } = useTheme();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!show || !containerRef.current) return;

    const container = containerRef.current;
    const bubbles: HTMLDivElement[] = [];

    const createBubble = () => {
      const bubble = document.createElement("div");
      bubble.className = "beer-bubble";

      const size = Math.random() * 10 + 2;
      bubble.style.width = bubble.style.height = `${size}px`;
      bubble.style.left = `${Math.random() * 100}%`;

      const duration = Math.random() * 14 + 8;
      const initialDelay = Math.random() * duration * -1.5;

      bubble.style.animation = `beer-rise ${duration}s linear infinite`;
      bubble.style.animationDelay = `${initialDelay}s`;

      container.appendChild(bubble);
      bubbles.push(bubble);
    };

    for (let i = 0; i < 50; i++) createBubble();

    return () => bubbles.forEach(b => b.remove());
  }, [show]);

  if (!show) return null;

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      {/* 1. Background — forced to paint FIRST */}
      <div
        className={clsx(
          "fixed inset-0 bg-gradient-to-r",
          theme.colors.background.gradient.from,
          theme.colors.background.gradient.via,
          theme.colors.background.gradient.to,
          className
        )}
        style={{ zIndex: 1 }}
      >
        <div className={clsx(
          "absolute inset-x-0 top-0 h-32 bg-gradient-to-b to-transparent",
          theme.colors.background.foam
        )} />
      </div>

      {/* Animated blurred light — soft glows that drift */}
      <div className="bg-glow-orb" style={{ zIndex: 1 }} aria-hidden />
      <div className="bg-glow-orb bg-glow-orb-2" style={{ zIndex: 1 }} aria-hidden />

      {/* 2. Bubbles — rendered AFTER background, no chance of black flash */}
      <div
        ref={containerRef}
        className="fixed inset-0 overflow-hidden pointer-events-none"
        style={{ zIndex: 2 }}
      />

      {/* Dynamic theme-aware CSS */}
      <style>{`
        .beer-bubble {
          position: absolute;
          bottom: -100px;
          border-radius: 50%;
          background: ${theme.colors.bubble.gradient};
          border: 1px solid ${theme.colors.bubble.border};
          box-shadow: 
            ${theme.colors.bubble.shadow},
            ${theme.colors.bubble.innerShadow};
          filter: blur(0.4px);
          will-change: transform, opacity;
        }

        @keyframes beer-rise {
          0%   { transform: translateY(0) translateX(0) scale(0.3); opacity: 0; }
          10%  { opacity: 0.9; }
          90%  { transform: translateY(-110vh) translateX(40px) rotate(15deg) scale(1.2); opacity: 0.8; }
          100% { transform: translateY(-130vh) translateX(50px) rotate(20deg) scale(1.3); opacity: 0; }
        }

        .bg-glow-orb {
          position: fixed;
          width: 80vmax;
          height: 80vmax;
          left: 50%;
          top: 50%;
          margin-left: -40vmax;
          margin-top: -40vmax;
          pointer-events: none;
          border-radius: 50%;
          background: radial-gradient(
            circle at 30% 40%,
            rgba(255, 0, 255, 0.35) 0%,
            rgba(139, 92, 246, 0.18) 40%,
            transparent 65%
          );
          filter: blur(60px);
          animation: bg-glow-float 18s ease-in-out infinite;
          will-change: transform;
        }
        .bg-glow-orb-2 {
          background: radial-gradient(
            circle at 70% 60%,
            rgba(6, 182, 212, 0.3) 0%,
            rgba(255, 0, 255, 0.12) 45%,
            transparent 70%
          );
          animation-name: bg-glow-float-2;
          animation-delay: -6s;
          animation-duration: 22s;
        }
        @keyframes bg-glow-float {
          0%, 100% { transform: translate(0, 0) scale(1); }
          20% { transform: translate(12vw, -15vh) scale(1.1); }
          40% { transform: translate(-15vw, -8vh) scale(0.95); }
          60% { transform: translate(-10vw, 12vh) scale(1.05); }
          80% { transform: translate(18vw, 10vh) scale(1.02); }
        }
        @keyframes bg-glow-float-2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          25% { transform: translate(-20vw, 15vh) scale(1.08); }
          50% { transform: translate(15vw, 18vh) scale(0.92); }
          75% { transform: translate(10vw, -20vh) scale(1.12); }
        }
      `}</style>
    </div>
  );
}

export default BackgroundAnimation;
