import { describe, it, expect } from 'vitest';
import { SessionStateMachine } from '../SessionStateMachine';
import type { Session, SessionStatus, StateMachineContext } from '../../types/domain.types';

// Helper to create a minimal session for testing
function makeSession(overrides: Partial<Session> = {}): Session {
  return {
    id: 'sess-1',
    code: 'ABC123',
    hostUid: 'host-1',
    status: 'lobby',
    roundIndex: 0,
    rounds: [{ groups: [{ id: 'g1', prompt: 'Test?', teamIds: ['t1', 't2'] }] }],
    voteGroupIndex: null,
    createdAt: new Date().toISOString(),
    settings: { answerSecs: 60, voteSecs: 30, resultsSecs: 15, maxTeams: 8 },
    autoAssignedPlayers: [],
    ...overrides,
  };
}

describe('SessionStateMachine', () => {
  // ── canTransition ──────────────────────────────────────────────
  describe('canTransition', () => {
    it('allows lobby → answer', () => {
      expect(SessionStateMachine.canTransition('lobby', 'answer')).toBe(true);
    });
    it('allows lobby → ended', () => {
      expect(SessionStateMachine.canTransition('lobby', 'ended')).toBe(true);
    });
    it('blocks lobby → vote', () => {
      expect(SessionStateMachine.canTransition('lobby', 'vote')).toBe(false);
    });
    it('allows answer → vote', () => {
      expect(SessionStateMachine.canTransition('answer', 'vote')).toBe(true);
    });
    it('allows answer → ended', () => {
      expect(SessionStateMachine.canTransition('answer', 'ended')).toBe(true);
    });
    it('blocks answer → lobby', () => {
      expect(SessionStateMachine.canTransition('answer', 'lobby')).toBe(false);
    });
    it('allows vote → results', () => {
      expect(SessionStateMachine.canTransition('vote', 'results')).toBe(true);
    });
    it('allows results → answer (next round)', () => {
      expect(SessionStateMachine.canTransition('results', 'answer')).toBe(true);
    });
    it('allows results → vote (next group)', () => {
      expect(SessionStateMachine.canTransition('results', 'vote')).toBe(true);
    });
    it('blocks ended → anything', () => {
      const phases: SessionStatus[] = ['lobby', 'answer', 'vote', 'results', 'ended'];
      phases.forEach(p => {
        expect(SessionStateMachine.canTransition('ended', p)).toBe(false);
      });
    });
  });

  // ── getPossibleNextStates ──────────────────────────────────────
  describe('getPossibleNextStates', () => {
    it('returns [answer, ended] for lobby', () => {
      expect(SessionStateMachine.getPossibleNextStates('lobby')).toEqual(['answer', 'ended']);
    });
    it('returns [] for ended', () => {
      expect(SessionStateMachine.getPossibleNextStates('ended')).toEqual([]);
    });
    it('returns [answer, vote, ended] for results', () => {
      expect(SessionStateMachine.getPossibleNextStates('results')).toEqual(['answer', 'vote', 'ended']);
    });
  });

  // ── getNextPhase ───────────────────────────────────────────────
  describe('getNextPhase', () => {
    const baseCtx: StateMachineContext = {
      playerCount: 3,
      hasAnswers: false,
      hasVotes: false,
      currentRoundComplete: false,
      allRoundsComplete: false,
    };

    it('returns answer from lobby when enough players', () => {
      expect(SessionStateMachine.getNextPhase('lobby', baseCtx)).toBe('answer');
    });
    it('returns null from lobby when not enough players', () => {
      expect(SessionStateMachine.getNextPhase('lobby', { ...baseCtx, playerCount: 1 })).toBeNull();
    });
    it('returns vote from answer when answers exist', () => {
      expect(SessionStateMachine.getNextPhase('answer', { ...baseCtx, hasAnswers: true })).toBe('vote');
    });
    it('returns null from answer when no answers', () => {
      expect(SessionStateMachine.getNextPhase('answer', baseCtx)).toBeNull();
    });
    it('returns results from vote when votes exist', () => {
      expect(SessionStateMachine.getNextPhase('vote', { ...baseCtx, hasVotes: true })).toBe('results');
    });
    it('returns ended from results when all rounds complete', () => {
      expect(SessionStateMachine.getNextPhase('results', {
        ...baseCtx,
        currentRoundComplete: true,
        allRoundsComplete: true,
      })).toBe('ended');
    });
    it('returns answer from results when round complete but more rounds', () => {
      expect(SessionStateMachine.getNextPhase('results', {
        ...baseCtx,
        currentRoundComplete: true,
        allRoundsComplete: false,
      })).toBe('answer');
    });
    it('returns vote from results when round not complete', () => {
      expect(SessionStateMachine.getNextPhase('results', baseCtx)).toBe('vote');
    });
    it('returns null from ended', () => {
      expect(SessionStateMachine.getNextPhase('ended', baseCtx)).toBeNull();
    });
  });

  // ── buildContext ────────────────────────────────────────────────
  describe('buildContext', () => {
    it('returns zero context for null session', () => {
      const ctx = SessionStateMachine.buildContext(null, [], [], []);
      expect(ctx).toEqual({
        playerCount: 0,
        hasAnswers: false,
        hasVotes: false,
        currentRoundComplete: false,
        allRoundsComplete: false,
      });
    });

    it('counts non-host players', () => {
      const session = makeSession();
      const teams = [
        { id: 't1', isHost: true },
        { id: 't2', isHost: false },
        { id: 't3', isHost: false },
      ];
      const ctx = SessionStateMachine.buildContext(session, teams, [], []);
      expect(ctx.playerCount).toBe(2);
    });

    it('detects answers for current round', () => {
      const session = makeSession({ roundIndex: 1 });
      const answers = [{ roundIndex: 0 }, { roundIndex: 1 }];
      const ctx = SessionStateMachine.buildContext(session, [], answers, []);
      expect(ctx.hasAnswers).toBe(true);
    });

    it('ignores answers from other rounds', () => {
      const session = makeSession({ roundIndex: 2 });
      const answers = [{ roundIndex: 0 }, { roundIndex: 1 }];
      const ctx = SessionStateMachine.buildContext(session, [], answers, []);
      expect(ctx.hasAnswers).toBe(false);
    });
  });

  // ── validateTransition ─────────────────────────────────────────
  describe('validateTransition', () => {
    it('rejects null session', () => {
      const result = SessionStateMachine.validateTransition(null, 'answer', 3);
      expect(result.canTransition).toBe(false);
      expect(result.reason).toBe('No active session');
    });

    it('rejects invalid transition path', () => {
      const session = makeSession({ status: 'lobby' });
      const result = SessionStateMachine.validateTransition(session, 'results', 3);
      expect(result.canTransition).toBe(false);
    });

    it('rejects answer phase with < 2 players', () => {
      const session = makeSession({ status: 'lobby' });
      const result = SessionStateMachine.validateTransition(session, 'answer', 1);
      expect(result.canTransition).toBe(false);
      expect(result.reason).toContain('2 players');
    });

    it('allows answer phase with >= 2 players', () => {
      const session = makeSession({ status: 'lobby' });
      const result = SessionStateMachine.validateTransition(session, 'answer', 2);
      expect(result.canTransition).toBe(true);
    });

    it('rejects answer when no more rounds', () => {
      const session = makeSession({ status: 'lobby', roundIndex: 1, rounds: [{ groups: [] }] });
      const result = SessionStateMachine.validateTransition(session, 'answer', 3);
      expect(result.canTransition).toBe(false);
      expect(result.reason).toContain('No more rounds');
    });

    it('rejects results when voteGroupIndex is null', () => {
      const session = makeSession({ status: 'vote', voteGroupIndex: null });
      const result = SessionStateMachine.validateTransition(session, 'results', 3);
      expect(result.canTransition).toBe(false);
      expect(result.reason).toContain('No voting group');
    });

    it('allows ending from any active phase', () => {
      const phases: SessionStatus[] = ['lobby', 'answer', 'vote', 'results'];
      phases.forEach(status => {
        const session = makeSession({ status });
        const result = SessionStateMachine.validateTransition(session, 'ended', 3);
        expect(result.canTransition).toBe(true);
      });
    });
  });

  // ── canAutoAdvance ─────────────────────────────────────────────
  describe('canAutoAdvance', () => {
    it('returns false for null session', () => {
      expect(SessionStateMachine.canAutoAdvance(null, {
        playerCount: 3, hasAnswers: false, hasVotes: false,
        currentRoundComplete: false, allRoundsComplete: false,
      })).toBe(false);
    });

    it('returns false for paused session', () => {
      const session = makeSession({ paused: true, status: 'answer' });
      expect(SessionStateMachine.canAutoAdvance(session, {
        playerCount: 3, hasAnswers: true, hasVotes: false,
        currentRoundComplete: false, allRoundsComplete: false,
      })).toBe(false);
    });
  });

  // ── getPhaseDuration ───────────────────────────────────────────
  describe('getPhaseDuration', () => {
    const settings = { answerSecs: 60, voteSecs: 30, resultsSecs: 15 };

    it('returns answerSecs for answer phase', () => {
      expect(SessionStateMachine.getPhaseDuration('answer', settings)).toBe(60);
    });
    it('returns voteSecs for vote phase', () => {
      expect(SessionStateMachine.getPhaseDuration('vote', settings)).toBe(30);
    });
    it('returns resultsSecs for results phase', () => {
      expect(SessionStateMachine.getPhaseDuration('results', settings)).toBe(15);
    });
    it('returns 0 for lobby', () => {
      expect(SessionStateMachine.getPhaseDuration('lobby', settings)).toBe(0);
    });
    it('returns 0 for ended', () => {
      expect(SessionStateMachine.getPhaseDuration('ended', settings)).toBe(0);
    });
  });

  // ── isTimedPhase ───────────────────────────────────────────────
  describe('isTimedPhase', () => {
    it('returns true for answer, vote, results', () => {
      expect(SessionStateMachine.isTimedPhase('answer')).toBe(true);
      expect(SessionStateMachine.isTimedPhase('vote')).toBe(true);
      expect(SessionStateMachine.isTimedPhase('results')).toBe(true);
    });
    it('returns false for lobby and ended', () => {
      expect(SessionStateMachine.isTimedPhase('lobby')).toBe(false);
      expect(SessionStateMachine.isTimedPhase('ended')).toBe(false);
    });
  });

  // ── getPhaseName ───────────────────────────────────────────────
  describe('getPhaseName', () => {
    it('returns human-readable names', () => {
      expect(SessionStateMachine.getPhaseName('lobby')).toBe('Lobby');
      expect(SessionStateMachine.getPhaseName('answer')).toBe('Answer Phase');
      expect(SessionStateMachine.getPhaseName('vote')).toBe('Voting Phase');
      expect(SessionStateMachine.getPhaseName('results')).toBe('Results');
      expect(SessionStateMachine.getPhaseName('ended')).toBe('Ended');
    });
  });

  // ── isPlayable / isFinalState ──────────────────────────────────
  describe('isPlayable', () => {
    it('returns false for null session', () => {
      expect(SessionStateMachine.isPlayable(null)).toBe(false);
    });
    it('returns false for ended session', () => {
      expect(SessionStateMachine.isPlayable(makeSession({ status: 'ended' }))).toBe(false);
    });
    it('returns false for paused session', () => {
      expect(SessionStateMachine.isPlayable(makeSession({ paused: true }))).toBe(false);
    });
    it('returns true for active unpaused session', () => {
      expect(SessionStateMachine.isPlayable(makeSession({ status: 'answer' }))).toBe(true);
    });
  });

  describe('isFinalState', () => {
    it('returns true for ended', () => {
      expect(SessionStateMachine.isFinalState(makeSession({ status: 'ended' }))).toBe(true);
    });
    it('returns false for non-ended', () => {
      expect(SessionStateMachine.isFinalState(makeSession({ status: 'vote' }))).toBe(false);
    });
    it('returns false for null', () => {
      expect(SessionStateMachine.isFinalState(null)).toBe(false);
    });
  });
});
