import { SkeletonButton } from './SkeletonButton';

interface SkeletonGridProps {
  count?: number;
}

export function SkeletonGrid({ count = 4 }: SkeletonGridProps) {
  return (
    <div className="grid grid-cols-2 gap-3 p-4">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonButton key={i} />
      ))}
    </div>
  );
}
