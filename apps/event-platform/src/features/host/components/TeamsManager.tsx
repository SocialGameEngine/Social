import { useState, useEffect } from "react";
import { Button, Modal } from "@social/ui";
import { supabase } from "../../../supabase/client";
import { useTheme } from "../../../shared/providers/ThemeProvider";
import { hostKickMember, banPlayer } from "../../session/sessionService";
import { UserXIcon, BanIcon, CopyIcon, UsersIcon, CrownIcon } from "../../../shared/components/icons/VIBoxIcons";

interface TeamMember {
  id: string;
  user_id: string;
  player_name: string | null;
  is_captain: boolean;
  joined_at: string;
}

interface TeamWithMembers {
  id: string;
  team_name: string;
  team_code: string;
  score: number;
  uid: string | null;
  captain_id: string | null;
  team_members: TeamMember[];
}

interface TeamsManagerProps {
  sessionId: string;
  isOpen: boolean;
  onClose: () => void;
  toast: (options: { title: string; variant: "success" | "error" | "info" }) => void;
}

export function TeamsManager({ sessionId, isOpen, onClose, toast }: TeamsManagerProps) {
  const { isDark } = useTheme();
  const [teams, setTeams] = useState<TeamWithMembers[]>([]);
  const [availableCodes, setAvailableCodes] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
  const [expandedTeams, setExpandedTeams] = useState<Set<string>>(new Set());
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && sessionId) {
      fetchTeams();
      
      // Subscribe to real-time updates
      const teamsChannel = supabase
        .channel(`teams-management:${sessionId}`)
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'teams',
          filter: `session_id=eq.${sessionId}`
        }, () => {
          fetchTeams();
        })
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'team_members'
        }, () => {
          fetchTeams();
        })
        .subscribe();
      
      return () => {
        teamsChannel.unsubscribe();
      };
    }
  }, [isOpen, sessionId]);

  const fetchTeams = async () => {
    setLoading(true);
    try {
      // First, let's test the team_codes query directly
      console.log('Testing team_codes query for session:', sessionId);
      
      // Check total team_codes in database
      const { data: totalCodes, error: totalError } = await (supabase as any)
        .from('team_codes')
        .select('code, team_id, is_used, session_id')
        .limit(20); // Just get first 20 to see what's there
      
      console.log('Total team_codes in DB (first 20):', { data: totalCodes, error: totalError });
      
      // Try the exact same query as the join function
      console.log("Looking for team codes like join function does, session:", sessionId);
      const { data: allCodesData, error: allCodesError } = await supabase
        .from("team_codes")
        .select("code, team_id, is_used")
        .eq("session_id", sessionId);
      
      console.log('All team_codes result for this session:', { data: allCodesData, error: allCodesError });
      console.log('Session ID being queried:', sessionId);
      
      if (allCodesError) {
        console.error('Team codes query error:', allCodesError);
      }
      
            
      // Get all teams with their codes and members (LEFT JOIN to include teams without members)
      const { data: teamsData, error: teamsError } = await supabase
        .from('teams')
        .select(`
          id, team_name, score, uid, captain_id,
          team_members!left(
            id, user_id, player_name, is_captain, joined_at
          ),
          team_codes!left(
            code
          )
        `)
        .eq('session_id', sessionId)
        .order('joined_at', { ascending: true });
      
      if (teamsError) throw teamsError;
      
      // Get all codes (not just available ones) since all codes are assigned to teams
      console.log('All codes for this session:', allCodesData);
      
      // Transform teams data to include team_code and handle missing team_members
      const transformedTeams = (teamsData as any[])?.map(team => ({
        ...team,
        team_code: team.team_codes?.code || null,
        team_members: team.team_members || [] // Handle teams without members
      }));
      
      // Store all codes for the UI (not just available ones)
      const allCodes = allCodesData || [];
      
      console.log('Transformed teams:', transformedTeams);
      console.log('All codes:', allCodes);
      
      setTeams(transformedTeams);
      setAvailableCodes(allCodes);
    } catch (error) {
      console.error('Error fetching teams:', error);
      toast({
        title: "Failed to load teams",
        variant: "error"
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleTeam = (teamId: string) => {
    setExpandedTeams(prev => {
      const next = new Set(prev);
      if (next.has(teamId)) {
        next.delete(teamId);
      } else {
        next.add(teamId);
      }
      return next;
    });
  };

  const handleKick = async (teamId: string, userId: string, playerName: string) => {
    const actionKey = `kick-${teamId}-${userId}`;
    setActionLoading(actionKey);
    
    try {
      await hostKickMember({ sessionId, teamId, userIdToKick: userId });
      toast({
        title: `Kicked ${playerName}`,
        variant: "success"
      });
      fetchTeams();
    } catch (error) {
      console.error('Error kicking player:', error);
      toast({
        title: "Failed to kick player",
        variant: "error"
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleBan = async (teamId: string, userId: string, playerName: string) => {
    const actionKey = `ban-${teamId}-${userId}`;
    setActionLoading(actionKey);
    
    try {
      await banPlayer({ sessionId, teamId, userId });
      toast({
        title: `Banned ${playerName}`,
        variant: "success"
      });
      fetchTeams();
    } catch (error) {
      console.error('Error banning player:', error);
      toast({
        title: "Failed to ban player",
        variant: "error"
      });
    } finally {
      setActionLoading(null);
    }
  };

  const copyCode = (code: string | null | undefined) => {
    if (!code) {
      toast({
        title: "No team code available",
        variant: "error"
      });
      return;
    }
    
    navigator.clipboard.writeText(code);
    toast({
      title: `Code ${code} copied`,
      variant: "success"
    });
  };

  const copyAllCodes = () => {
    console.log('All codes:', availableCodes);
    
    // Use all codes from team_codes table
    const codesString = availableCodes
      .map((code: any) => code.code)
      .join('\n');
    
    console.log('Codes string:', codesString);
    
    if (codesString) {
      navigator.clipboard.writeText(codesString);
      toast({
        title: "All team codes copied",
        variant: "success"
      });
    } else {
      toast({
        title: "No codes found",
        variant: "info"
      });
    }
  };

  const activeTeams = teams.filter(t => t.uid !== null);
  const totalPlayers = activeTeams.reduce((sum, t) => sum + (t.team_members?.length || 0), 0);

  return (
    <Modal open={isOpen} onClose={onClose} title="Teams Management" isDark={isDark}>
      <div className="space-y-4">
        {/* Summary */}
        <div className={`p-4 rounded-lg ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`}>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className={`text-2xl font-bold ${isDark ? 'text-cyan-400' : 'text-slate-900'}`}>
                {activeTeams.length}
              </div>
              <div className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                Active Teams
              </div>
            </div>
            <div>
              <div className={`text-2xl font-bold ${isDark ? 'text-green-400' : 'text-green-600'}`}>
                {totalPlayers}
              </div>
              <div className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                Players
              </div>
            </div>
            <div>
              <div className={`text-2xl font-bold ${isDark ? 'text-purple-400' : 'text-purple-600'}`}>
                {availableCodes.length}
              </div>
              <div className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                Available
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button onClick={copyAllCodes} variant="secondary" size="sm">
            <CopyIcon className="w-4 h-4 mr-2" />
            Copy All Team Codes
          </Button>
          <Button onClick={fetchTeams} variant="ghost" size="sm" disabled={loading}>
            {loading ? "Refreshing..." : "Refresh"}
          </Button>
        </div>

        {/* Active Teams */}
        {activeTeams.length > 0 && (
          <div>
            <h3 className={`text-lg font-semibold mb-3 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Active Teams ({activeTeams.length})
            </h3>
            <div className="space-y-2">
              {activeTeams.map((team) => {
                const isExpanded = expandedTeams.has(team.id);
                const memberCount = team.team_members?.length || 0;
                
                return (
                  <div
                    key={team.id}
                    className={`rounded-lg border ${
                      isDark 
                        ? 'bg-slate-800 border-slate-600' 
                        : 'bg-white border-slate-300'
                    }`}
                  >
                    {/* Team Header */}
                    <button
                      onClick={() => toggleTeam(team.id)}
                      className="w-full p-4 flex items-center justify-between hover:opacity-80 transition-opacity"
                    >
                      <div className="flex items-center gap-3">
                        <UsersIcon className={`w-5 h-5 ${isDark ? 'text-cyan-400' : 'text-blue-600'}`} />
                        <div className="text-left">
                          <div className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                            {team.team_name}
                          </div>
                          <div className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                            Code: {team.team_code} • {memberCount} member{memberCount !== 1 ? 's' : ''} • {team.score} pts
                          </div>
                        </div>
                      </div>
                      <div className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                        {isExpanded ? '▼' : '▶'}
                      </div>
                    </button>

                    {/* Team Members (Expanded) */}
                    {isExpanded && team.team_members && team.team_members.length > 0 && (
                      <div className={`border-t px-4 py-3 space-y-2 ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
                        {team.team_members
                          .sort((a, b) => (b.is_captain ? 1 : 0) - (a.is_captain ? 1 : 0))
                          .map((member) => (
                            <div
                              key={member.id}
                              className={`flex items-center justify-between p-2 rounded ${
                                isDark ? 'bg-slate-700/50' : 'bg-slate-50'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                {member.is_captain && (
                                  <CrownIcon className="w-4 h-4 text-yellow-500" />
                                )}
                                <span className={isDark ? 'text-slate-200' : 'text-slate-800'}>
                                  {member.player_name || 'Anonymous'}
                                  {member.is_captain && (
                                    <span className="ml-2 text-xs text-yellow-500">(Captain)</span>
                                  )}
                                </span>
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  onClick={() => handleKick(team.id, member.user_id, member.player_name || 'player')}
                                  variant="ghost"
                                  size="sm"
                                  disabled={actionLoading === `kick-${team.id}-${member.user_id}`}
                                >
                                  <UserXIcon className="w-4 h-4" />
                                </Button>
                                <Button
                                  onClick={() => handleBan(team.id, member.user_id, member.player_name || 'player')}
                                  variant="ghost"
                                  size="sm"
                                  disabled={actionLoading === `ban-${team.id}-${member.user_id}`}
                                  className="text-red-500 hover:text-red-600"
                                >
                                  <BanIcon className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Team Codes */}
        {availableCodes.length > 0 && (
          <div>
            <h3 className={`text-lg font-semibold mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Team Codes ({availableCodes.length})
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {/* Available codes from team_codes table */}
              {availableCodes.map((codeData: any, index: number) => (
                <button
                  key={codeData.code}
                  onClick={() => copyCode(codeData.code)}
                  className={`p-3 rounded-lg border text-center transition-all hover:scale-105 ${
                    isDark 
                      ? 'bg-slate-800 border-slate-600 hover:border-cyan-500 text-cyan-400' 
                      : 'bg-white border-slate-300 hover:border-blue-500 text-blue-600'
                  }`}
                >
                  <div className="font-mono text-lg font-bold">{codeData.code}</div>
                  <div className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    Team {index + 1}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {loading && teams.length === 0 && (
          <div className="text-center py-8">
            <div className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              Loading teams...
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
