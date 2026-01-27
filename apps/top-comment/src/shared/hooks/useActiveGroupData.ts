import { useActiveGroupAnswers } from "./useActiveGroupAnswers";

interface UseActiveGroupDataProps {
  answers: any[];
  session: any;
  activeGroup: any;
}

/**
 * Shared active group data hook
 * Provides common active group logic across all session views
 */
export function useActiveGroupData({ answers, session, activeGroup }: UseActiveGroupDataProps) {
  const activeGroupAnswers = useActiveGroupAnswers(answers, session, activeGroup);

  return {
    activeGroupAnswers,
  };
}
