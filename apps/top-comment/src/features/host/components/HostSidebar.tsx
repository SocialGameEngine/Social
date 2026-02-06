import { Button, QRCodeBlock } from "@social/ui";
import type { Session, Team } from "../../../shared/types";

interface HostSidebarProps {
  session: Session | null;
  storedRoomId: string | null;
  lobbyTeams: Team[];
  lobbyPlayerCount: number;
  inviteLink: string;
  isDark: boolean;
  setShowBannedPlayersModal: (show: boolean) => void;
  kickPlayerHandler: (teamId: string, userId: string) => Promise<void>;
  banPlayerHandler: (teamId: string, userId: string) => Promise<void>;
  kickingPlayerId: string | null;
  banningPlayerId: string | null;
}

export function HostSidebar({
  session,
  storedRoomId,
  lobbyTeams,
  lobbyPlayerCount,
  inviteLink,
  isDark,
  setShowBannedPlayersModal,
  kickPlayerHandler,
  banPlayerHandler,
  kickingPlayerId,
  banningPlayerId,
}: HostSidebarProps) {
  return (
    <aside className="flex flex-col gap-6">
      {inviteLink ? (
        <QRCodeBlock value={inviteLink} caption="Scan to join!" isDark={isDark} />
      ) : (
        <div className="rounded-3xl p-6 text-center text-sm shadow-lg bg-slate-800 text-cyan-300 shadow-fuchsia-500/20">
          Create a room to generate a QR code for your guests.
        </div>
      )}
      {storedRoomId || session ? (
        <div className={`space-y-4 rounded-3xl p-5 shadow-lg border-[3px] ${!isDark ? 'bg-white shadow-slate-300/40 border-slate-200' : 'bg-slate-800 shadow-fuchsia-500/20 border-slate-600'}`}>
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-pink-400">
              Lobby ({lobbyPlayerCount})
            </h3>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                onClick={() => setShowBannedPlayersModal(true)}
                className="text-xs text-purple-600"
              >
                View Banned
              </Button>
              <span className={`text-xs ${!isDark ? 'text-slate-500' : 'text-cyan-300'}`}>
                Max {session?.settings.maxTeams ?? 24}
              </span>
            </div>
          </div>
          <ul className="space-y-2">
            {lobbyTeams.map((player) => (
              <li
                key={player.id}
                className="flex items-center justify-between rounded-2xl px-4 py-3 bg-slate-700"
              >
                <span className="font-medium text-cyan-100">
                  {player.teamName}
                  {player.isHost ? " (Host)" : ""}
                </span>
                {!player.isHost ? (
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      onClick={() => kickPlayerHandler(player.id, player.uid || "")}
                      className="text-sm text-orange-600"
                      disabled={kickingPlayerId !== null || banningPlayerId !== null}
                      isLoading={kickingPlayerId === player.id}
                    >
                      {kickingPlayerId === player.id ? "Kicking..." : "Kick"}
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => banPlayerHandler(player.id, player.uid || "")}
                      className="text-sm text-rose-600"
                      disabled={kickingPlayerId !== null || banningPlayerId !== null}
                      isLoading={banningPlayerId === player.id}
                    >
                      {banningPlayerId === player.id ? "Banning..." : "Ban"}
                    </Button>
                  </div>
                ) : null}
              </li>
            ))}
            {!lobbyTeams.length ? (
              <li className="rounded-2xl px-4 py-3 text-sm bg-slate-700 text-cyan-300">
                Players will appear here as they join.
              </li>
            ) : null}
          </ul>
        </div>
      ) : null}
    </aside>
  );
}
