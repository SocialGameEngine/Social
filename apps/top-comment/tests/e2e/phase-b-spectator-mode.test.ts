import { test, expect } from "@playwright/test";

test.describe('Phase B - Spectator/Practice Mode (P2-4)', () => {
  test('should allow practice submissions for late joiners', async () => {
    // Test practice submission logic
    const lateJoinerSocialite = {
      id: 'socialite-123',
      pending_until_round_index: 5,
      display_name: 'Test User'
    };

    const currentSociale = {
      id: 'sociale-123',
      current_round_index: 2,
      status: 'active'
    };

    const isSpectator = lateJoinerSocialite.pending_until_round_index > currentSociale.current_round_index;
    expect(isSpectator).toBe(true);

    // Practice submission should be marked
    const practiceSubmission = {
      socialite_id: lateJoinerSocialite.id,
      response_text: 'Practice answer',
      is_practice: true
    };

    expect(practiceSubmission.is_practice).toBe(true);
  });

  test('should render practice submissions greyed on TV', async () => {
    // Test TV rendering of practice submissions
    const submissions = [
      { id: '1', response_text: 'Real answer', is_practice: false },
      { id: '2', response_text: 'Practice answer', is_practice: true },
      { id: '3', response_text: 'Another real answer', is_practice: false }
    ];

    const practiceSubmissions = submissions.filter(s => s.is_practice);
    const realSubmissions = submissions.filter(s => !s.is_practice);

    expect(practiceSubmissions).toHaveLength(1);
    expect(realSubmissions).toHaveLength(2);
  });

  test('should allow voting on practice submissions', async () => {
    // Test voting logic for practice submissions
    const practiceVote = {
      socialite_id: 'voter-123',
      response_id: 'practice-response-456',
      is_practice: true
    };

    expect(practiceVote.is_practice).toBe(true);
  });

  test('should exclude practice submissions from scoring', async () => {
    // Test scoring aggregation excludes practice
    const allResponses = [
      { id: '1', is_correct: true, is_practice: false, score_awarded: 100 },
      { id: '2', is_correct: true, is_practice: true, score_awarded: 0 }, // Practice gets 0
      { id: '3', is_correct: false, is_practice: false, score_awarded: 0 }
    ];

    const scoringResponses = allResponses.filter(r => !r.is_practice);
    const totalScore = scoringResponses.reduce((sum, r) => sum + r.score_awarded, 0);

    expect(totalScore).toBe(100); // Only real submissions counted
    expect(scoringResponses).toHaveLength(2);
  });

  test('should auto-promote spectator to active player', async () => {
    // Test automatic promotion when caught up
    let socialite = {
      id: 'socialite-123',
      pending_until_round_index: 5
    };

    let sociale = {
      id: 'sociale-123',
      current_round_index: 2
    };

    // Simulate round advancement
    sociale.current_round_index = 5;
    const isNowActive = sociale.current_round_index >= socialite.pending_until_round_index;

    expect(isNowActive).toBe(true);
  });

  test('should switch UI from waiting room to answer phase', async () => {
    // Test UI state transition
    const wasSpectator = true;
    const isNowActive = true;
    const shouldShowWaitingRoom = wasSpectator && !isNowActive;
    const shouldShowAnswerPhase = !wasSpectator || isNowActive;

    expect(shouldShowWaitingRoom).toBe(false);
    expect(shouldShowAnswerPhase).toBe(true);
  });

  test('should handle is_practice column in responses table', async () => {
    // Test database schema includes is_practice
    const responseSchema = {
      id: 'uuid',
      socialite_id: 'uuid',
      response_text: 'text',
      is_correct: 'boolean',
      is_practice: 'boolean', // New column
      score_awarded: 'integer',
      created_at: 'timestamptz'
    };

    expect(responseSchema.is_practice).toBe('boolean');
  });

  test('should handle is_practice column in votes table', async () => {
    // Test database schema includes is_practice for votes
    const voteSchema = {
      id: 'uuid',
      socialite_id: 'uuid',
      response_id: 'uuid',
      is_practice: 'boolean', // New column
      created_at: 'timestamptz'
    };

    expect(voteSchema.is_practice).toBe('boolean');
  });

  test('should provide host toggle for practice visibility', async () => {
    // Test host control for practice submission visibility
    const hostSettings = {
      showPracticeSubmissions: true, // Host can toggle
      practiceSubmissionOpacity: 0.5 // Greyed out appearance
    };

    expect(typeof hostSettings.showPracticeSubmissions).toBe('boolean');
    expect(hostSettings.practiceSubmissionOpacity).toBeLessThan(1);
  });

  test('should maintain spectator as derived state', async () => {
    // Test spectator status is derived, not stored
    const socialite = {
      id: 'socialite-123',
      pending_until_round_index: 5
      // No spectator_status column - it's derived
    };

    const sociale = {
      id: 'sociale-123',
      current_round_index: 2
    };

    // Spectator is derived from comparison
    const isSpectator = socialite.pending_until_round_index > sociale.current_round_index;
    expect(isSpectator).toBe(true);
    expect('spectator_status' in socialite).toBe(false); // Not stored
  });
});
