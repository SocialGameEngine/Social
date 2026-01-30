import { useState, useEffect } from "react";
import { Button, Card } from "@social/ui";
import { useTheme } from "../../../shared/providers/ThemeProvider";
import { supabase } from "../../../supabase/client";

interface TeamCode {
  code: string;
  teamId: string | null;
  teamName: string | null;
  memberCount: number;
  isUsed: boolean;
}

interface TeamSelectionLobbyProps {
  sessionId: string;
  sessionCode: string;
  onTeamSelect: (teamCode: string, teamName: string | null) => void;
  onBack: () => void;
  toast: (options: { title: string; description?: string; variant: "success" | "error" }) => void;
}

export function TeamSelectionLobby({
  sessionId,
  sessionCode,
  onTeamSelect,
  onBack,
  toast,
}: TeamSelectionLobbyProps) {
  const { isDark } = useTheme();
  const [teamCodes, setTeamCodes] = useState<TeamCode[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTeamCodes();
    
    // Set up real-time subscription for team updates
    const channel = supabase
      .channel(`team-codes-${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'team_codes',
          filter: `session_id=eq.${sessionId}`,
        },
        () => {
          fetchTeamCodes();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'teams',
          filter: `session_id=eq.${sessionId}`,
        },
        () => {
          fetchTeamCodes();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId]);

  const fetchTeamCodes = async () => {
    try {
      // Fetch team codes with team info
      const { data: codes, error } = await supabase
        .from('team_codes' as any)
        .select('code, team_id, is_used')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Fetch team details for used codes
      const teamIds = (codes as any[])?.filter((c: any) => c.team_id).map((c: any) => c.team_id) || [];
      let teamsMap = new Map();

      if (teamIds.length > 0) {
        const { data: teams } = await supabase
          .from('teams')
          .select('id, team_name')
          .in('id', teamIds);

        teams?.forEach(team => {
          teamsMap.set(team.id, team.team_name);
        });

        // Get member counts
        const { data: members } = await supabase
          .from('team_members' as any)
          .select('team_id')
          .in('team_id', teamIds);

        const memberCounts = new Map();
        members?.forEach(member => {
          if (member && 'team_id' in member) {
            memberCounts.set(member.team_id, (memberCounts.get(member.team_id) || 0) + 1);
          }
        });

        teamsMap.forEach((name, id) => {
          teamsMap.set(id, { name, count: memberCounts.get(id) || 0 });
        });
      }

      const processedCodes: TeamCode[] = ((codes as any[]) || []).map((code: any) => ({
        code: code.code,
        teamId: code.team_id,
        teamName: code.team_id ? teamsMap.get(code.team_id)?.name || null : null,
        memberCount: code.team_id ? teamsMap.get(code.team_id)?.count || 0 : 0,
        isUsed: code.is_used,
      }));

      setTeamCodes(processedCodes);
    } catch (error) {
      console.error('Error fetching team codes:', error);
      toast({
        title: "Failed to load teams",
        description: "Please try again",
        variant: "error"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTeamSelect = (teamCode: TeamCode) => {
    onTeamSelect(teamCode.code, teamCode.teamName);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-slate-950">
        <Card className="w-full max-w-4xl" isDark={isDark}>
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto mb-4"></div>
            <p className={isDark ? 'text-slate-400' : 'text-slate-600'}>Loading teams...</p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-950">
      <Card className="w-full max-w-4xl" isDark={isDark}>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className={`text-3xl font-black mb-2 ${isDark ? 'text-pink-400' : 'text-pink-600'}`}>
                Select Your Team
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
              <strong>Choose a team:</strong> Click an empty slot to create a new team, or click an existing team to join it.
            </p>
          </div>

          {/* Team Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {teamCodes.map((teamCode) => (
              <button
                key={teamCode.code}
                onClick={() => handleTeamSelect(teamCode)}
                className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                  teamCode.teamName
                    ? isDark
                      ? 'bg-cyan-900/40 border-cyan-400/60 hover:bg-cyan-800/60 hover:border-cyan-300'
                      : 'bg-blue-100 border-blue-300 hover:bg-blue-200 hover:border-blue-400'
                    : isDark
                    ? 'bg-slate-800/50 border-slate-600 hover:bg-slate-700/70 hover:border-slate-500'
                    : 'bg-slate-100 border-slate-300 hover:bg-slate-200 hover:border-slate-400'
                } hover:scale-105 active:scale-95`}
              >
                {/* Team Code */}
                <div className={`text-xl font-mono font-bold mb-2 ${
                  teamCode.teamName
                    ? isDark ? 'text-cyan-300' : 'text-blue-700'
                    : isDark ? 'text-slate-400' : 'text-slate-600'
                }`}>
                  {teamCode.code}
                </div>

                {/* Team Status */}
                {teamCode.teamName ? (
                  <>
                    <div className={`text-sm font-semibold mb-1 truncate ${
                      isDark ? 'text-white' : 'text-slate-900'
                    }`}>
                      {teamCode.teamName}
                    </div>
                    <div className={`text-xs flex items-center justify-center gap-1 ${
                      isDark ? 'text-cyan-200' : 'text-blue-600'
                    }`}>
                      {Array.from({ length: Math.min(teamCode.memberCount, 4) }).map((_, i) => (
                        <span key={i}>👥</span>
                      ))}
                      {teamCode.memberCount > 4 && (
                        <span className="ml-1">+{teamCode.memberCount - 4}</span>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    <div className={`text-sm font-semibold mb-1 ${
                      isDark ? 'text-slate-500' : 'text-slate-500'
                    }`}>
                      Available
                    </div>
                    <div className={`text-xs ${
                      isDark ? 'text-slate-600' : 'text-slate-400'
                    }`}>
                      👥
                    </div>
                  </>
                )}
              </button>
            ))}
          </div>

          {/* Footer Stats */}
          <div className={`flex items-center justify-center gap-6 text-sm ${
            isDark ? 'text-slate-400' : 'text-slate-600'
          }`}>
            <div>
              <span className="font-semibold">{teamCodes.filter(t => !t.teamName).length}</span> Available
            </div>
            <div>
              <span className="font-semibold">{teamCodes.filter(t => t.teamName).length}</span> Active
            </div>
            <div>
              <span className="font-semibold">{teamCodes.length}</span> Total
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
