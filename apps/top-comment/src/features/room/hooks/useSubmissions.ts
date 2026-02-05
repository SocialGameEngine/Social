import { useState, useEffect, useCallback } from 'react';
import type { GamePhase } from '../types';

export function useSubmissions(sessionId: string | null, phase: GamePhase) {
  const [submissions, setSubmissions] = useState({
    answer: false,
    vote: false,
  });

  // Reset when session or phase changes
  useEffect(() => {
    setSubmissions({ answer: false, vote: false });
  }, [sessionId, phase]);

  const markSubmitted = useCallback((type: 'answer' | 'vote') => {
    setSubmissions(prev => ({ ...prev, [type]: true }));
  }, []);

  return { submissions, markSubmitted };
}
