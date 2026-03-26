import { useState, useCallback } from 'react';
import { useReports } from '../../../../hooks/useReports';
import { chatModerationService } from '../../../../services/chatModerationService';
import { roomMembershipService } from '../../../../services/roomMembershipService';
import type { Report, ReportAction } from '../../../../services/reportService';
import type { RoomMembership } from '../../../../shared/types';

interface ModerationPanelProps {
  roomId: string | undefined;
  isMod: boolean;
  modMembershipId: string | undefined;
  memberships: RoomMembership[] | null;
}

const ACTION_LABELS: Record<ReportAction, string> = {
  none: 'No Action',
  warned: 'Warn',
  muted: 'Mute',
  kicked: 'Kick',
  banned: 'Ban',
};

const ACTION_COLORS: Record<ReportAction, string> = {
  none: 'bg-slate-600 hover:bg-slate-500 text-slate-200',
  warned: 'bg-amber-600 hover:bg-amber-500 text-white',
  muted: 'bg-orange-600 hover:bg-orange-500 text-white',
  kicked: 'bg-rose-600 hover:bg-rose-500 text-white',
  banned: 'bg-red-700 hover:bg-red-600 text-white',
};

function getMemberName(memberships: RoomMembership[] | null, membershipId: string | null): string {
  if (!membershipId || !memberships) return 'Unknown';
  const member = memberships.find((m) => m.id === membershipId);
  return member?.playerName || 'Unknown';
}

function ReportCard({
  report,
  memberships,
  onAction,
  onDismiss,
}: {
  report: Report;
  memberships: RoomMembership[] | null;
  onAction: (reportId: string, action: ReportAction) => void;
  onDismiss: (reportId: string) => void;
}) {
  const [showActions, setShowActions] = useState(false);
  const isPending = report.status === 'pending';

  return (
    <div className="bg-slate-800/80 border border-slate-700/50 rounded-lg p-3 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-medium text-rose-400 bg-rose-500/10 px-1.5 py-0.5 rounded">
              {report.reason}
            </span>
            <span className="text-xs text-slate-500">
              {report.contentType}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            <span className="text-slate-300">{getMemberName(memberships, report.reporterMembershipId)}</span>
            {' reported '}
            <span className="text-slate-300">{getMemberName(memberships, report.reportedMembershipId)}</span>
          </p>
          {report.description && (
            <p className="text-xs text-slate-500 mt-1 italic">"{report.description}"</p>
          )}
        </div>
        <span className="text-[10px] text-slate-600 shrink-0">
          {new Date(report.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>

      {isPending ? (
        <div className="space-y-1.5">
          {showActions ? (
            <div className="flex flex-wrap gap-1">
              {(['none', 'warned', 'muted', 'kicked', 'banned'] as ReportAction[]).map((action) => (
                <button
                  key={action}
                  onClick={() => onAction(report.id, action)}
                  className={`px-2 py-1 text-[10px] font-medium rounded transition-colors ${ACTION_COLORS[action]}`}
                >
                  {ACTION_LABELS[action]}
                </button>
              ))}
            </div>
          ) : (
            <div className="flex gap-1.5">
              <button
                onClick={() => setShowActions(true)}
                className="flex-1 px-2 py-1 text-[10px] font-medium text-cyan-400 bg-cyan-500/10 rounded hover:bg-cyan-500/20 transition-colors"
              >
                Take Action
              </button>
              <button
                onClick={() => onDismiss(report.id)}
                className="px-2 py-1 text-[10px] font-medium text-slate-400 bg-slate-700 rounded hover:bg-slate-600 transition-colors"
              >
                Dismiss
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="flex items-center gap-1.5">
          <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
            report.status === 'dismissed'
              ? 'text-slate-400 bg-slate-700'
              : 'text-emerald-400 bg-emerald-500/10'
          }`}>
            {report.status === 'dismissed' ? 'Dismissed' : `Action: ${report.actionTaken || 'none'}`}
          </span>
        </div>
      )}
    </div>
  );
}

export function ModerationPanel({ roomId, isMod, modMembershipId, memberships }: ModerationPanelProps) {
  const { reports, pendingCount, isLoading, reviewReport, dismissReport } = useReports({
    roomId,
  });

  const [mutingMemberId, setMutingMemberId] = useState<string | null>(null);
  const [muteMenuFor, setMuteMenuFor] = useState<string | null>(null);

  const handleAction = useCallback(
    async (reportId: string, action: ReportAction) => {
      if (!modMembershipId || !roomId) return;

      const report = reports.find((r) => r.id === reportId);
      await reviewReport(reportId, action, modMembershipId);

      if (report?.reportedMembershipId) {
        const reported = memberships?.find((m) => m.id === report.reportedMembershipId);
        if (reported) {
          try {
            if (action === 'kicked') {
              await roomMembershipService.kickMember({ roomId, userId: reported.userId });
            } else if (action === 'banned') {
              await roomMembershipService.banMember({ roomId, userId: reported.userId });
            } else if (action === 'muted') {
              await chatModerationService.muteMember(roomId, report.reportedMembershipId, modMembershipId);
            }
          } catch (err) {
            console.error('Failed to execute moderation action:', err);
          }
        }
      }
    },
    [modMembershipId, roomId, reports, memberships, reviewReport]
  );

  const handleDismiss = useCallback(
    async (reportId: string) => {
      if (!modMembershipId) return;
      await dismissReport(reportId, modMembershipId);
    },
    [modMembershipId, dismissReport]
  );

  const handleMute = useCallback(
    async (membershipId: string, durationMinutes: number | null) => {
      if (!roomId || !modMembershipId) return;
      setMutingMemberId(membershipId);
      try {
        const expiresAt = durationMinutes
          ? new Date(Date.now() + durationMinutes * 60_000).toISOString()
          : undefined;
        await chatModerationService.muteMember(roomId, membershipId, modMembershipId, expiresAt);
      } catch (err) {
        console.error('Failed to mute member:', err);
      } finally {
        setMutingMemberId(null);
        setMuteMenuFor(null);
      }
    },
    [roomId, modMembershipId]
  );

  const handleUnmute = useCallback(
    async (membershipId: string) => {
      if (!roomId) return;
      try {
        await chatModerationService.unmuteMember(roomId, membershipId);
      } catch (err) {
        console.error('Failed to unmute member:', err);
      }
    },
    [roomId]
  );

  if (!isMod) return null;

  const allMembers = memberships || [];

  return (
    <div className="flex flex-col h-full">
      {/* Reports Section */}
      <div className="px-3 py-2 border-b border-slate-700/50 shrink-0">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
          Reports {pendingCount > 0 && (
            <span className="ml-1 text-rose-400 bg-rose-500/15 px-1.5 py-0.5 rounded-full">
              {pendingCount}
            </span>
          )}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2 min-h-0">
        {isLoading ? (
          <p className="text-xs text-slate-500 text-center py-4">Loading reports...</p>
        ) : reports.length === 0 ? (
          <p className="text-xs text-slate-500 text-center py-4">No reports yet</p>
        ) : (
          reports.map((report) => (
            <ReportCard
              key={report.id}
              report={report}
              memberships={memberships}
              onAction={handleAction}
              onDismiss={handleDismiss}
            />
          ))
        )}
      </div>

      {/* Player Management Section */}
      <div className="border-t border-slate-700/50 shrink-0">
        <div className="px-3 py-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Players</p>
        </div>
        <div className="max-h-40 overflow-y-auto px-3 pb-2 space-y-1">
          {allMembers.map((member) => (
            <div key={member.id} className="flex items-center justify-between gap-2 py-1.5 px-2 rounded bg-slate-800/50">
              <span className="text-xs text-slate-300 truncate flex-1">{member.playerName || 'Anonymous'}</span>
              <div className="flex gap-1 shrink-0">
                {muteMenuFor === member.id ? (
                  <div className="flex gap-0.5">
                    {[5, 15, 30, null].map((mins) => (
                      <button
                        key={mins ?? 'perm'}
                        onClick={() => handleMute(member.id, mins)}
                        disabled={mutingMemberId === member.id}
                        className="px-1.5 py-0.5 text-[9px] font-medium text-orange-300 bg-orange-500/10 rounded hover:bg-orange-500/20 transition-colors"
                      >
                        {mins ? `${mins}m` : '∞'}
                      </button>
                    ))}
                    <button
                      onClick={() => setMuteMenuFor(null)}
                      className="px-1 py-0.5 text-[9px] text-slate-500 hover:text-slate-300"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <>
                    <button
                      onClick={() => setMuteMenuFor(member.id)}
                      className="px-1.5 py-0.5 text-[9px] font-medium text-orange-400 bg-orange-500/10 rounded hover:bg-orange-500/20 transition-colors"
                      title="Mute"
                    >
                      🔇
                    </button>
                    <button
                      onClick={() => handleUnmute(member.id)}
                      className="px-1.5 py-0.5 text-[9px] font-medium text-emerald-400 bg-emerald-500/10 rounded hover:bg-emerald-500/20 transition-colors"
                      title="Unmute"
                    >
                      🔊
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
