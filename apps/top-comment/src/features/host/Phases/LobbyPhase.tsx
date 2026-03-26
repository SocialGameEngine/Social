import { Card } from "@social/ui";
import { useTheme } from "../../../shared/providers/ThemeProvider";
import type { ReactNode } from "react";

interface LobbyPhaseProps {
  inviteLink: string;
  storedCode: string | null;
  sessionId: string | null;
  handleCopyLink: (link: string) => void;
  promptLibraryContent?: ReactNode;
  sessionControls?: ReactNode;
  actionButtons?: ReactNode;
  sessionPlayers?: ReactNode;
}

export function LobbyPhase({
  inviteLink,
  storedCode,
  sessionId,
  handleCopyLink,
  promptLibraryContent,
  sessionControls,
  actionButtons,
  sessionPlayers,
}: LobbyPhaseProps) {
  const { isDark } = useTheme();

  return (
    <Card className="space-y-5" isDark={isDark}>
      <div className="flex items-center justify-between">
        <h3 className={`text-xl font-semibold ${!isDark ? 'text-slate-900' : 'text-pink-400'}`}>
          {sessionId ? "Session" : "Session"}
        </h3>
        <div className="flex gap-2">
          {sessionControls}
          {actionButtons}
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

      {/* Prompt Library Section */}
      {promptLibraryContent && (
        <div className={`border-t pt-5 ${!isDark ? 'border-slate-200' : 'border-cyan-400/20'}`}>
          {promptLibraryContent}
        </div>
      )}

      {/* Session Players */}
      {sessionPlayers && (
        <div className={`border-t pt-5 ${!isDark ? 'border-slate-200' : 'border-cyan-400/20'}`}>
          {sessionPlayers}
        </div>
      )}

            </Card>
  );
}
