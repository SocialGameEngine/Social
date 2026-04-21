import { Button } from "../../../components/Button";
import { useTheme } from "../../../shared/providers/ThemeProvider";
import { useState, useEffect } from "react";
import { supabase } from "../../../supabase/client";

interface Sociale {
  id: string;
  room_id: string;
  title: string | null;
  description: string | null;
  mode: string;
  status: string;
  created_at: string;
  total_rounds: number;
}

interface JoinSocialeModalProps {
  open: boolean;
  onClose: () => void;
  onJoin: (socialeId: string) => void;
  isJoining: boolean;
}

export function JoinSocialeModal({
  open,
  onClose,
  onJoin,
  isJoining,
}: JoinSocialeModalProps) {
  const { isDark } = useTheme();
  const [sociales, setSociales] = useState<Sociale[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [view, setView] = useState<"active" | "ended">("active");

  useEffect(() => {
    if (open) {
      setView("active");
      fetchHostSociales();
    }
  }, [open]);

  const fetchHostSociales = async () => {
    setLoading(true);
    setError("");

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError("Not authenticated");
        return;
      }

      const { data, error } = await supabase
        .from('sociales')
        .select('id, room_id, title, description, mode, status, created_at, total_rounds')
        .eq('created_by', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        setError("Failed to load Sociales");
        return;
      }

      setSociales(data || []);
    } catch (err) {
      setError("Failed to load Sociales");
    } finally {
      setLoading(false);
    }
  };

  const handleJoinSociale = (socialeId: string) => {
    onJoin(socialeId);
  };

  const handleClose = () => {
    setSociales([]);
    setError("");
    onClose();
  };

  const activeSociales = sociales.filter((sociale) => !["completed", "cancelled"].includes(sociale.status));
  const endedSociales = sociales.filter((sociale) => ["completed", "cancelled"].includes(sociale.status));
  const socialesToShow = view === "ended" ? endedSociales : activeSociales;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return isDark ? 'bg-slate-700 text-slate-300' : 'bg-gray-100 text-gray-600';
      case 'lobby':
        return isDark ? 'bg-blue-900/50 text-blue-300' : 'bg-blue-50 text-blue-600';
      case 'active':
        return isDark ? 'bg-green-900/50 text-green-300' : 'bg-green-50 text-green-600';
      case 'paused':
        return isDark ? 'bg-yellow-900/50 text-yellow-300' : 'bg-yellow-50 text-yellow-600';
      case 'completed':
        return isDark ? 'bg-purple-900/50 text-purple-300' : 'bg-purple-50 text-purple-600';
      case 'cancelled':
        return isDark ? 'bg-red-900/50 text-red-300' : 'bg-red-50 text-red-600';
      default:
        return isDark ? 'bg-slate-700 text-slate-300' : 'bg-gray-100 text-gray-600';
    }
  };

  const getModeDisplay = (mode: string) => {
    return mode.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex sm:items-center sm:justify-center sm:p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={!isJoining ? handleClose : undefined}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-md max-h-[90vh] overflow-hidden bg-white dark:bg-slate-900 rounded-lg shadow-xl">
        {/* Header */}
        <div className="px-4 py-3 border-b border-gray-200 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Load Sociale
            </h2>
            <button
              onClick={handleClose}
              disabled={isJoining}
              className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-slate-800 disabled:opacity-50"
            >
              <svg className="w-5 h-5 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          {loading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Loading Sociales...</p>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-red-600 dark:text-red-400">{error}</p>
              <button
                onClick={fetchHostSociales}
                className="mt-2 text-sm text-blue-600 dark:text-blue-400 hover:underline"
              >
                Try again
              </button>
            </div>
          ) : socialesToShow.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600 dark:text-gray-400">
                {view === "active" ? "No active Sociales found" : "No ended Sociales found"}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {socialesToShow.map((sociale) => (
                <div
                  key={sociale.id}
                  className={`p-3 rounded-lg border ${
                    isDark 
                      ? 'bg-slate-800 border-slate-700 hover:bg-slate-700' 
                      : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                  } transition-colors`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 dark:text-white truncate">
                        {sociale.title || `Sociale ${sociale.id.slice(0, 8)}`}
                      </h3>
                      {sociale.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                          {sociale.description}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-2">
                        <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(sociale.status)}`}>
                          {sociale.status}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {getModeDisplay(sociale.mode)}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {sociale.total_rounds} rounds
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {formatDate(sociale.created_at)}
                      </p>
                    </div>
                    <Button
                      onClick={() => handleJoinSociale(sociale.id)}
                      disabled={isJoining}
                      size="sm"
                      className="ml-2 flex-shrink-0"
                    >
                      Load
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer with view toggle */}
        {sociales.length > 0 && (
          <div className="px-4 py-3 border-t border-gray-200 dark:border-slate-700">
            <div className="flex justify-center gap-2">
              <button
                onClick={() => setView("active")}
                className={`px-3 py-1 text-sm rounded-md ${
                  view === "active"
                    ? isDark
                      ? "bg-slate-700 text-white"
                      : "bg-gray-200 text-gray-900"
                    : isDark
                      ? "text-gray-400 hover:text-gray-300"
                      : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Active ({activeSociales.length})
              </button>
              <button
                onClick={() => setView("ended")}
                className={`px-3 py-1 text-sm rounded-md ${
                  view === "ended"
                    ? isDark
                      ? "bg-slate-700 text-white"
                      : "bg-gray-200 text-gray-900"
                    : isDark
                      ? "text-gray-400 hover:text-gray-300"
                      : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Ended ({endedSociales.length})
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
