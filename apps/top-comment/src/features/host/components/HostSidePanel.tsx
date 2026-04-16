import { Button } from "@social/ui";
import { QRCodeBlock } from "../../../components/QRCodeBlock";
import { SubmissionReviewPanel } from "../../room/components/submissions/SubmissionReviewPanel";
import type { Session, Room, RoomMembership } from "../../../shared/types";
import type { AudienceSubmission } from "../../../services/audienceSubmissionService";

interface HostSidePanelProps {
  inviteLink: string;
  roomJoinCode: string;
  isDark: boolean;
  storedRoomId: string | null;
  session: Session | null;
  room: Room | null | undefined;
  roomLobbyMembers: RoomMembership[];
  isRoomMembersOpen: boolean;
  setIsRoomMembersOpen: (open: boolean) => void;
  kickingPlayerId: string | null;
  banningPlayerId: string | null;
  onKickPlayer: (memberId: string, userId: string, roomId: string) => void;
  onBanPlayer: (memberId: string, userId: string, roomId: string) => void;
  onShowBannedPlayers: () => void;
  onCopyLink: (link: string) => void;
  allSubmissions: AudienceSubmission[];
  pendingSubmissionCount: number;
  onApproveSubmission: (id: string) => Promise<AudienceSubmission | undefined>;
  onRejectSubmission: (id: string, reason?: string) => Promise<AudienceSubmission | undefined>;
}

export function HostSidePanel({
  inviteLink,
  roomJoinCode,
  isDark,
  storedRoomId,
  session,
  room,
  roomLobbyMembers,
  isRoomMembersOpen,
  setIsRoomMembersOpen,
  kickingPlayerId,
  banningPlayerId,
  onKickPlayer,
  onBanPlayer,
  onShowBannedPlayers,
  onCopyLink,
  allSubmissions,
  pendingSubmissionCount,
  onApproveSubmission,
  onRejectSubmission,
}: HostSidePanelProps) {
  return (
    <aside className="flex flex-col gap-6">
      {inviteLink ? (
        <div className="space-y-4">
          <QRCodeBlock value={inviteLink} caption="Scan to join!" isDark={isDark} />
          <button
            type="button"
            onClick={() => onCopyLink(inviteLink)}
            className={`flex flex-col rounded-2xl border p-4 text-left shadow-sm transition hover:shadow-md ${!isDark ? 'border-slate-200 bg-white hover:border-brand-primary text-slate-900' : 'border-cyan-400/50 bg-slate-800 hover:border-cyan-400 text-white'}`}
          >
            <span className={`text-xs font-semibold uppercase tracking-wide ${!isDark ? 'text-slate-500' : 'text-cyan-300'}`}>
              Shareable link
            </span>
            <span className={`mt-1 break-all font-medium ${!isDark ? 'text-brand-primary' : 'text-cyan-400'}`}>
              {inviteLink || roomJoinCode}
            </span>
          </button>
        </div>
      ) : (
        <div className="rounded-3xl p-6 text-center text-sm shadow-lg bg-slate-800 text-cyan-300 shadow-fuchsia-500/20">
          Create a room to generate a QR code for your guests.
        </div>
      )}
      
      {/* Room Members List */}
      {storedRoomId ? (
        <div className={`space-y-4 rounded-3xl p-5 shadow-lg border-[3px] ${!isDark ? 'bg-white shadow-slate-300/40 border-slate-200' : 'bg-slate-800 shadow-fuchsia-500/20 border-slate-600'}`}>
          <div className="flex items-center justify-between">
            <button
              onClick={() => setIsRoomMembersOpen(!isRoomMembersOpen)}
              className="flex items-center gap-2 text-left"
            >
              <h3 className="text-lg font-semibold text-pink-400">
                Room Members ({roomLobbyMembers.length})
              </h3>
              <svg 
                className={`w-4 h-4 text-pink-400 transition-transform duration-200 ${isRoomMembersOpen ? 'rotate-180' : ''}`}
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                onClick={onShowBannedPlayers}
                className="text-xs text-purple-600"
              >
                View Banned
              </Button>
              <span className={`text-xs ${!isDark ? 'text-slate-500' : 'text-cyan-300'}`}>
                Max {session?.settings.maxTeams ?? 24}
              </span>
            </div>
          </div>
          
          {/* Dropdown content */}
          {isRoomMembersOpen && (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {roomLobbyMembers.slice(0, 10).map((member) => {
                const isMemberHost = room?.moderatorIds.includes(member.userId) || false;
                return (
                  <div
                    key={member.id}
                    className="flex items-center justify-between rounded-2xl px-4 py-3 bg-slate-700"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-cyan-100">
                        {member.playerName}
                      </span>
                      {isMemberHost && (
                        <span className="px-1.5 py-0.5 text-xs font-semibold bg-cyan-500/20 text-cyan-300 rounded">
                          Host
                        </span>
                      )}
                      {member.isMuted && (
                        <span className="px-1.5 py-0.5 text-xs font-semibold bg-rose-500/20 text-rose-300 rounded">
                          Muted
                        </span>
                      )}
                    </div>
                    {!isMemberHost ? (
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          onClick={() => storedRoomId && onKickPlayer(member.id, member.userId || "", storedRoomId)}
                          className="text-sm text-orange-600"
                          disabled={kickingPlayerId !== null || banningPlayerId !== null}
                          isLoading={kickingPlayerId === member.id}
                        >
                          {kickingPlayerId === member.id ? "Kicking..." : "Kick"}
                        </Button>
                        <Button
                          variant="ghost"
                          onClick={() => storedRoomId && onBanPlayer(member.id, member.userId || "", storedRoomId)}
                          className="text-sm text-rose-600"
                          disabled={kickingPlayerId !== null || banningPlayerId !== null}
                          isLoading={banningPlayerId === member.id}
                        >
                          {banningPlayerId === member.id ? "Banning..." : "Ban"}
                        </Button>
                      </div>
                    ) : null}
                  </div>
                );
              })}
              {roomLobbyMembers.length > 10 && (
                <div className="text-center py-2 text-xs text-slate-400">
                  Showing 10 of {roomLobbyMembers.length} members
                </div>
              )}
              {!roomLobbyMembers.length && (
                <div className="text-center py-2 text-xs text-slate-400">
                  Room members will appear here as they join.
                </div>
              )}
            </div>
          )}
        </div>
      ) : null}

      {/* Audience Question Submissions Review */}
      {(storedRoomId || session) && (
        <div className={`rounded-3xl shadow-lg border-[3px] overflow-hidden ${!isDark ? 'bg-white shadow-slate-300/40 border-slate-200' : 'bg-slate-800 shadow-fuchsia-500/20 border-slate-600'}`}>
          <div className="flex items-center justify-between px-5 pt-4 pb-2">
            <h3 className="text-lg font-semibold text-pink-400">
              Audience Questions
            </h3>
            {pendingSubmissionCount > 0 && (
              <span className="text-xs font-bold bg-emerald-500 text-white rounded-full px-2 py-0.5">
                {pendingSubmissionCount} pending
              </span>
            )}
          </div>
          <div className="max-h-[400px]">
            <SubmissionReviewPanel
              submissions={allSubmissions}
              pendingCount={pendingSubmissionCount}
              isLoading={false}
              onApprove={onApproveSubmission}
              onReject={onRejectSubmission}
            />
          </div>
        </div>
      )}
    </aside>
  );
}
