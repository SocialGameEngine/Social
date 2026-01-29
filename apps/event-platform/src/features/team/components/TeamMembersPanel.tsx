import { useState, useEffect } from "react";
import { Button } from "@social/ui";
import { supabase } from "../../../supabase/client";
import { useTheme } from "../../../shared/providers/ThemeProvider";
import { captainKickMember, captainPromoteMember, captainUpdateTeamName } from "../../session/sessionService";

interface TeamMember {
  id: string;
  user_id: string;
  player_name: string | null;
  is_captain: boolean;
  joined_at: string;
}

interface TeamMembersPanelProps {
  sessionId: string;
  teamId: string;
  currentUserId: string | undefined;
  isCaptain: boolean;
  teamCode: string;
  roomCode?: string;
  teamName: string;
  sessionStatus?: string;
  toast: (options: { title: string; variant: "success" | "error" | "info" }) => void;
}

export function TeamMembersPanel({
  sessionId,
  teamId,
  currentUserId,
  isCaptain,
  teamCode,
  teamName,
  sessionStatus,
  toast
}: TeamMembersPanelProps) {
  const { isDark } = useTheme();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [kickingUserId, setKickingUserId] = useState<string | null>(null);
  const [promotingUserId, setPromotingUserId] = useState<string | null>(null);
  const [actualTeamCode, setActualTeamCode] = useState<string>(teamCode);
  const [isEditingTeamName, setIsEditingTeamName] = useState(false);
  const [newTeamName, setNewTeamName] = useState(teamName);
  const [isUpdatingTeamName, setIsUpdatingTeamName] = useState(false);
  
  const canChangeTeamName = sessionStatus === 'lobby';

  useEffect(() => {
    if (teamId) {
      fetchMembers();
      
      // Subscribe to real-time updates
      const channel = supabase
        .channel(`team-members:${teamId}`)
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'team_members',
          filter: `team_id=eq.${teamId}`
        }, () => {
          fetchMembers();
        })
        .subscribe();
      
      return () => {
        channel.unsubscribe();
      };
    }
  }, [teamId]);

  const fetchMembers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('team_members')
        .select('id, user_id, player_name, is_captain, joined_at')
        .eq('team_id', teamId)
        .order('joined_at', { ascending: true });
      
      if (error) throw error;
      setMembers((data || []) as TeamMember[]);

      // Also fetch the team code from team_codes table
      const { data: codeData } = await (supabase as any)
        .from('team_codes')
        .select('code')
        .eq('team_id', teamId)
        .single();
      
      if (codeData) {
        setActualTeamCode(codeData.code);
      }
    } catch (error) {
      console.error('Error fetching team members:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleKickMember = async (userIdToKick: string, playerName: string) => {
    setKickingUserId(userIdToKick);
    
    try {
      await captainKickMember({ sessionId, teamId, userIdToKick });
      toast({
        title: `Removed ${playerName} from team`,
        variant: "success"
      });
      fetchMembers();
    } catch (error) {
      console.error('Error kicking member:', error);
      toast({
        title: "Failed to remove player",
        variant: "error"
      });
    } finally {
      setKickingUserId(null);
    }
  };

  const handlePromoteMember = async (userIdToPromote: string, playerName: string) => {
    setPromotingUserId(userIdToPromote);
    
    try {
      await captainPromoteMember({ sessionId, teamId, userIdToPromote });
      toast({
        title: `Passed captain role to ${playerName}`,
        variant: "success"
      });
      fetchMembers();
    } catch (error) {
      console.error('Error promoting member:', error);
      toast({
        title: "Failed to promote player",
        variant: "error"
      });
    } finally {
      setPromotingUserId(null);
    }
  };

  const copyTeamCode = () => {
    const codeToCopy = actualTeamCode || teamCode;
    navigator.clipboard.writeText(codeToCopy);
    toast({
      title: `Team code ${codeToCopy} copied`,
      variant: "success"
    });
  };

  const handleUpdateTeamName = async () => {
    const trimmedName = newTeamName.trim();
    
    if (trimmedName.length < 2 || trimmedName.length > 15) {
      toast({
        title: "Team name must be between 2 and 15 characters",
        variant: "error"
      });
      return;
    }
    
    if (trimmedName === teamName) {
      setIsEditingTeamName(false);
      return;
    }
    
    setIsUpdatingTeamName(true);
    
    try {
      await captainUpdateTeamName({ sessionId, teamId, teamName: trimmedName });
      toast({
        title: `Team name updated to "${trimmedName}"`,
        variant: "success"
      });
      setIsEditingTeamName(false);
      // The team name will be updated via real-time subscription
    } catch (error) {
      console.error('Error updating team name:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to update team name';
      toast({
        title: errorMessage,
        variant: "error"
      });
      setNewTeamName(teamName); // Reset on error
    } finally {
      setIsUpdatingTeamName(false);
    }
  };

  // Update local team name when prop changes
  useEffect(() => {
    if (!isEditingTeamName) {
      setNewTeamName(teamName);
    }
  }, [teamName, isEditingTeamName]);

  // Only show panel if user is captain
  if (!isCaptain) {
    return null;
  }

  return (
    <div className={`rounded-lg border p-4 ${
      isDark 
        ? 'bg-slate-800 border-slate-600' 
        : 'bg-white border-slate-300'
    }`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
          Team Members (Captain Controls)
        </h3>
        <Button onClick={copyTeamCode} variant="ghost" size="sm">
          Room code: {actualTeamCode || teamCode}
        </Button>
      </div>

      {/* Team Name Change Section */}
      <div className={`mb-4 p-3 rounded ${isDark ? 'bg-slate-700/50' : 'bg-slate-50'}`}>
        <div className="flex items-center gap-2 mb-2">
          <label className={`text-sm font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
            Team Name:
          </label>
          {isEditingTeamName && canChangeTeamName ? (
            <div className="flex items-center gap-2 flex-1">
              <input
                type="text"
                value={newTeamName}
                onChange={(e) => setNewTeamName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleUpdateTeamName();
                  } else if (e.key === 'Escape') {
                    setNewTeamName(teamName);
                    setIsEditingTeamName(false);
                  }
                }}
                maxLength={15}
                disabled={isUpdatingTeamName}
                className={`flex-1 px-2 py-1 rounded text-sm border ${
                  isDark 
                    ? 'bg-slate-800 border-slate-600 text-white' 
                    : 'bg-white border-slate-300 text-slate-900'
                } focus:outline-none focus:ring-2 focus:ring-cyan-500`}
                autoFocus
              />
              <Button
                onClick={handleUpdateTeamName}
                size="sm"
                disabled={isUpdatingTeamName || newTeamName.trim().length < 2}
                isLoading={isUpdatingTeamName}
              >
                Save
              </Button>
              <Button
                onClick={() => {
                  setNewTeamName(teamName);
                  setIsEditingTeamName(false);
                }}
                variant="ghost"
                size="sm"
                disabled={isUpdatingTeamName}
              >
                Cancel
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2 flex-1">
              <span className={`text-sm ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                {teamName}
              </span>
              {canChangeTeamName && (
                <Button
                  onClick={() => setIsEditingTeamName(true)}
                  variant="ghost"
                  size="sm"
                  className="text-cyan-500 hover:text-cyan-400"
                >
                  Change
                </Button>
              )}
              {!canChangeTeamName && (
                <span className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
                  (Locked after game starts)
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {loading && members.length === 0 ? (
        <div className={`text-center py-4 text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
          Loading members...
        </div>
      ) : (
        <div className="space-y-2">
          {members
            .sort((a, b) => (b.is_captain ? 1 : 0) - (a.is_captain ? 1 : 0))
            .map((member) => {
              const isCurrentUser = member.user_id === currentUserId;
              
              return (
                <div
                  key={member.id}
                  className={`flex items-center justify-between p-3 rounded ${
                    isDark ? 'bg-slate-700/50' : 'bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {member.is_captain && (
                      <span className="text-yellow-500">👑</span>
                    )}
                    <span className={isDark ? 'text-slate-200' : 'text-slate-800'}>
                      {member.player_name || 'Anonymous'}
                      {isCurrentUser && (
                        <span className="ml-2 text-xs text-cyan-500">(You)</span>
                      )}
                      {member.is_captain && (
                        <span className="ml-2 text-xs text-yellow-500">(Captain)</span>
                      )}
                    </span>
                  </div>
                  
                  {!isCurrentUser && (
                    <div className="flex gap-1">
                      {!member.is_captain && (
                        <Button
                          onClick={() => handlePromoteMember(member.user_id, member.player_name || 'player')}
                          variant="ghost"
                          size="sm"
                          disabled={promotingUserId === member.user_id}
                          className="text-yellow-500 hover:text-yellow-600"
                          title="Pass captain role"
                        >
                          <span className="text-yellow-500">👑</span>
                          {promotingUserId === member.user_id ? 'Promoting...' : 'Promote'}
                        </Button>
                      )}
                      <Button
                        onClick={() => handleKickMember(member.user_id, member.player_name || 'player')}
                        variant="ghost"
                        size="sm"
                        disabled={kickingUserId === member.user_id}
                        className="text-red-500 hover:text-red-600"
                      >
                        <span className="text-red-500">🚫</span>
                        {kickingUserId === member.user_id ? 'Removing...' : 'Remove'}
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
        </div>
      )}

      <div className={`mt-4 p-3 rounded text-sm ${
        isDark ? 'bg-slate-700/50 text-slate-300' : 'bg-slate-100 text-slate-600'
      }`}>
        <p className="font-semibold mb-1">Captain Controls:</p>
        <ul className="list-disc list-inside space-y-1 text-xs">
          <li>You can change the team name (only before the game starts)</li>
          <li>You can remove team members (but not yourself)</li>
          <li>You can pass captain role to other team members</li>
          <li>Share the team code to invite more players</li>
        </ul>
      </div>
    </div>
  );
}
