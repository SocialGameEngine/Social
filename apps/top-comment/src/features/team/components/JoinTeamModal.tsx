import { useState } from "react";
import { Button, Modal } from "@social/ui";
import { useTheme } from "../../../shared/providers/ThemeProvider";

interface JoinTeamModalProps {
  isOpen: boolean;
  teamCode: string;
  isCreatingTeam: boolean;
  existingTeamName?: string;
  onSubmit: (playerName: string, teamName?: string) => void;
  onCancel: () => void;
}

export function JoinTeamModal({ 
  isOpen, 
  teamCode, 
  isCreatingTeam, 
  existingTeamName, 
  onSubmit, 
  onCancel 
}: JoinTeamModalProps) {
  const { isDark } = useTheme();
  const [playerName, setPlayerName] = useState("");
  const [teamName, setTeamName] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = () => {
    const pName = playerName.trim();
    const tName = teamName.trim();
    
    if (!pName) {
      setError("Player name is required");
      return;
    }

    if (pName.length < 2) {
      setError("Player name must be at least 2 characters");
      return;
    }

    if (pName.length > 20) {
      setError("Player name must be less than 20 characters");
      return;
    }

    if (isCreatingTeam && !tName) {
      setError("Team name is required");
      return;
    }

    if (isCreatingTeam && tName.length < 2) {
      setError("Team name must be at least 2 characters");
      return;
    }

    if (isCreatingTeam && tName.length > 30) {
      setError("Team name must be less than 30 characters");
      return;
    }

    onSubmit(pName, isCreatingTeam ? tName : undefined);
  };

  const handleClose = () => {
    setPlayerName("");
    setTeamName("");
    setError("");
    onCancel();
  };

  return (
    <Modal
      open={isOpen}
      onClose={handleClose}
      title={isCreatingTeam ? "Create Your Team" : "Join Team"}
      isDark={isDark}
      footer={
        <div className="flex w-full items-center justify-between gap-3">
          <Button variant="ghost" onClick={handleClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={!playerName.trim() || (isCreatingTeam && !teamName.trim())}
          >
            {isCreatingTeam ? "Create & Join" : "Join Team"}
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <div className={`p-4 rounded-lg ${isDark ? 'bg-cyan-900/30 border border-cyan-400/30' : 'bg-blue-50 border border-blue-200'}`}>
          <p className={`text-sm ${isDark ? 'text-cyan-100' : 'text-blue-900'}`}>
            {isCreatingTeam 
              ? `You're creating a new team with code ${teamCode}`
              : `You're joining team "${existingTeamName}" with code ${teamCode}`
            }
          </p>
          <p className={`text-xs mt-2 ${isDark ? 'text-cyan-200' : 'text-blue-700'}`}>
            {isCreatingTeam 
              ? "Other players can join your team using this code."
              : "You'll be added to this existing team."
            }
          </p>
        </div>

        {/* Player Name */}
        <div>
          <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
            Your Name *
          </label>
          <input
            type="text"
            value={playerName}
            onChange={(e) => {
              setPlayerName(e.target.value);
              setError("");
            }}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && playerName.trim() && (!isCreatingTeam || teamName.trim())) {
                handleSubmit();
              }
            }}
            placeholder="Enter your name"
            maxLength={20}
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
          <p className={`mt-2 text-xs ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
            {playerName.length}/20 characters
          </p>
        </div>

        {/* Team Name (only for creating new teams) */}
        {isCreatingTeam && (
          <div>
            <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              Team Name *
            </label>
            <input
              type="text"
              value={teamName}
              onChange={(e) => {
                setTeamName(e.target.value);
                setError("");
              }}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && playerName.trim() && teamName.trim()) {
                  handleSubmit();
                }
              }}
              placeholder="Enter your team name"
              maxLength={30}
              className={`w-full px-4 py-3 rounded-lg border-2 ${
                error
                  ? 'border-red-500 bg-red-50'
                  : isDark
                  ? 'border-cyan-500 bg-slate-800 text-white'
                  : 'border-blue-500 bg-white text-slate-900'
              } focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                isDark ? 'focus:ring-cyan-400' : 'focus:ring-blue-400'
              }`}
            />
            <p className={`mt-2 text-xs ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
              {teamName.length}/30 characters
            </p>
          </div>
        )}

        {error && (
          <p className="text-sm text-red-500">{error}</p>
        )}

        <div className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
          <p>💡 <strong>Tip:</strong> {isCreatingTeam 
            ? "Choose a fun team name and your display name!"
            : "Enter your name as it will appear to other players."
          }</p>
        </div>
      </div>
    </Modal>
  );
}
