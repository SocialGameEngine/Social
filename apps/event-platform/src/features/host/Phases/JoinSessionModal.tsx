import { Modal, Button } from "@social/ui";
import { useTheme } from "../../../shared/providers/ThemeProvider";
import { useState, useEffect } from "react";
import { supabase } from "../../../supabase/client";

interface Session {
  id: string;
  code: string;
  status: string;
  created_at: string;
}

interface JoinSessionModalProps {
  open: boolean;
  onClose: () => void;
  onJoin: (sessionId: string) => void;
  isJoining: boolean;
}

export function JoinSessionModal({
  open,
  onClose,
  onJoin,
  isJoining,
}: JoinSessionModalProps) {
  const { isDark } = useTheme();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [view, setView] = useState<"active" | "ended">("active");

  useEffect(() => {
    if (open) {
      setView("active");
      fetchHostSessions();
    }
  }, [open]);

  const fetchHostSessions = async () => {
    setLoading(true);
    setError("");

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError("Not authenticated");
        return;
      }

      const { data, error } = await supabase
        .from('sessions')
        .select('id, code, status, created_at')
        .eq('host_uid', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        setError("Failed to load sessions");
        return;
      }

      setSessions(data || []);
    } catch (err) {
      setError("Failed to load sessions");
    } finally {
      setLoading(false);
    }
  };

  const handleJoinSession = (sessionId: string) => {
    onJoin(sessionId);
  };

  const handleClose = () => {
    setSessions([]);
    setError("");
    onClose();
  };

  const activeSessions = sessions.filter((session) => session.status !== "ended");
  const endedSessions = sessions.filter((session) => session.status === "ended");
  const sessionsToShow = view === "ended" ? endedSessions : activeSessions;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Modal open={open} onClose={handleClose} title="Join Your Sessions" isDark={isDark}>
      <div className="space-y-6">
        <p className={`text-sm ${!isDark ? 'text-slate-600' : 'text-slate-400'}`}>
          Select a session to join as host
        </p>

        {error && (
          <div className={`p-3 rounded-lg text-sm ${!isDark ? 'bg-red-50 text-red-700' : 'bg-red-900/20 text-red-400'}`}>
            {error}
          </div>
        )}

        {!loading && !error && sessions.length > 0 ? (
          <div className="flex items-center gap-2">
            <div
              className={`inline-flex rounded-xl border p-1 ${
                !isDark ? "border-slate-200 bg-slate-50" : "border-slate-700 bg-slate-900/30"
              }`}
            >
              <button
                type="button"
                onClick={() => setView("active")}
                disabled={isJoining}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                  view === "active"
                    ? !isDark
                      ? "bg-white text-slate-900 shadow-sm"
                      : "bg-slate-800 text-cyan-100 shadow-sm"
                    : !isDark
                      ? "text-slate-600 hover:text-slate-900"
                      : "text-slate-400 hover:text-slate-200"
                } disabled:opacity-50`}
              >
                Active ({activeSessions.length})
              </button>
              <button
                type="button"
                onClick={() => setView("ended")}
                disabled={isJoining}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                  view === "ended"
                    ? !isDark
                      ? "bg-white text-slate-900 shadow-sm"
                      : "bg-slate-800 text-cyan-100 shadow-sm"
                    : !isDark
                      ? "text-slate-600 hover:text-slate-900"
                      : "text-slate-400 hover:text-slate-200"
                } disabled:opacity-50`}
              >
                Ended ({endedSessions.length})
              </button>
            </div>
            <Button
              type="button"
              variant="ghost"
              onClick={fetchHostSessions}
              disabled={isJoining}
              className="text-xs"
            >
              Refresh
            </Button>
          </div>
        ) : null}

        <div className="space-y-3">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-400 mx-auto"></div>
              <p className={`mt-2 text-sm ${!isDark ? 'text-slate-600' : 'text-slate-400'}`}>
                Loading your sessions...
              </p>
            </div>
          ) : sessions.length === 0 ? (
            <div className="text-center py-8">
              <p className={`text-sm ${!isDark ? 'text-slate-600' : 'text-slate-400'}`}>
                No sessions found. Create a new session first.
              </p>
            </div>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {sessionsToShow.length === 0 ? (
                <div className="rounded-xl p-4 text-center">
                  <p className={`text-sm ${!isDark ? "text-slate-600" : "text-slate-400"}`}>
                    {view === "ended" ? "No ended sessions." : "No active sessions."}
                  </p>
                </div>
              ) : null}

              {sessionsToShow.map((session) => (
                <button
                  key={session.id}
                  onClick={() => handleJoinSession(session.id)}
                  disabled={isJoining}
                  className={`w-full p-4 rounded-lg border text-left transition-all hover:scale-[1.02] ${
                    !isDark
                      ? 'bg-white border-slate-200 hover:bg-slate-50 hover:border-slate-300'
                      : 'bg-slate-800 border-slate-600 hover:bg-slate-700 hover:border-slate-500'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xl font-bold text-pink-400">
                          {session.code}
                        </span>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          session.status === 'lobby'
                            ? (!isDark ? 'bg-green-100 text-green-800' : 'bg-green-900/30 text-green-400')
                            : session.status === 'ended'
                            ? (!isDark ? 'bg-gray-100 text-gray-800' : 'bg-gray-900/30 text-gray-400')
                            : (!isDark ? 'bg-yellow-100 text-yellow-800' : 'bg-yellow-900/30 text-yellow-400')
                        }`}>
                          {session.status}
                        </span>
                      </div>
                      <p className={`text-xs mt-1 ${!isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                        Created {formatDate(session.created_at)}
                      </p>
                    </div>
                    <div className="text-right">
                      {isJoining ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-pink-400"></div>
                      ) : (
                        <span className={`text-sm ${!isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                          Join →
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <Button
            type="button"
            onClick={handleClose}
            variant="secondary"
            fullWidth
            disabled={isJoining}
          >
            Cancel
          </Button>
        </div>
      </div>
    </Modal>
  );
}
