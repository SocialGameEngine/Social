import { Card } from "@social/ui";
import { useTheme } from "../../../shared/providers/ThemeProvider";
import { useAuth } from "../../../shared/providers/AuthContext";

interface TeamMember {
  id: string;
  team_id: string;
  user_id: string;
  player_name?: string;
  is_captain: boolean;
  joined_at: string;
}

interface TeamMembersCardProps {
  teamMembers: TeamMember[];
  teamName: string;
}

export function TeamMembersCard({ teamMembers, teamName }: TeamMembersCardProps) {
  const { isDark } = useTheme();
  const { user } = useAuth();

  // Only log if there are captain status issues
  const captainCount = teamMembers.filter(m => m.is_captain).length;
  if (captainCount !== 1) {
    console.warn("Captain status issue detected:", { 
      teamName, 
      captainCount, 
      members: teamMembers.map(m => ({ 
        user_id: m.user_id, 
        player_name: m.player_name, 
        is_captain: m.is_captain 
      }))
    });
  }

  const sortedMembers = [...teamMembers].sort((a, b) => {
    // Captain first, then by join time
    if (a.is_captain && !b.is_captain) return -1;
    if (!a.is_captain && b.is_captain) return 1;
    return new Date(a.joined_at).getTime() - new Date(b.joined_at).getTime();
  });

  const isCurrentUser = (member: TeamMember) => {
    // For authenticated users, check user_id match
    if (user?.id && member.user_id) {
      return member.user_id === user.id;
    }
    // For anonymous users, both user_id will be NULL
    // We can't reliably identify anonymous users, so return false
    return false;
  };

  return (
    <Card className="space-y-3" isDark={isDark}>
      <div className="space-y-2">
        <h3 className={`text-lg font-semibold ${!isDark ? 'text-slate-900' : 'text-cyan-300'}`}>
          {teamName}
        </h3>
        <p className={`text-sm ${!isDark ? 'text-slate-600' : 'text-cyan-300/70'}`}>
          {teamMembers.length} member{teamMembers.length !== 1 ? 's' : ''}
        </p>
      </div>
      
      <div className="space-y-2">
        {sortedMembers.map((member) => (
          <div
            key={`${member.id}-${member.user_id}`}
            className={`flex items-center justify-between p-2 rounded-lg ${
              !isDark 
                ? 'bg-slate-50 border border-slate-200' 
                : 'bg-cyan-900/20 border border-cyan-400/30'
            } ${isCurrentUser(member) ? 'ring-2 ring-blue-400' : ''}`}
          >
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${
                member.is_captain 
                  ? 'bg-yellow-400' 
                  : 'bg-blue-400'
              }`} />
              <span className={`text-sm font-medium ${
                !isDark ? 'text-slate-900' : 'text-white'
              }`}>
                {member.player_name || (member.user_id ? `Player ${member.user_id.substring(0, 8)}` : 'Anonymous Player')}
              </span>
              <span className={`text-xs px-2 py-1 rounded-full ${
                !isDark 
                  ? member.is_captain 
                    ? 'bg-yellow-100 text-yellow-700'
                    : 'bg-gray-100 text-gray-600'
                  : member.is_captain
                    ? 'bg-yellow-900/30 text-yellow-300'
                    : 'bg-gray-900/30 text-gray-300'
              }`}>
                {member.is_captain ? '⭐ Captain' : 'Member'}
              </span>
              {isCurrentUser(member) && (
                <span className={`text-xs px-2 py-1 rounded-full ${
                  !isDark 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'bg-blue-900/30 text-blue-300'
                }`}>
                  You
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
      
      {teamMembers.length === 0 && (
        <div className={`text-center py-4 text-sm ${
          !isDark ? 'text-slate-500' : 'text-cyan-300/60'
        }`}>
          No team members yet
        </div>
      )}
    </Card>
  );
}
