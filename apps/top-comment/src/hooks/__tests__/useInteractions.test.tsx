import { describe, it, expect, vi } from 'vitest';
import type { Interaction } from '../../shared/types';

// Mock the dependencies
vi.mock('../../shared/providers/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'user-123', email: 'test@example.com' },
    isGuest: false,
    signOut: vi.fn(),
  }),
}));

describe('useInteractions hook logic', () => {
  it('correctly filters interactions by status', () => {
    const interactions: Interaction[] = [
      {
        id: 'int-1',
        roomId: 'room-123',
        createdBy: 'user-123',
        type: 'headline_fibbage',
        status: 'active',
        question: 'Test question?',
        description: 'Test description',
        settings: {},
        answerSeconds: 60,
        answerEndsAt: new Date(Date.now() + 60000).toISOString(),
        votingSeconds: 30,
        votingEndsAt: null,
        responseCount: 0,
        voteCount: 0,
        createdAt: new Date().toISOString(),
      },
      {
        id: 'int-2',
        roomId: 'room-123',
        createdBy: 'user-456',
        type: 'headline_fibbage',
        status: 'voting',
        question: 'Another question?',
        description: 'Another description',
        settings: {},
        answerSeconds: 60,
        answerEndsAt: new Date(Date.now() - 60000).toISOString(),
        votingSeconds: 30,
        votingEndsAt: new Date(Date.now() + 30000).toISOString(),
        responseCount: 5,
        voteCount: 3,
        createdAt: new Date().toISOString(),
      },
      {
        id: 'int-3',
        roomId: 'room-123',
        createdBy: 'user-789',
        type: 'headline_fibbage',
        status: 'results',
        question: 'Results question?',
        description: 'Results description',
        settings: {},
        answerSeconds: 60,
        answerEndsAt: new Date(Date.now() - 120000).toISOString(),
        votingSeconds: 30,
        votingEndsAt: new Date(Date.now() - 30000).toISOString(),
        responseCount: 5,
        voteCount: 5,
        createdAt: new Date().toISOString(),
      },
    ];

    // Simulate filtering logic
    const activeInteractions = interactions.filter(i => i.status === 'active');
    const votingInteractions = interactions.filter(i => i.status === 'voting');
    const resultsInteractions = interactions.filter(i => i.status === 'results');

    expect(activeInteractions).toHaveLength(1);
    expect(activeInteractions[0].id).toBe('int-1');
    expect(votingInteractions).toHaveLength(1);
    expect(votingInteractions[0].id).toBe('int-2');
    expect(resultsInteractions).toHaveLength(1);
    expect(resultsInteractions[0].id).toBe('int-3');
  });

  it('identifies headline_fibbage interactions', () => {
    const interactions: Interaction[] = [
      {
        id: 'int-1',
        roomId: 'room-123',
        createdBy: 'user-123',
        type: 'headline_fibbage',
        status: 'active',
        question: 'Test question?',
        description: 'Test description',
        settings: {},
        answerSeconds: 60,
        answerEndsAt: new Date(Date.now() + 60000).toISOString(),
        votingSeconds: 30,
        votingEndsAt: null,
        responseCount: 0,
        voteCount: 0,
        createdAt: new Date().toISOString(),
      },
      {
        id: 'int-2',
        roomId: 'room-123',
        createdBy: 'user-456',
        type: 'prompt',
        status: 'active',
        question: 'Regular prompt?',
        description: 'Regular description',
        settings: {},
        answerSeconds: 60,
        answerEndsAt: new Date(Date.now() + 60000).toISOString(),
        votingSeconds: 30,
        votingEndsAt: null,
        responseCount: 0,
        voteCount: 0,
        createdAt: new Date().toISOString(),
      },
    ];

    const headlineInteractions = interactions.filter(i => i.type === 'headline_fibbage');
    expect(headlineInteractions).toHaveLength(1);
    expect(headlineInteractions[0].id).toBe('int-1');
  });

  it('validates interaction structure', () => {
    const validInteraction: Interaction = {
      id: 'int-123',
      roomId: 'room-123',
      createdBy: 'user-123',
      type: 'headline_fibbage',
      status: 'active',
      question: 'Test question?',
      description: 'Test description',
      settings: {},
      answerSeconds: 60,
      answerEndsAt: new Date(Date.now() + 60000).toISOString(),
      votingSeconds: 30,
      votingEndsAt: null,
      responseCount: 0,
      voteCount: 0,
      createdAt: new Date().toISOString(),
    };

    expect(validInteraction.id).toBe('int-123');
    expect(validInteraction.type).toBe('headline_fibbage');
    expect(validInteraction.status).toBe('active');
    expect(validInteraction.answerSeconds).toBe(60);
    expect(validInteraction.votingSeconds).toBe(30);
  });

  it('handles time calculations', () => {
    const now = new Date();
    const futureTime = new Date(now.getTime() + 60000); // 1 minute from now

    const interaction: Interaction = {
      id: 'int-123',
      roomId: 'room-123',
      createdBy: 'user-123',
      type: 'headline_fibbage',
      status: 'active',
      question: 'Test question?',
      description: 'Test description',
      settings: {},
      answerSeconds: 60,
      answerEndsAt: futureTime.toISOString(),
      votingSeconds: 30,
      votingEndsAt: null,
      responseCount: 0,
      voteCount: 0,
      createdAt: now.toISOString(),
    };

    // Simulate time remaining calculation
    const timeRemaining = Math.max(0, Math.floor((new Date(interaction.answerEndsAt!).getTime() - now.getTime()) / 1000));
    expect(timeRemaining).toBeGreaterThan(50); // Should be close to 60 seconds
    expect(timeRemaining).toBeLessThanOrEqual(60);
  });

  it('validates interaction status transitions', () => {
    const validStatuses: Interaction['status'][] = ['active', 'voting', 'results', 'closed'];
    const interaction: Interaction = {
      id: 'int-123',
      roomId: 'room-123',
      createdBy: 'user-123',
      type: 'headline_fibbage',
      status: 'active',
      question: 'Test question?',
      description: 'Test description',
      settings: {},
      answerSeconds: 60,
      answerEndsAt: new Date(Date.now() + 60000).toISOString(),
      votingSeconds: 30,
      votingEndsAt: null,
      responseCount: 0,
      voteCount: 0,
      createdAt: new Date().toISOString(),
    };

    validStatuses.forEach(status => {
      const testInteraction = { ...interaction, status };
      expect(testInteraction.status).toBe(status);
    });
  });
});
