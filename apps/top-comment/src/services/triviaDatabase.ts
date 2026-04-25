// Type-safe trivia database access
// This provides proper typing without complex augmentation

import { supabase } from "../supabase/client";

type InteractionSettings = {
  snapshot?: {
    multipleChoice?: {
      correctOptionId?: string;
    };
    writtenAnswer?: {
      correctAnswer?: string;
    };
    explanation?: string;
  };
};

export interface TriviaSubmissionData {
  id: string;
  interaction_id: string | null;
  room_id: string;
  member_id: string;
  submitted_at: string | null;
  latency_ms: number | null;
  payload: any;
  status: 'accepted' | 'replaced' | 'late' | 'rejected';
}

export interface TriviaEvaluationData {
  id: string;
  submission_id: string | null;
  interaction_id: string | null;
  room_id: string;
  member_id: string;
  result: 'correct' | 'partial' | 'incorrect' | 'needs_review';
  points_awarded: number;
  method: 'exact' | 'alias' | 'fuzzy' | 'host_override';
  confidence: number | null;
  matched_alias: string | null;
  reasoning_short: string | null;
  grader_version: string;
  judged_at: string;
}

// Type-safe wrapper for trivia database operations
export class TriviaDatabase {
  static async getSubmission(interactionId: string, membershipId: string): Promise<TriviaSubmissionData | null> {
    const { data, error } = await supabase
      .from('trivia_submissions')
      .select('*')
      .eq('interaction_id', interactionId)
      .eq('member_id', membershipId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // No rows found
      throw new Error(`Failed to fetch trivia submission: ${error.message}`);
    }
    return data as TriviaSubmissionData | null;
  }

  static async getRevealData(interactionId: string, _membershipId: string): Promise<{
    interaction_id: string;
    correct_answer: string;
    explanation: string;
    total_responses: number;
    correct_responses: number;
    average_response_time: number;
  }> {
    // Get the interaction to extract correct answer
    const { data: interaction, error: interactionError } = await supabase
      .from('interactions')
      .select('settings')
      .eq('id', interactionId)
      .single();

    if (interactionError) throw new Error(`Failed to fetch interaction: ${interactionError.message}`);

    const settings = interaction.settings as InteractionSettings;
    const correctAnswer = settings?.snapshot?.multipleChoice?.correctOptionId || 
                         settings?.snapshot?.writtenAnswer?.correctAnswer || '';
    const explanation = settings?.snapshot?.explanation || '';

    // Get submission stats
    const { data: submissions, error: submissionsError } = await supabase
      .from('trivia_submissions')
      .select('id, latency_ms')
      .eq('interaction_id', interactionId);

    if (submissionsError) throw new Error(`Failed to fetch submissions: ${submissionsError.message}`);

    // Get evaluation stats
    const { data: evaluations, error: evaluationsError } = await supabase
      .from('trivia_evaluations')
      .select('result')
      .eq('interaction_id', interactionId);

    if (evaluationsError) throw new Error(`Failed to fetch evaluations: ${evaluationsError.message}`);

    const totalResponses = submissions?.length || 0;
    const correctResponses = evaluations?.filter(e => e.result === 'correct').length || 0;
    const averageResponseTime = submissions?.length 
      ? submissions.reduce((sum, s) => sum + (s.latency_ms || 0), 0) / submissions.length 
      : 0;

    return {
      interaction_id: interactionId,
      correct_answer: correctAnswer,
      explanation,
      total_responses: totalResponses,
      correct_responses: correctResponses,
      average_response_time: averageResponseTime,
    };
  }
}
