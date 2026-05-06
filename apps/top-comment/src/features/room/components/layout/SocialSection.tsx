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

function SocialPill({
  label,
  onClick,
  expanded,
}: {
  label: string;
  onClick: () => void;
  expanded?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-expanded={expanded}
      className={`flex-shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition-colors whitespace-nowrap ${
        expanded
          ? 'bg-white text-slate-900 shadow-md'
          : 'bg-white/10 text-white hover:bg-white/20 active:scale-95'
      }`}
    >
      {label}
    </button>
  );
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
    <div className="pb-4">
      <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 px-5">
        Social
      </h2>
      <div className="flex gap-2 overflow-x-auto scrollbar-hide px-4">
        <SocialPill
          label="Leaderboard"
          expanded={leaderboardExpanded}
          onClick={onOpenLeaderboard}
        />
        <SocialPill
          label="Chat"
          expanded={chatExpanded}
          onClick={onOpenChat}
        />
        <SocialPill
          label="Wall"
          onClick={onOpenCommunity}
        />
        {onOpenLeague && (
          <SocialPill
            label="League"
            expanded={leagueExpanded}
            onClick={onOpenLeague}
          />
        )}
        {onOpenBanter && (
          <SocialPill
            label="Banter"
            expanded={banterExpanded}
            onClick={onOpenBanter}
          />
        )}
        {onOpenQuestions && (
          <SocialPill
            label="Q&A"
            onClick={onOpenQuestions}
          />
        )}
      </div>
    </div>
  );
}
