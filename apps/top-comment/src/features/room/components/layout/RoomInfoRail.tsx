import { DrinkTank } from '../../../../components/DrinkTank';
import type { Room, RoomMembership } from '../../../../shared/types';

interface RoomInfoRailProps {
  memberships: RoomMembership[] | null;
  room: Room | null;
  isCollapsed: boolean;
  onToggle: () => void;
}

export function RoomInfoRail({
  memberships,
  room,
  isCollapsed,
  onToggle,
}: RoomInfoRailProps) {
  return (
    <aside
      className={`hidden sm:flex flex-col border-l border-slate-700/50 bg-slate-900/50 transition-all duration-300 ${
        isCollapsed ? 'w-12' : 'w-72'
      }`}
    >
      {/* Collapse toggle */}
      <button
        onClick={onToggle}
        className="flex items-center justify-center p-3 text-slate-400 hover:text-white transition-colors border-b border-slate-700/50"
        aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        <svg
          className={`w-5 h-5 transition-transform ${isCollapsed ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      {!isCollapsed && (
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Player Roster via DrinkTank */}
          <section>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-3">
              Players ({memberships?.length ?? 0})
            </h3>
            <DrinkTank roomMemberships={memberships || []} />
          </section>

          {/* Room Info */}
          {room && (
            <section>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2">
                Room Info
              </h3>
              <div className="space-y-1 text-sm text-slate-300">
                <p>Code: <span className="font-mono text-cyan-400">{room.code}</span></p>
                {room.name && <p>Name: {room.name}</p>}
              </div>
            </section>
          )}
        </div>
      )}
    </aside>
  );
}
