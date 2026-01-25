import { useMemo } from "react";
import type { Answer } from "../types";

/**
 * Groups answers by their group ID for quick lookup
 * Used by HostPage and PresenterPage for organizing answers by voting groups
 */
export function useAnswersByGroup(answers: Answer[]): Map<string, Answer[]> {
  return useMemo(() => {
    const map = new Map<string, Answer[]>();
    answers.forEach((answer) => {
      const list = map.get(answer.groupId) ?? [];
      list.push(answer);
      map.set(answer.groupId, list);
    });
    return map;
  }, [answers]);
}
