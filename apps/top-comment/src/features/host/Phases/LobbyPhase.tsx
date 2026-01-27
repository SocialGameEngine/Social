import { useState } from "react";
import { Card, Button, useToast } from "@social/ui";
import { useTheme } from "../../../shared/providers/ThemeProvider";
import { getMascotById } from "../../../shared/mascots";
import type { Team } from "../../../shared/types";
import { UserXIcon, BanIcon } from "../../../shared/components/icons/VIBoxIcons";
import { kickPlayer, banPlayer } from "../../session/sessionService";

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
  teams: players,
}: LobbyPhaseProps) {
  const { isDark } = useTheme();
  const { toast } = useToast();
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const handleKick = async (playerId: string, userId: string, name: string) => {
    if (!sessionId || !userId) return;
    setActionLoading(`kick-${playerId}`);
    try {
      await kickPlayer({ sessionId, teamId: playerId, userId });
      toast({ title: `Kicked ${name}`, variant: "success" });
    } catch (err) {
      console.error("Error kicking player:", err);
      toast({ title: "Failed to kick player", variant: "error" });
    } finally {
      setActionLoading(null);
    }
  };

  const handleBan = async (playerId: string, userId: string, name: string) => {
    if (!sessionId || !userId) return;
    setActionLoading(`ban-${playerId}`);
    try {
      await banPlayer({ sessionId, teamId: playerId, userId });
      toast({ title: `Banned ${name}`, variant: "success" });
    } catch (err) {
      console.error("Error banning player:", err);
      toast({ title: "Failed to ban player", variant: "error" });
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <Card className="space-y-5" isDark={isDark}>
      <div className="flex items-center justify-between">
        <h3 className={`text-xl font-semibold ${!isDark ? 'text-slate-900' : 'text-pink-400'}`}>
          Waiting for players
        </h3>
        <div className="flex gap-2">
          <Button onClick={() => handleCopyLink(sessionCode ?? "")} variant="secondary" size="sm">
            Copy Code
          </Button>
          <Button onClick={() => window.open(`/presenter/${sessionId}`, "_blank")} variant="ghost" size="sm">
            Presenter View
          </Button>
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-1">
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
      {players.length > 0 && (
        <div className="space-y-3">
          <h3 className={`text-sm font-semibold ${!isDark ? 'text-slate-700' : 'text-slate-300'}`}>Players joined ({players.length})</h3>
          <ul className="grid gap-2 sm:grid-cols-2">
            {players.map((player) => {
              const mascot = player.mascotId ? getMascotById(player.mascotId) : null;
              const isLoading = actionLoading === `kick-${player.id}` || actionLoading === `ban-${player.id}`;
              
              return (
                <li
                  key={player.id}
                  className={`flex items-center justify-between gap-3 px-4 py-3 rounded-xl border ${
                    !isDark ? 'bg-white border-slate-200' : 'bg-slate-800/50 border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-3 overflow-hidden">
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
                              parent.textContent = player.teamName.charAt(0).toUpperCase();
                              parent.className = `flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full ${!isDark ? 'bg-slate-200 text-sm font-bold text-slate-600' : 'bg-slate-600 text-sm font-bold text-slate-300'}`;
                            }
                          }}
                        />
                      </div>
                    ) : (
                      <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full ${!isDark ? 'bg-slate-200 text-sm font-bold text-slate-600' : 'bg-slate-600 text-sm font-bold text-slate-300'}`}>
                        {player.teamName.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <span className={`text-sm font-medium ${!isDark ? 'text-slate-800' : 'text-slate-200'} truncate`}>{player.teamName}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleKick(player.id, player.uid!, player.teamName)}
                      disabled={isLoading || !player.uid}
                      className="h-8 w-8 p-0"
                    >
                      <UserXIcon className="w-4 h-4 text-slate-400 hover:text-red-400" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleBan(player.id, player.uid!, player.teamName)}
                      disabled={isLoading || !player.uid}
                      className="h-8 w-8 p-0"
                    >
                      <BanIcon className="w-4 h-4 text-slate-400 hover:text-red-600" />
                    </Button>
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
