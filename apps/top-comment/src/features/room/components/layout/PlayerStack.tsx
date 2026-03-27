interface PlayerStackProps {
  playerInitials: string[];
  extraPlayers: number;
}

export function PlayerStack({ playerInitials, extraPlayers }: PlayerStackProps) {
  return (
    <div className="chaos-player-stack" aria-hidden="true">
      {playerInitials.slice(0, 3).map((initials, index) => (
        <span key={index} className="chaos-player-token">
          {initials}
        </span>
      ))}
      {extraPlayers > 0 && (
        <span className="chaos-player-stack-more">+{extraPlayers}</span>
      )}
    </div>
  );
}
