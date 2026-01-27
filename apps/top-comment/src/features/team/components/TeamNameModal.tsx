import { useState } from "react";
import { Button, Modal } from "@social/ui";
import { useTheme } from "../../../shared/providers/ThemeProvider";

interface TeamNameModalProps {
  isOpen: boolean;
  teamCode: string;
  onSubmit: (teamName: string) => void;
  onCancel: () => void;
}

export function TeamNameModal({ isOpen, teamCode, onSubmit, onCancel }: TeamNameModalProps) {
  const { isDark } = useTheme();
  const [teamName, setTeamName] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = () => {
    const name = teamName.trim();
    
    if (!name) {
      setError("Team name is required");
      return;
    }

    if (name.length < 2) {
      setError("Team name must be at least 2 characters");
      return;
    }

    if (name.length > 10) {
      setError("Team name must be 10 characters or less");
      return;
    }

    onSubmit(name);
  };

  const handleClose = () => {
    setTeamName("");
    setError("");
    onCancel();
  };

  return (
    <Modal
      open={isOpen}
      onClose={handleClose}
      title="Create Your Team"
      isDark={isDark}
      footer={
        <div className="flex w-full items-center justify-between gap-3">
          <Button variant="ghost" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!teamName.trim()}>
            Create Team
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <div className={`p-4 rounded-lg ${isDark ? 'bg-cyan-900/30 border border-cyan-400/30' : 'bg-blue-50 border border-blue-200'}`}>
          <p className={`text-sm ${isDark ? 'text-cyan-100' : 'text-blue-900'}`}>
            You're creating a new team with code <span className="font-mono font-bold">{teamCode}</span>
          </p>
          <p className={`text-xs mt-2 ${isDark ? 'text-cyan-200' : 'text-blue-700'}`}>
            Other players can join your team using this code.
          </p>
        </div>

        <div>
          <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
            Team Name
          </label>
          <input
            type="text"
            value={teamName}
            onChange={(e) => {
              setTeamName(e.target.value);
              setError("");
            }}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && teamName.trim()) {
                handleSubmit();
              }
            }}
            placeholder="Enter your team name"
            maxLength={10}
            className={`w-full px-4 py-3 rounded-lg border-2 ${
              error
                ? 'border-red-500 bg-red-50'
                : isDark
                ? 'border-cyan-500 bg-slate-800 text-white'
                : 'border-blue-500 bg-white text-slate-900'
            } focus:outline-none focus:ring-2 focus:ring-offset-2 ${
              isDark ? 'focus:ring-cyan-400' : 'focus:ring-blue-400'
            }`}
            autoFocus
          />
          {error && (
            <p className="mt-2 text-sm text-red-500">{error}</p>
          )}
          <p className={`mt-2 text-xs ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
            {teamName.length}/10 characters
          </p>
        </div>

        <div className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
          <p>💡 <strong>Tip:</strong> Choose a fun, memorable name for your team!</p>
        </div>
      </div>
    </Modal>
  );
}
