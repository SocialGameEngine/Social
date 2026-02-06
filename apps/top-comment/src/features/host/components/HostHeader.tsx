import { Link } from "react-router-dom";
import { Card } from "@social/ui";
import { VIBoxButton } from "../../../shared/components/vibox/VIBoxButton";
import { phaseCopy } from "../../../shared/constants";
import type { Session } from "../../../shared/types";

interface HostHeaderProps {
  session: Session | null;
  storedRoomId: string | null;
  roomName?: string;
  roomJoinCode: string;
  lobbyPlayerCount: number;
  isDark: boolean;
  presenterButton: React.ReactNode;
  setShowVIBoxModal: (show: boolean) => void;
}

export function HostHeader({
  session,
  storedRoomId,
  roomName,
  roomJoinCode,
  lobbyPlayerCount,
  isDark,
  presenterButton,
  setShowVIBoxModal,
}: HostHeaderProps) {
  return (
    <Card className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between" isDark={isDark}>
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <Link to="/" className="text-sm font-semibold text-cyan-400 hover:text-cyan-300">
            ← Back
          </Link>
          {presenterButton}
          <VIBoxButton 
            onClick={() => setShowVIBoxModal(true)}
            variant="host"
            size="lg"
          />
        </div>
        <div>
          <h1 className="text-3xl font-black text-pink-400">
            {roomName || "Host Console"}
          </h1>
          {session ? (
            <p className="text-sm text-cyan-300">
              {phaseCopy[session.status]}
            </p>
          ) : storedRoomId ? (
            <p className="text-sm text-cyan-300">
              Room active. Waiting for players to join.
            </p>
          ) : (
            <p className="text-sm text-cyan-300">
              Create a game room when you're ready to host.
            </p>
          )}
        </div>
      </div>
      <div className="flex flex-col items-center gap-2 rounded-2xl px-6 py-4 border bg-cyan-900/30 border-cyan-400/50">
        <span className="text-xs uppercase tracking-wider text-cyan-300">
          Room code
        </span>
        <span className="text-3xl font-black tracking-widest text-pink-400">
          {roomJoinCode || "---"}
        </span>
        {storedRoomId || session ? (
          <>
            <span className="text-xs text-cyan-400">
              {lobbyPlayerCount} player{lobbyPlayerCount === 1 ? "" : "s"} online
            </span>
            {session && (
              <div className="mt-1 flex flex-col items-center gap-1 border-t border-cyan-400/20 pt-2 w-full">
                <span className="text-[10px] uppercase tracking-tighter text-cyan-500/70 font-bold">
                  Active Session
                </span>
                <span className="text-[10px] text-pink-400/80 font-mono">
                  {session.id.slice(0, 13)}
                </span>
              </div>
            )}
          </>
        ) : null}
      </div>
    </Card>
  );
}
