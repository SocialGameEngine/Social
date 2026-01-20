import { useMemo } from "react";
import type { Answer, Session } from "../types";

/**
 * Filters answers based on the current session status and active group
 * Used by HostPage, PresenterPage, and TeamPage for displaying relevant answers
 * 
 * @param answers - All answers in the session
 * @param session - Current session state
 * @param activeGroup - Currently active voting group
 * @param myGroup - (Optional) User's group for TeamPage filtering
 */
export function useActiveGroupAnswers(
  answers: Answer[],
  session: Session | null,
  activeGroup: { id: string } | null,
  myGroup?: { id: string } | null
): Answer[] {
  return useMemo(() => {
    if (session?.status === "vote") {
      if (activeGroup) {
        return answers.filter((answer) => answer.groupId === activeGroup.id);
      }
      // During vote phase with no activeGroup, show nothing instead of all answers
      // This prevents the "all teams appear as one group" bug
      return [];
    }
    if (myGroup) {
      return answers.filter((answer) => answer.groupId === myGroup.id);
    }
    return answers;
  }, [answers, session?.status, activeGroup, myGroup]);
}
