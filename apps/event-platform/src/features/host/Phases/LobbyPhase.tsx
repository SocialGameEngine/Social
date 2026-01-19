import { Card, Button } from "@social/ui";
import { useTheme } from "../../../shared/providers/ThemeProvider";
import { getMascotById } from "../../../shared/mascots";
import type { Team } from "../../../shared/types";

interface LobbyPhaseProps {
  inviteLink: string;
  storedCode: string | null;
  sessionId: string | null;
  handleCopyLink: (link: string) => void;
  sessionCode?: string;
  teams: Team[];
}

export function LobbyPhase({
  inviteLink,
  storedCode,
  sessionId,
  handleCopyLink,
  sessionCode,
  teams,
}: LobbyPhaseProps) {
  const { isDark } = useTheme();
  return (
    <Card className="space-y-5" isDark={isDark}>
      <div>
        <h3 className={`text-xl font-semibold ${!isDark ? 'text-slate-900' : 'text-pink-400'}`}>
          Waiting for teams
        </h3>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => handleCopyLink(inviteLink)}
          className={`flex flex-col rounded-2xl border p-4 text-left shadow-sm transition hover:shadow-md ${!isDark ? 'border-slate-200 bg-white hover:border-brand-primary text-slate-900' : 'border-cyan-400/50 bg-slate-800 hover:border-cyan-400 text-white'}`}
        >
          <span className={`text-xs font-semibold uppercase tracking-wide ${!isDark ? 'text-slate-500' : 'text-cyan-300'}`}>
            Shareable link
          </span>
          <span className={`mt-1 break-all font-medium ${!isDark ? 'text-brand-primary' : 'text-cyan-400'}`}>
            {inviteLink || storedCode}
          </span>
        </button>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Button
          onClick={() => handleCopyLink(sessionCode ?? "")}
          variant="secondary"
        >
          Copy room code
        </Button>
        <Button
          onClick={() => window.open(`/presenter/${sessionId}`, "_blank")}
          variant="ghost"
        >
          Open presenter view
        </Button>
      </div>
      {teams.length > 0 && (
        <div>
          <h3 className={`text-sm font-semibold ${!isDark ? 'text-slate-700' : 'text-slate-300'}`}>Teams joined ({teams.length})</h3>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {teams.map((team) => {
              const mascot = team.mascotId ? getMascotById(team.mascotId) : null;
              return (
                <li
                  key={team.id}
                  className="elevated-card flex items-center gap-3 px-4 py-3"
                >
                  {mascot ? (
                    <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full ${!isDark ? 'bg-slate-100' : 'bg-slate-700'}`}>
                      <img
                        src={mascot.path}
                        alt={mascot.name}
                        className="h-6 w-6 object-contain"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                          const parent = e.currentTarget.parentElement;
                          if (parent) {
                            parent.textContent = team.teamName.charAt(0).toUpperCase();
                            parent.className = `flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full ${!isDark ? 'bg-slate-200 text-sm font-bold text-slate-600' : 'bg-slate-600 text-sm font-bold text-slate-300'}`;
                          }
                        }}
                      />
                    </div>
                  ) : (
                    <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full ${!isDark ? 'bg-slate-200 text-sm font-bold text-slate-600' : 'bg-slate-600 text-sm font-bold text-slate-300'}`}>
                      {team.teamName.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <span className={`text-sm font-medium ${!isDark ? 'text-slate-800' : 'text-slate-200'} truncate`}>{team.teamName}</span>
                    <span className={`text-xs ${!isDark ? 'text-slate-600' : 'text-cyan-300'} ml-2`}>Score: {team.score}</span>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </Card>
  );
}
