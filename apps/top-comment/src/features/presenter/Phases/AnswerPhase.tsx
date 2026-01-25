import { GroupCard } from "@social/ui";
import type { RoundGroup } from "../../../shared/types";

interface AnswerPhaseProps {
  roundGroups: RoundGroup[];
  teamLookup: Map<string, string>;
  isDark?: boolean;
}

export function AnswerPhase({
  roundGroups,
  teamLookup,
  isDark = false,
}: AnswerPhaseProps) {
  return (
    <>
      {roundGroups.length ? (
        <section className="grid gap-4 lg:grid-cols-2">
          {roundGroups.map((group, index) => (
            <GroupCard
              key={group.id}
              group={group}
              index={index}
              teamLookup={teamLookup}
              variant="presenter"
              isDark={isDark}
            />
          ))}
        </section>
      ) : null}
    </>
  );
}

