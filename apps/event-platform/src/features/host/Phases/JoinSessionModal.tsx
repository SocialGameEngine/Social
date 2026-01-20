import { Modal, Button, FormField } from "@social/ui";
import { useTheme } from "../../../shared/providers/ThemeProvider";
import { useState } from "react";

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
  const [sessionId, setSessionId] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!sessionId.trim()) {
      setError("Please enter a session ID");
      return;
    }

    // Basic UUID validation
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(sessionId.trim())) {
      setError("Please enter a valid session ID");
      return;
    }

    setError("");
    onJoin(sessionId.trim());
  };

  const handleClose = () => {
    setSessionId("");
    setError("");
    onClose();
  };

  return (
    <Modal open={open} onClose={handleClose} title="Join Existing Session" isDark={isDark}>
      <div className="space-y-6">
        <p className={`text-sm ${!isDark ? 'text-slate-600' : 'text-slate-400'}`}>
          Enter the session ID to join as host
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <FormField
              label="Session ID"
              value={sessionId}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSessionId(e.target.value)}
              placeholder="e.g., 3c6d7f1a-2831-4f76-b991-3fb77b40bf21"
              error={error}
              isDark={isDark}
              disabled={isJoining}
            />
            <p className={`mt-1 text-xs ${!isDark ? 'text-slate-500' : 'text-slate-400'}`}>
              You can find the session ID in the URL of the presenter or team view
            </p>
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
            <Button
              type="submit"
              fullWidth
              isLoading={isJoining}
              disabled={isJoining}
            >
              {isJoining ? "Joining..." : "Join Session"}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
