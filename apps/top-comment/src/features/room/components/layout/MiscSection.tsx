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
    <div className="px-4 pb-4">
      <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-3 px-1">
        More
      </h2>
      <div className="grid grid-cols-2 gap-3">
        <InteractionTypeButton
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3 13V6a2 2 0 00-2-2H5a2 2 0 00-2 2v13a2 2 0 002 2h14a2 2 0 002-2z" />
            </svg>
          }
          label="VIBox"
          variant="misc"
          onClick={onOpenVIBox}
        />
        <InteractionTypeButton
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.651 2.032-3 3.772-3s3.223 1.349 3.772 3c.549 1.651 2.032 3 3.772 3s3.223-1.349 3.772-3c.549-1.651 2.032-3 3.772-3zM12 9c0 .552.448 1 1 1s1-.448 1-1-.448-1-1-1-1zm0 5c0 .552.448 1 1 1s1-.448 1-1-.448-1-1-1-1z" />
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
