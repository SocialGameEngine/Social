import { useState } from "react";
import { Button, Card, FormField } from "@social/ui";
import { useTheme } from "../../../shared/providers/ThemeProvider";
import { formatCode } from "../../../shared/constants";
import { supabase } from "../../../supabase/client";

interface TeamCodeEntryProps {
  sessionId: string;
  sessionCode: string;
  onTeamSelect: (teamCode: string, teamName: string | null) => void;
  onBack: () => void;
  toast: (options: { title: string; description?: string; variant: "success" | "error" }) => void;
}

export function TeamCodeEntry({
  sessionId,
  sessionCode,
  onTeamSelect,
  onBack,
}: TeamCodeEntryProps) {
  const { isDark } = useTheme();
  const [teamCode, setTeamCode] = useState("");
  const [teamName, setTeamName] = useState("");
  const [isJoining, setIsJoining] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsJoining(true);
    setErrors({});

    // Validate team code format (4 characters)
    if (!teamCode || teamCode.trim().length !== 4) {
      setErrors({ teamCode: "Team code must be 4 characters" });
      setIsJoining(false);
      return;
    }

    // Validate team name
    if (!teamName || teamName.trim().length === 0) {
      setErrors({ teamName: "Team name is required" });
      setIsJoining(false);
      return;
    }

    // Validate team code exists in this session
    try {
      const { data: codeData, error: codeError } = await (supabase as any)
        .from('team_codes')
        .select('code, team_id')
        .eq('session_id', sessionId)
        .eq('code', teamCode.toUpperCase())
        .single();

      if (codeError || !codeData) {
        setErrors({ teamCode: "Invalid team code" });
        setIsJoining(false);
        return;
      }

      // Proceed with team selection
      onTeamSelect(codeData.code, teamName.trim());
    } catch (error) {
      console.error('Error validating team code:', error);
      setErrors({ teamCode: "Failed to validate team code" });
      setIsJoining(false);
    }
  };

  const isDisabled = !teamCode || teamCode.trim().length !== 4 || !teamName || teamName.trim().length === 0;

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-950">
      <Card className="w-full max-w-md" isDark={isDark}>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className={`text-3xl font-black mb-2 ${isDark ? 'text-pink-400' : 'text-pink-600'}`}>
                Enter Team Code
              </h1>
              <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                Room: <span className="font-mono font-bold">{sessionCode}</span>
              </p>
            </div>
            <Button variant="ghost" onClick={onBack}>
              ← Back
            </Button>
          </div>

          {/* Instructions */}
          <div className={`p-4 rounded-lg ${isDark ? 'bg-cyan-900/30 border border-cyan-400/30' : 'bg-blue-50 border border-blue-200'}`}>
            <p className={`text-sm ${isDark ? 'text-cyan-100' : 'text-blue-900'}`}>
              <strong>Enter your team code:</strong> Ask your host for the 4-digit team code to join their team.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <FormField
              label="Team code"
              name="teamCode"
              placeholder="XXXX"
              value={teamCode}
              onChange={(e) => setTeamCode(formatCode(e.target.value))}
              inputMode="text"
              autoComplete="off"
              error={errors.teamCode}
              maxLength={4}
              isDark={isDark}
              className="text-center text-xl font-mono"
            />

            <FormField
              label="Team Name"
              name="teamName"
              placeholder="Enter team name"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              error={errors.teamName}
              maxLength={10}
              isDark={isDark}
            />

            <Button 
              type="submit" 
              fullWidth 
              isLoading={isJoining} 
              disabled={isDisabled}
            >
              Join Team
            </Button>
          </form>

          {/* Help text */}
          <div className={`text-center text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
            <p>Team codes are 4 digits and case-insensitive</p>
            <p>Ask your host for the team code to join</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
