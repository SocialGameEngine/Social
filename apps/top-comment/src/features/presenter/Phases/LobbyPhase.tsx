import { StatusSummaryCard } from "./StatusSummaryCard";
import { DrinkTank } from "../../../components/DrinkTank";
import type { Session, Team } from "../../../shared/types";

interface LobbyPhaseProps {
  session: Session;
  presenterHeading: string | null;
  groupStatusLabel: string;
  totalSeconds: number;
  players: Team[];
}

export function LobbyPhase({
  session,
  presenterHeading,
  groupStatusLabel,
  totalSeconds,
  players,
}: LobbyPhaseProps) {
  return (
    <>
      <StatusSummaryCard
        session={session}
        presenterHeading={presenterHeading}
        groupStatusLabel={groupStatusLabel}
        totalSeconds={totalSeconds}
      />

      {/* Floating mascot drink tank */}
      <DrinkTank teams={players} className="mt-8" />
    </>
  );
}

