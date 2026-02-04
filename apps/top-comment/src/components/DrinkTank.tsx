import { getMascotById } from "../shared/mascots";
import type { Team } from "../shared/types";
import type { RoomMembership } from "../shared/types";

// Card size for the grid (larger cards = tighter look between cards)
const CARD_SIZE = "clamp(88px, 11vw, 148px)";
const MASCOT_SIZE = "clamp(68px, 9vw, 120px)";

// Player/team display styles — no card background
const teamCardStyles = `
  .team-grid-card {
    border-radius: 1rem;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    flex-shrink: 0;
  }

  .team-grid-name {
    color: rgb(207, 250, 254);
  }
`;

interface DrinkTankProps {
  roomMemberships?: RoomMembership[];
  teams?: Team[]; // Keep for backward compatibility
  className?: string;
}

/**
 * Convert room membership to team format for DrinkTank logic
 */
function roomMembershipToTeam(membership: RoomMembership): Team {
  return {
    id: membership.id,
    uid: membership.userId,
    teamName: membership.playerName,
    isHost: membership.isHost,
    score: 0, // Not used in lobby display
    joinedAt: membership.joinedAt,
    lastActiveAt: membership.lastActiveAt,
    mascotId: membership.mascotId,
  };
}

/**
 * Renders team cards in join order: first joiner on the left, pushed right
 * as more join; when the row hits the container edge, cards wrap to the next row.
 */
export function DrinkTank({ roomMemberships, teams, className = "" }: DrinkTankProps) {
  // Use roomMemberships if provided, fallback to teams for backward compatibility
  const displayData = roomMemberships ? 
    roomMemberships.map(roomMembershipToTeam) : 
    teams || [];
    
  const sortedByJoin = [...displayData].sort(
    (a, b) => new Date(a.joinedAt).getTime() - new Date(b.joinedAt).getTime()
  );
  const displayOrder = [...sortedByJoin].reverse();

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: teamCardStyles }} />
      <div
        className={`grid gap-4 ${className}`}
        style={{
          columnGap: "clamp(2px, 0.4vw, 6px)",
          rowGap: "clamp(14px, 2.5vw, 28px)",
          gridTemplateColumns: "repeat(3, auto)",
        }}
      >
        {displayOrder.map((team) => {
          const mascot = getMascotById(team.mascotId);
          return (
            <div
              key={team.id}
              className="flex flex-col items-center"
              style={{ flexShrink: 0 }}
            >
              <div
                className="team-grid-card relative"
                style={{
                  width: CARD_SIZE,
                  height: CARD_SIZE,
                }}
              >
                <div className="relative z-10 flex items-center justify-center w-full h-full">
                  {mascot ? (
                    <img
                      src={mascot.path}
                      alt={mascot.name}
                      className="object-contain"
                      style={{
                        width: MASCOT_SIZE,
                        height: MASCOT_SIZE,
                        filter: "drop-shadow(0 2px 4px rgba(6, 182, 212, 0.3))",
                      }}
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                        const parent = e.currentTarget.parentElement;
                        if (parent) {
                          parent.textContent = team.teamName
                            .charAt(0)
                            .toUpperCase();
                          parent.className =
                            "font-bold text-cyan-400 flex items-center justify-center w-full h-full drop-shadow-[0_2px_4px_rgba(6,182,212,0.4)]";
                          (parent as HTMLElement).style.fontSize = "clamp(1.75rem, 6vw, 3.5rem)";
                        }
                      }}
                    />
                  ) : (
                    <span
                      className="font-bold text-cyan-400 drop-shadow-[0_2px_4px_rgba(6,182,212,0.4)]"
                      style={{ fontSize: "clamp(1.75rem, 6vw, 3.5rem)" }}
                    >
                      {team.teamName.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
              </div>
              <span
                className="team-grid-name text-xs sm:text-sm font-semibold text-cyan-100 rounded-full px-3 py-1.5 sm:px-4 sm:py-2 whitespace-nowrap"
                style={{ marginTop: "clamp(6px, 1vw, 12px)" }}
              >
                {team.teamName}
              </span>
            </div>
          );
        })}
      </div>
    </>
  );
}
