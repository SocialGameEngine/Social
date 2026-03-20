import { useReducedMotion } from '../hooks/useReducedMotion';

export function SkeletonButton() {
  const shouldReduceMotion = useReducedMotion();
  
  return (
    <div className={`section-button bg-slate-800 ${shouldReduceMotion ? '' : 'animate-pulse'}`}>
      <div className="h-4 w-16 bg-slate-700 rounded" />
    </div>
  );
}
