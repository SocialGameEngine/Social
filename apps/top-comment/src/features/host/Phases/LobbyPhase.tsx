import { Card, Button } from "@social/ui";
import { useTheme } from "../../../shared/providers/ThemeProvider";

interface LobbyPhaseProps {
  inviteLink: string;
  storedCode: string | null;
  sessionId: string | null;
  handleCopyLink: (link: string) => void;
  sessionCode?: string;
}

export function LobbyPhase({
  inviteLink,
  storedCode,
  sessionId,
  handleCopyLink,
  sessionCode,
}: LobbyPhaseProps) {
  const { isDark } = useTheme();

  return (
    <Card className="space-y-5" isDark={isDark}>
      <div className="flex items-center justify-between">
        <h3 className={`text-xl font-semibold ${!isDark ? 'text-slate-900' : 'text-pink-400'}`}>
          {sessionId ? "Session Lobby" : "Waiting for players"}
        </h3>
        <div className="flex gap-2">
          <Button onClick={() => handleCopyLink(sessionCode ?? "")} variant="secondary" size="sm">
            Copy Code
          </Button>
          <Button 
            onClick={() => sessionId && window.open(`/presenter/${sessionId}`, "_blank")} 
            variant="ghost" 
            size="sm"
            disabled={!sessionId}
          >
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
      </Card>
  );
}
