import { useState, useCallback, useMemo } from 'react';
import type { BarContextInput, BarContext } from '../../../domain/ai/barContextTemplates';
import { 
  generateBarContextFromTemplates, 
  generateContextQuote,
  generateRoundCommentary 
} from '../../../domain/ai/barContextTemplates';

interface UseBarContextOptions {
  venueName?: string;
  totalPlayers: number;
  currentRound: number;
  totalRounds: number;
  topScore: number;
  averageScore: number;
  closestMargin: number;
  longestStreak: number;
  useAI?: boolean; // Enable AI generation (V2, cost-gated)
  aiCostLimit?: number; // Max cost in cents
}

interface BarContextState {
  context: BarContext | null;
  quote: string | null;
  isGenerating: boolean;
  error: string | null;
  costUsed: number; // In cents
}

/**
 * Hook for generating bar context (atmosphere, energy, momentum, dynamics)
 * V1: Template-based (free)
 * V2: AI-powered (cost-gated)
 */
export function useBarContext(options: UseBarContextOptions) {
  const [state, setState] = useState<BarContextState>({
    context: null,
    quote: null,
    isGenerating: false,
    error: null,
    costUsed: 0,
  });

  // Determine time of day and day of week
  const timeContext = useMemo(() => {
    const now = new Date();
    const hour = now.getHours();
    const day = now.getDay();

    let timeOfDay: BarContextInput['timeOfDay'];
    if (hour < 12) timeOfDay = 'morning';
    else if (hour < 17) timeOfDay = 'afternoon';
    else if (hour < 21) timeOfDay = 'evening';
    else timeOfDay = 'night';

    const dayOfWeek: BarContextInput['dayOfWeek'] = 
      day === 0 || day === 6 ? 'weekend' : 'weekday';

    return { timeOfDay, dayOfWeek };
  }, []);

  // Build context input
  const contextInput: BarContextInput = useMemo(() => ({
    venueName: options.venueName,
    totalPlayers: options.totalPlayers,
    currentRound: options.currentRound,
    totalRounds: options.totalRounds,
    topScore: options.topScore,
    averageScore: options.averageScore,
    closestMargin: options.closestMargin,
    longestStreak: options.longestStreak,
    ...timeContext,
  }), [options, timeContext]);

  /**
   * Generate context using templates (V1 - free)
   */
  const generateTemplateContext = useCallback(() => {
    setState(prev => ({ ...prev, isGenerating: true, error: null }));

    try {
      const context = generateBarContextFromTemplates(contextInput);
      const quote = generateContextQuote(contextInput);

      setState(prev => ({
        ...prev,
        context,
        quote,
        isGenerating: false,
      }));

      return { context, quote };
    } catch (error) {
      console.error('Failed to generate template context:', error);
      setState(prev => ({
        ...prev,
        isGenerating: false,
        error: 'Failed to generate context',
      }));
      return null;
    }
  }, [contextInput]);

  /**
   * Generate context using AI (V2 - cost-gated)
   * This would call OpenAI API in production
   */
  const generateAIContext = useCallback(async () => {
    // Check cost limit
    if (options.aiCostLimit && state.costUsed >= options.aiCostLimit) {
      setState(prev => ({
        ...prev,
        error: 'AI cost limit reached. Using templates instead.',
      }));
      return generateTemplateContext();
    }

    setState(prev => ({ ...prev, isGenerating: true, error: null }));

    try {
      // In production, this would call OpenAI API
      // For now, fall back to templates
      // const aiResponse = await callOpenAI(contextInput);
      
      // Simulated AI cost (would be actual API cost)
      const estimatedCost = 0.5; // cents per generation

      // Fallback to templates for now
      const context = generateBarContextFromTemplates(contextInput);
      const quote = generateContextQuote(contextInput);

      setState(prev => ({
        ...prev,
        context,
        quote,
        isGenerating: false,
        costUsed: prev.costUsed + estimatedCost,
      }));

      return { context, quote };
    } catch (error) {
      console.error('Failed to generate AI context:', error);
      setState(prev => ({
        ...prev,
        isGenerating: false,
        error: 'AI generation failed. Using templates.',
      }));
      
      // Fallback to templates
      return generateTemplateContext();
    }
  }, [contextInput, options.aiCostLimit, state.costUsed, generateTemplateContext]);

  /**
   * Main generate function - routes to AI or templates
   */
  const generate = useCallback(() => {
    if (options.useAI) {
      return generateAIContext();
    } else {
      return generateTemplateContext();
    }
  }, [options.useAI, generateAIContext, generateTemplateContext]);

  /**
   * Generate round commentary
   */
  const getRoundCommentary = useCallback((roundType: string) => {
    return generateRoundCommentary(
      options.currentRound,
      options.totalRounds,
      roundType
    );
  }, [options.currentRound, options.totalRounds]);

  return {
    state,
    generate,
    getRoundCommentary,
    contextInput,
  };
}

/**
 * Placeholder for OpenAI API call (V2 implementation)
 */
async function callOpenAI(input: BarContextInput): Promise<BarContext> {
  // This would be implemented in V2 with actual OpenAI API calls
  // Example prompt:
  const prompt = `Generate engaging bar/venue atmosphere context for a social trivia game.
  
Venue: ${input.venueName || 'Social Game Engine'}
Players: ${input.totalPlayers}
Round: ${input.currentRound} of ${input.totalRounds}
Time: ${input.timeOfDay}, ${input.dayOfWeek}
Top Score: ${input.topScore}
Closest Margin: ${input.closestMargin}

Generate 4 short, punchy descriptions (max 15 words each):
1. Atmosphere: Overall venue vibe
2. Crowd Energy: Player engagement level
3. Game Momentum: Current game state
4. Player Dynamics: Competition dynamics

Keep it casual, fun, and energetic. Use sports commentary style.`;

  // Would call OpenAI API here
  // const response = await openai.chat.completions.create({
  //   model: 'gpt-4o-mini',
  //   messages: [{ role: 'user', content: prompt }],
  //   max_tokens: 150,
  // });

  // For now, throw to trigger fallback
  throw new Error('AI generation not implemented yet');
}
