import { memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Leaderboard, type LeaderboardTeam } from '@social/ui';

interface DualLeaderboardProps {
  tonightEntries: LeaderboardTeam[];
  allTimeEntries: LeaderboardTeam[];
  currentSocialiteId?: string;
  currentMembershipId?: string;
  isDark?: boolean;
}

const MAX_VISIBLE_ROWS = 10;

export const DualLeaderboard = memo(function DualLeaderboard({
  tonightEntries,
  allTimeEntries,
  currentSocialiteId,
  currentMembershipId,
  isDark = true,
}: DualLeaderboardProps) {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
      <LeaderboardColumn
        title="Tonight"
        entries={tonightEntries}
        currentEntryId={currentSocialiteId}
        emptyMessage="No scores yet -- round in progress."
        isDark={isDark}
      />
      <LeaderboardColumn
        title="All-time"
        entries={allTimeEntries}
        currentEntryId={currentMembershipId}
        emptyMessage="No saved history yet at this venue."
        isDark={isDark}
      />
    </div>
  );
});

interface LeaderboardColumnProps {
  title: string;
  entries: LeaderboardTeam[];
  currentEntryId?: string;
  emptyMessage: string;
  isDark: boolean;
}

function LeaderboardColumn({
  title,
  entries,
  currentEntryId,
  emptyMessage,
  isDark,
}: LeaderboardColumnProps) {
  const topEntries = entries.slice(0, MAX_VISIBLE_ROWS);
  const youEntry = currentEntryId
    ? entries.find((e) => e.id === currentEntryId)
    : undefined;
  const youIsInTop = !!youEntry && topEntries.some((e) => e.id === youEntry.id);
  const showYouRow = !!youEntry && !youIsInTop;

  return (
    <section
      className={`flex flex-col gap-4 rounded-3xl p-5 md:p-6 ${
        !isDark
          ? 'bg-white/90 shadow-lg shadow-slate-300/40 ring-1 ring-slate-200'
          : 'bg-slate-900/60 shadow-lg shadow-cyan-500/10 ring-1 ring-cyan-400/20'
      }`}
    >
      <header className="flex items-baseline justify-between">
        <h3
          className={`text-xs font-bold uppercase tracking-[0.4em] md:text-sm ${
            !isDark ? 'text-slate-600' : 'text-cyan-300'
          }`}
        >
          {title}
        </h3>
        <span className={`text-xs ${!isDark ? 'text-slate-400' : 'text-cyan-200/70'}`}>
          Top {Math.min(entries.length, MAX_VISIBLE_ROWS)}
        </span>
      </header>

      <div className="relative">
        <AnimatePresence initial={false} mode="popLayout">
          {topEntries.length > 0 ? (
            <motion.div key="list" layout>
              <Leaderboard
                leaderboard={topEntries}
                variant="presenter"
                highlightTeamId={currentEntryId}
                isDark={isDark}
                className="grid gap-3 text-lg font-semibold"
              />
            </motion.div>
          ) : (
            <motion.p
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className={`py-6 text-center text-sm ${
                !isDark ? 'text-slate-500' : 'text-slate-400'
              }`}
            >
              {emptyMessage}
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      {showYouRow && youEntry && (
        <>
          <div
            className={`h-px w-full ${!isDark ? 'bg-slate-200' : 'bg-cyan-400/20'}`}
            aria-hidden
          />
          <div
            className={`flex items-center gap-3 rounded-2xl px-4 py-3 ring-2 ${
              !isDark
                ? 'bg-pink-50 ring-pink-300 text-pink-700'
                : 'bg-pink-500/15 ring-pink-400/60 text-pink-100'
            }`}
          >
            <span className="text-xs font-bold uppercase tracking-[0.3em]">You</span>
            <span className={`text-base font-semibold ${!isDark ? 'text-slate-900' : 'text-white'}`}>
              #{youEntry.rank} &middot; {youEntry.teamName}
            </span>
            <span className={`ml-auto font-black ${!isDark ? 'text-pink-600' : 'text-pink-300'}`}>
              {youEntry.score.toLocaleString()} pts
            </span>
          </div>
        </>
      )}
    </section>
  );
}

export default DualLeaderboard;
