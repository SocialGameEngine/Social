import { Card } from "@social/ui";
import { useSessionPlayers } from "../hooks/useSessionPlayers";
import type { Session } from "../../../shared/types";
import type { SessionPlayer } from "../../../services/sessionPlayerService";

interface SessionPlayersPanelProps {
  isDark: boolean;
  session: Session | null;
  sessionId: string | null;
}

export function SessionPlayersPanel({
  isDark,
  session,
  sessionId,
}: SessionPlayersPanelProps) {
  const { players: sessionPlayers } = useSessionPlayers(sessionId);

  if (!session) return null;

  return (
    <Card className="space-y-5" isDark={isDark}>
      <div className={`border-t pt-5 ${!isDark ? "border-slate-200" : "border-cyan-400/20"}`}>
        <div className="mb-3 flex items-center justify-between">
          <h4 className={`text-sm font-semibold uppercase tracking-wide ${!isDark ? "text-slate-500" : "text-cyan-400"}`}>
            Session Players
          </h4>
          <div className="flex gap-2">
            <span className={`text-xs font-medium ${!isDark ? "text-slate-500" : "text-cyan-300"}`}>
              {sessionPlayers.length} players
            </span>
          </div>
        </div>
        
        <div className={`space-y-4 rounded-3xl p-5 shadow-lg border-[3px] ${!isDark ? 'bg-white shadow-slate-300/40 border-slate-200' : 'bg-slate-800 shadow-fuchsia-500/20 border-slate-600'}`}>
          <ul className="space-y-2">
            {sessionPlayers.map((player: SessionPlayer) => (
              <li
                key={player.id}
                className="flex items-center justify-between rounded-2xl px-4 py-3 bg-slate-700"
              >
                <span className="font-medium text-cyan-100">
                  {player.displayName || 'Anonymous'}
                </span>
                <span className="text-sm text-cyan-400">
                  {player.score} pts
                </span>
              </li>
            ))}
            {!sessionPlayers.length ? (
              <li className="rounded-2xl px-4 py-3 text-sm bg-slate-700 text-cyan-300">
                Players will appear here when they join the session.
              </li>
            ) : null}
          </ul>
        </div>
      </div>
    </Card>
  );
}
