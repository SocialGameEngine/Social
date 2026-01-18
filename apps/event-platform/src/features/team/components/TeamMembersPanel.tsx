import { useState, useEffect } from "react";
import { Button } from "@social/ui";
import { supabase } from "../../../supabase/client";
import { useTheme } from "../../../shared/providers/ThemeProvider";
import { captainKickMember, captainPromoteMember } from "../../session/sessionService";
import { UserXIcon, CopyIcon, CrownIcon, CrownIcon as CrownTransferIcon } from "../../../shared/components/icons/VIBoxIcons";

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
  toast: (options: { title: string; variant: "success" | "error" | "info" }) => void;
}

export function TeamMembersPanel({
  sessionId,
  teamId,
  currentUserId,
  isCaptain,
  teamCode,
  toast
}: TeamMembersPanelProps) {
  const { isDark } = useTheme();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [kickingUserId, setKickingUserId] = useState<string | null>(null);
  const [promotingUserId, setPromotingUserId] = useState<string | null>(null);
  const [actualTeamCode, setActualTeamCode] = useState<string>(teamCode);

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
      setMembers(data || []);

      // Also fetch the team code from team_codes table
      const { data: codeData, error: codeError } = await (supabase as any)
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
          <CopyIcon className="w-4 h-4 mr-2" />
          Code: {actualTeamCode || teamCode}
        </Button>
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
                      <CrownIcon className="w-4 h-4 text-yellow-500" />
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
                          <CrownIcon className="w-4 h-4" />
                          {promotingUserId === member.user_id ? 'Passing...' : 'Pass'}
                        </Button>
                      )}
                      <Button
                        onClick={() => handleKickMember(member.user_id, member.player_name || 'player')}
                        variant="ghost"
                        size="sm"
                        disabled={kickingUserId === member.user_id}
                        className="text-red-500 hover:text-red-600"
                      >
                        <UserXIcon className="w-4 h-4" />
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
          <li>You can remove team members (but not yourself)</li>
          <li>You can pass captain role to other team members</li>
          <li>Share the team code to invite more players</li>
        </ul>
      </div>
    </div>
  );
}
