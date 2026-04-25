import { InteractionTypeButton } from './InteractionTypeButton';
import { SkeletonGrid } from '../../../../shared/components/SkeletonGrid';

interface SocialSectionProps {
  onOpenLeaderboard: () => void;
  onOpenChat: () => void;
  onOpenCommunity: () => void;
  onOpenBanter?: () => void;
  onOpenLeague?: () => void;
  onOpenQuestions?: () => void;
  isLoading?: boolean;
  leaderboardExpanded?: boolean;
  chatExpanded?: boolean;
  banterExpanded?: boolean;
  leagueExpanded?: boolean;
}

export function SocialSection({
  onOpenLeaderboard,
  onOpenChat,
  onOpenCommunity,
  onOpenBanter,
  onOpenLeague,
  onOpenQuestions,
  isLoading = false,
  leaderboardExpanded,
  chatExpanded,
  banterExpanded,
  leagueExpanded,
}: SocialSectionProps) {
  if (isLoading) {
    return <SkeletonGrid count={3} />;
  }

  return (
    <div className="px-4 pb-4">
      <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-3 px-1">
        Social
      </h2>
      <div className={`grid gap-3 ${(onOpenQuestions || onOpenBanter || onOpenLeague) ? 'grid-cols-4' : 'grid-cols-3'}`}>
        <InteractionTypeButton
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V13a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2zm0 0V9a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v10m-6 0a2 2 0 0 1 2 2h2a2 2 0 0 1 2-2m0 0V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2z" />
            </svg>
          }
          label="Leaderboard"
          variant="social"
          onClick={onOpenLeaderboard}
          aria-expanded={leaderboardExpanded}
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
          aria-expanded={chatExpanded}
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
        {onOpenLeague && (
          <InteractionTypeButton
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
              </svg>
            }
            label="League"
            variant="social"
            onClick={onOpenLeague}
            aria-expanded={leagueExpanded}
          />
        )}
        {onOpenBanter && (
          <InteractionTypeButton
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
              </svg>
            }
            label="Banter"
            variant="social"
            onClick={onOpenBanter}
            aria-expanded={banterExpanded}
          />
        )}
        {onOpenQuestions && (
          <InteractionTypeButton
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
            label="Questions"
            variant="social"
            onClick={onOpenQuestions}
          />
        )}
      </div>
    </div>
  );
}
