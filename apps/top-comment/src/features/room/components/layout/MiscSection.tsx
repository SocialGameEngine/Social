import { InteractionTypeButton } from './InteractionTypeButton';
import { SkeletonGrid } from '../../../../shared/components/SkeletonGrid';

interface MiscSectionProps {
  onOpenVIBox: () => void;
  onOpenHelp: () => void;
  isLoading?: boolean;
}

export function MiscSection({
  onOpenVIBox,
  onOpenHelp,
  isLoading = false,
}: MiscSectionProps) {
  if (isLoading) {
    return <SkeletonGrid count={2} />;
  }

  return (
    <div className="misc-section px-4 pb-4">
      <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-3 px-1">
        More
      </h2>
      <div className="grid grid-cols-3 gap-3">
        <InteractionTypeButton
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
            </svg>
          }
          label="VIBox"
          variant="misc"
          onClick={onOpenVIBox}
        />
        <InteractionTypeButton
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          }
          label="Help"
          variant="misc"
          onClick={onOpenHelp}
        />
      </div>
    </div>
  );
}
