import { InteractionTypeButton } from './InteractionTypeButton';
import { SkeletonGrid } from '../../../../shared/components/SkeletonGrid';

interface SocialSectionProps {
  onOpenLeaderboard: () => void;
  onOpenChat: () => void;
  onOpenCommunity: () => void;
  isLoading?: boolean;
}

export function SocialSection({
  onOpenLeaderboard,
  onOpenChat,
  onOpenCommunity,
  isLoading = false,
}: SocialSectionProps) {
  if (isLoading) {
    return <SkeletonGrid count={3} />;
  }

  return (
    <div className="px-4 pb-4">
      <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-3 px-1">
        Social
      </h2>
      <div className="grid grid-cols-3 gap-3">
        <InteractionTypeButton
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V13a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2zm0 0V9a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v10m-6 0a2 2 0 0 1 2 2h2a2 2 0 0 1 2-2m0 0V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2z" />
            </svg>
          }
          label="Leaderboard"
          variant="social"
          onClick={onOpenLeaderboard}
        />
        <InteractionTypeButton
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          }
          label="Chat"
          variant="social"
          onClick={onOpenChat}
        />
        <InteractionTypeButton
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          }
          label="Wall"
          variant="social"
          onClick={onOpenCommunity}
        />
      </div>
    </div>
  );
}
