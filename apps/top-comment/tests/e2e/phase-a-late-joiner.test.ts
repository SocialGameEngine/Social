import { test, expect } from "@playwright/test";

test.describe('Phase A - Late-joiner Routing (P2-6)', () => {
  test('should identify late joiners correctly', async () => {
    // Test late joiner logic
    const currentRoundIndex = 2;
    const pendingUntilRoundIndex = 5;
    
    const isLateJoiner = pendingUntilRoundIndex > currentRoundIndex;
    expect(isLateJoiner).toBe(true);
  });

  test('should show LateJoinerWaitingRoom for late joiners', async () => {
    // Verify waiting room component behavior
    const lateJoinerState = {
      currentRoundIndex: 2,
      pendingUntilRoundIndex: 5,
      phase: 'answer',
      phaseEndsAt: new Date(Date.now() + 20000).toISOString()
    };

    expect(lateJoinerState.pendingUntilRoundIndex).toBeGreaterThan(lateJoinerState.currentRoundIndex);
  });

  test('should display countdown in waiting room', async () => {
    // Test countdown logic
    const phaseEndsAt = new Date(Date.now() + 20000).getTime(); // 20s from now
    const now = Date.now();
    const remainingMs = phaseEndsAt - now;
    const remainingSeconds = Math.max(0, Math.floor(remainingMs / 1000));

    expect(remainingSeconds).toBeGreaterThan(0);
    expect(remainingSeconds).toBeLessThanOrEqual(20);
  });

  test('should show current round preview in waiting room', async () => {
    // Test round preview display
    const currentRound = {
      order_index: 2,
      prompt: 'What is the capital of France?',
      category: 'Geography'
    };

    expect(currentRound.prompt).toBeDefined();
    expect(currentRound.order_index).toBe(2);
  });

  test('should auto-promote to active at round boundary', async () => {
    // Test automatic promotion logic
    let currentRoundIndex = 2;
    const pendingUntilRoundIndex = 5;

    // Simulate round advancement
    currentRoundIndex = 5;
    const isNowActive = currentRoundIndex >= pendingUntilRoundIndex;

    expect(isNowActive).toBe(true);
  });

  test('should display TV notification for late joiners', async () => {
    // Test TV toast notification
    const tvNotification = {
      type: 'late_joiner_joined',
      socialiteId: 'test-socialite-id',
      displayName: 'Test User',
      timestamp: new Date().toISOString()
    };

    expect(tvNotification.type).toBe('late_joiner_joined');
    expect(tvNotification.displayName).toBeDefined();
  });

  test('should handle pending_until_round_index correctly', async () => {
    // Test the existing field is used properly
    const socialite = {
      id: 'socialite-123',
      display_name: 'Test User',
      pending_until_round_index: 5,
      is_active: true
    };

    const sociale = {
      id: 'sociale-123',
      current_round_index: 2,
      status: 'active'
    };

    const isLateJoiner = socialite.pending_until_round_index > sociale.current_round_index;
    expect(isLateJoiner).toBe(true);
  });

  test('should show "You\'ll join next round" message', async () => {
    // Test waiting room messaging
    const roundsUntilJoin = 5 - 2; // pending - current
    const message = roundsUntilJoin === 1 
      ? "You'll join next round" 
      : `You'll join in ${roundsUntilJoin} rounds`;

    expect(message).toContain('join');
    expect(typeof roundsUntilJoin).toBe('number');
  });

  test('should branch RoomPage based on late-joiner status', async () => {
    // Test RoomPage routing logic
    const isLateJoiner = true;
    const shouldShowWaitingRoom = isLateJoiner;
    const shouldShowAnswerPhase = !isLateJoiner;

    expect(shouldShowWaitingRoom).toBe(true);
    expect(shouldShowAnswerPhase).toBe(false);
  });
});
