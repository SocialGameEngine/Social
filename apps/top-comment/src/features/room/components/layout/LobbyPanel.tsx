import { useState, useCallback } from 'react';
import { getMascotById } from '../../../../shared/mascots';
import { ReportButton } from '../../../../shared/components/ReportButton';
import { ReportModal } from '../../../../shared/components/ReportModal';
import { BlockConfirmation } from '../../../../shared/components/BlockConfirmation';
import { ChallengeButton } from '../challenges/ChallengeButton';
import { reportService, type ReportReason } from '../../../../services/reportService';
import type { RoomMembership } from '../../../../shared/types';

interface LobbyPanelProps {
  memberships: RoomMembership[] | null;
  roomId?: string;
  myMembershipId?: string;
  blockPlayer?: (membershipId: string) => Promise<void>;
  onChallengePlayer?: (membershipId: string, playerName: string) => void;
}

export function LobbyPanel({ memberships, roomId, myMembershipId, blockPlayer, onChallengePlayer }: LobbyPanelProps) {
  const [reportTarget, setReportTarget] = useState<RoomMembership | null>(null);
  const [blockTarget, setBlockTarget] = useState<{ membershipId: string; name: string } | null>(null);

  const handleReport = useCallback(
    async (reason: ReportReason, description?: string) => {
      if (!roomId || !myMembershipId || !reportTarget) return;
      await reportService.submitReport({
        roomId,
        reporterMembershipId: myMembershipId,
        reportedMembershipId: reportTarget.id,
        contentType: 'player',
        reason,
        description,
      });
    },
    [roomId, myMembershipId, reportTarget]
  );

  const sorted = memberships
    ? [...memberships].sort((a, b) => new Date(a.joinedAt).getTime() - new Date(b.joinedAt).getTime())
    : [];

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-700/50 shrink-0">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
          {sorted.length} {sorted.length === 1 ? 'Player' : 'Players'}
        </p>
      </div>

      {/* Players list */}
      <div className="flex-1 overflow-y-auto">
        <ul className="space-y-0.5">
          {sorted.map((member) => {
            const mascot = getMascotById(member.mascotId);
            return (
              <li
                key={member.id}
                className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-800/50 transition-colors"
              >
                {/* Avatar */}
                <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0 overflow-hidden">
                  {mascot ? (
                    <img
                      src={mascot.path}
                      alt={mascot.name}
                      className="w-6 h-6 object-contain"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  ) : (
                    <span className="text-xs font-bold text-cyan-400">
                      {member.playerName?.charAt(0).toUpperCase() || '?'}
                    </span>
                  )}
                </div>

                {/* Name + role */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-200 truncate">
                    {member.playerName || 'Anonymous'}
                  </p>
                </div>

                {/* Host badge */}
                {member.isHost && (
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded">
                    Host
                  </span>
                )}

                {/* Challenge + Report buttons (not on self or host) */}
                {!member.isHost && member.id !== myMembershipId && onChallengePlayer && (
                  <ChallengeButton
                    onChallenge={() => onChallengePlayer(member.id, member.playerName || 'Anonymous')}
                    playerName={member.playerName || 'Anonymous'}
                  />
                )}
                {!member.isHost && member.id !== myMembershipId && (
                  <ReportButton onReport={() => setReportTarget(member)} />
                )}

                {/* Online indicator */}
                <div className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
              </li>
            );
          })}
        </ul>
      </div>
      <ReportModal
        isOpen={!!reportTarget}
        onClose={() => setReportTarget(null)}
        onSubmit={handleReport}
        onBlock={reportTarget && blockPlayer ? () => {
          setBlockTarget({ membershipId: reportTarget.id, name: reportTarget.playerName || 'Unknown' });
        } : undefined}
        targetName={reportTarget?.playerName}
        contentType="player"
      />
      <BlockConfirmation
        isOpen={!!blockTarget}
        playerName={blockTarget?.name || ''}
        onConfirm={async () => {
          if (blockTarget && blockPlayer) {
            await blockPlayer(blockTarget.membershipId);
          }
          setBlockTarget(null);
        }}
        onCancel={() => setBlockTarget(null)}
      />
    </div>
  );
}
