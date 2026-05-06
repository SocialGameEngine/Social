/**
 * Trivia Database Service
 * 
 * PURPOSE: Manages the trivia question system with support for multiple question
 * formats (multiple choice, written answer) organized into themed packs.
 * 
 * TABLES:
 * - trivia_question_packs: Themed collections (e.g., "Science Trivia", "Pop Culture")
 * - trivia_questions: Individual questions with format, difficulty, category
 * - trivia_question_options: Multiple choice options (A, B, C, D)
 * - trivia_question_aliases: Accepted alternative answers for written questions
 * 
 * QUESTION FORMATS:
 * - multiple_choice: 4 options with exactly 1 correct (A/B/C/D)
 * - written_answer: Free text with aliases for fuzzy matching
 * 
 * WORKFLOW:
 * 1. Create a pack (e.g., "Pub Quiz - Round 1")
 * 2. Add questions via form or bulk import (JSON/CSV)
 * 3. Set status: draft → published (only published questions appear in games)
 * 4. Pack is selected when creating a hosted Sociale
 */

import { supabase } from './database';
import type { 
  TriviaQuestionPack, 
  TriviaQuestion, 
  TriviaQuestionOption, 
  TriviaQuestionAlias,
  TriviaQuestionPackWithCounts,
  TriviaQuestionWithDetails,
  TriviaExportRow
} from '../types/trivia';

/** 
 * PACK OPERATIONS
 * Packs organize questions into themed collections for easy selection during game setup.
 */

/** 
 * Fetches all trivia packs, newest first.
 * Used in pack selector dropdown during Sociale creation.
 */
export async function getTriviaPacks(): Promise<TriviaQuestionPack[]> {
  const { data, error } = await supabase
    .from('trivia_question_packs')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data ?? [];
}

/**
 * Gets pack metadata plus question statistics.
 * Returns questionCount, publishedCount, draftCount for UI badges.
 */
export async function getTriviaPackWithCounts(packId: string): Promise<TriviaQuestionPackWithCounts | null> {
  const { data: pack, error: packError } = await supabase
    .from('trivia_question_packs')
    .select('*')
    .eq('id', packId)
    .single();

  if (packError) throw packError;
  if (!pack) return null;

  const { data: questions, error: questionsError } = await supabase
    .from('trivia_questions')
    .select('status')
    .eq('pack_id', packId);

  if (questionsError) throw questionsError;

  const questionCount = questions?.length || 0;
  const publishedCount = questions?.filter(q => q.status === 'published').length || 0;
  const draftCount = questions?.filter(q => q.status === 'draft').length || 0;

  return {
    ...pack,
    questionCount,
    publishedCount,
    draftCount,
  };
}

/** Creates a new trivia pack with the current user as owner */
export async function createTriviaPack(pack: Omit<TriviaQuestionPack, 'id' | 'created_at' | 'created_by'>): Promise<TriviaQuestionPack> {
  const { data, error } = await supabase
    .from('trivia_question_packs')
    .insert(pack)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/** Updates pack name, description, or status (draft/published/archived) */
export async function updateTriviaPack(id: string, pack: Partial<Omit<TriviaQuestionPack, 'id' | 'created_at' | 'created_by'>>): Promise<TriviaQuestionPack> {
  const { data, error } = await supabase
    .from('trivia_question_packs')
    .update(pack)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Deletes a pack and ALL its questions, options, and aliases (cascade).
 * IRREVERSIBLE - consider archiving instead.
 */
export async function deleteTriviaPack(id: string): Promise<void> {
  // CASCADE deletes questions, options, and aliases
  const { error } = await supabase
    .from('trivia_question_packs')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

/**
 * QUESTION OPERATIONS
 * Questions support two formats: multiple_choice and written_answer.
 * Each question can have options (for MC) or aliases (for written).
 */

/**
 * Fetches all questions in a pack with their options and aliases.
 * Client-side stable sort prevents reordering after updates.
 */
export async function getTriviaQuestions(packId: string): Promise<TriviaQuestionWithDetails[]> {
  const { data, error } = await supabase
    .from('trivia_questions')
    .select(`
      *,
      options:trivia_question_options ( * ),
      aliases:trivia_question_aliases ( * )
    `)
    .eq('pack_id', packId)
    .order('created_at', { ascending: true })
    .order('id', { ascending: true });

  if (error) throw error;
  const questions = (data ?? []).map(row => ({
    ...row,
    options: row.options ?? [],
    aliases: row.aliases ?? [],
  }));
  
  // Client-side stable sort to prevent reordering after updates
  return questions.sort((a, b) => {
    const dateCompare = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    if (dateCompare !== 0) return dateCompare;
    return a.id.localeCompare(b.id);
  });
}

/** Creates a new question. Must separately add options or aliases after creation. */
export async function createTriviaQuestion(question: Omit<TriviaQuestion, 'id' | 'created_at' | 'updated_at' | 'created_by'>): Promise<TriviaQuestion> {
  const { data, error } = await supabase
    .from('trivia_questions')
    .insert(question)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/** Updates question text, category, difficulty, or status. Does not modify options/aliases. */
export async function updateTriviaQuestion(id: string, question: Partial<Omit<TriviaQuestion, 'id' | 'created_at' | 'updated_at' | 'created_by'>>): Promise<TriviaQuestion> {
  const { data, error } = await supabase
    .from('trivia_questions')
    .update({
      ...question,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/** Deletes a question and its options/aliases (cascade). */
export async function deleteTriviaQuestion(id: string): Promise<void> {
  const { error } = await supabase
    .from('trivia_questions')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

/**
 * OPTIONS (Multiple Choice Only)
 * Each MC question has exactly 4 options (A, B, C, D).
 * Exactly one option must have is_correct=true.
 */

/** Adds an option to a multiple choice question. Use update to mark correct answer. */
export async function createTriviaOption(option: Omit<TriviaQuestionOption, 'id'>): Promise<TriviaQuestionOption> {
  const { data, error } = await supabase
    .from('trivia_question_options')
    .insert(option)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/** Updates option text or toggles is_correct status */
export async function updateTriviaOption(id: string, option: Partial<Omit<TriviaQuestionOption, 'id' | 'question_id'>>): Promise<TriviaQuestionOption> {
  const { data, error } = await supabase
    .from('trivia_question_options')
    .update(option)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/** Removes an option. Must maintain 4 options per MC question. */
export async function deleteTriviaOption(id: string): Promise<void> {
  const { error } = await supabase
    .from('trivia_question_options')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

/**
 * ALIASES (Written Answer Only)
 * Aliases provide fuzzy matching for written answers.
 * Example: "USA" matches "United States", "US", "America"
 * 
 * The accepted_answers array on the question is auto-synced from aliases.
 */

/** 
 * Syncs the question's accepted_answers array from its aliases.
 * Called automatically after alias create/delete.
 */
async function syncAcceptedAnswers(questionId: string): Promise<void> {
  const { data: aliases, error } = await supabase
    .from('trivia_question_aliases')
    .select('alias_text')
    .eq('question_id', questionId);

  if (error) throw error;

  const accepted_answers = (aliases ?? []).map(a => a.alias_text);
  
  const { error: updateError } = await supabase
    .from('trivia_questions')
    .update({ accepted_answers })
    .eq('id', questionId);

  if (updateError) throw updateError;
}

// Aliases
/** 
 * Adds an accepted answer alias for a written question.
 * Normalizes text to lowercase for case-insensitive matching.
 * Auto-syncs the parent question's accepted_answers array.
 */
export async function createTriviaAlias(alias: Omit<TriviaQuestionAlias, 'id'>): Promise<TriviaQuestionAlias> {
  const { data, error } = await supabase
    .from('trivia_question_aliases')
    .insert({
      ...alias,
      alias_normalized: alias.alias_text.toLowerCase().trim(),
    })
    .select()
    .single();

  if (error) throw error;
  
  await syncAcceptedAnswers(alias.question_id);
  return data;
}

/** 
 * Removes an alias and re-syncs accepted_answers.
 * Must fetch question_id first to trigger sync after deletion.
 */
export async function deleteTriviaAlias(id: string): Promise<void> {
  const { data: alias, error: fetchError } = await supabase
    .from('trivia_question_aliases')
    .select('question_id')
    .eq('id', id)
    .single();
    
  if (fetchError) throw fetchError;

  const { error } = await supabase
    .from('trivia_question_aliases')
    .delete()
    .eq('id', id);

  if (error) throw error;
  
  await syncAcceptedAnswers(alias.question_id);
}

/**
 * BULK OPERATIONS
 * For importing/exporting packs via JSON (from AI generator or manual editing).
 */

/**
 * REPLACES all questions in a pack with new data.
 * DANGER: Deletes existing questions first. Use with confirmation.
 * 
 * Process:
 * 1. Delete existing questions (cascade deletes options/aliases)
 * 2. Insert new questions in chunks (10 per batch)
 * 3. For each question, insert options (MC) or aliases (written)
 * 4. Sync accepted_answers for written questions
 * 
 * @param packId - Target pack to populate
 * @param rows - Questions from AI-generated JSON or manual import
 */
export async function replaceTriviaQuestions(packId: string, rows: TriviaExportRow[]): Promise<void> {
  // Delete existing questions
  await supabase
    .from('trivia_questions')
    .delete()
    .eq('pack_id', packId);

  // Insert in chunks
  const CHUNK = 10;
  for (let i = 0; i < rows.length; i += CHUNK) {
    const chunk = rows.slice(i, i + CHUNK);
    
    // Create questions
    const { data: questions } = await supabase
      .from('trivia_questions')
      .insert(chunk.map(row => ({
        pack_id: packId,
        format: row.format,
        category_key: row.category_key,
        difficulty: row.difficulty,
        prompt: row.prompt,
        explanation: row.explanation || null,
        hint: row.hint || null,
        media: null,
        status: 'draft',
        tags: row.tags || [],
      })))
      .select('id');

    if (!questions) continue;

    // Create options for multiple choice questions
    const optionsToInsert: Omit<TriviaQuestionOption, 'id'>[] = [];
    const aliasesToInsert: Omit<TriviaQuestionAlias, 'id'>[] = [];

    chunk.forEach((row, index) => {
      const questionId = questions[index]?.id;
      if (!questionId) return;

      if (row.format === 'multiple_choice' && row.options) {
        row.options.forEach((option, optIndex) => {
          optionsToInsert.push({
            question_id: questionId,
            option_id: option.option_id,
            option_text: option.option_text,
            is_correct: option.is_correct,
            sort_order: optIndex,
          });
        });
      }

      if (row.format === 'written_answer' && row.aliases) {
        row.aliases.forEach(alias => {
          aliasesToInsert.push({
            question_id: questionId,
            alias_text: alias,
            alias_normalized: alias.toLowerCase().trim(),
            match_type: 'alias',
          });
        });
      }
    });

    if (optionsToInsert.length > 0) {
      await supabase
        .from('trivia_question_options')
        .insert(optionsToInsert);
    }

    if (aliasesToInsert.length > 0) {
      await supabase
        .from('trivia_question_aliases')
        .insert(aliasesToInsert);
      
      // Sync accepted_answers for questions that had aliases
      const questionIdsWithAliases = new Set<string>();
      chunk.forEach((row, index) => {
        const questionId = questions[index]?.id;
        if (questionId && row.format === 'written_answer' && row.aliases) {
          questionIdsWithAliases.add(questionId);
        }
      });
      
      for (const questionId of questionIdsWithAliases) {
        await syncAcceptedAnswers(questionId);
      }
    }
  }
}

/**
 * Exports a pack as JSON for backup or AI-assisted editing.
 * Returns flat array of questions with nested options/aliases.
 * Can be re-imported via replaceTriviaQuestions after modification.
 */
export async function exportTriviaPack(packId: string): Promise<TriviaExportRow[]> {
  const questions = await getTriviaQuestions(packId);
  
  return questions.map(question => ({
    format: question.format,
    category_key: question.category_key,
    difficulty: question.difficulty,
    prompt: question.prompt,
    explanation: question.explanation || undefined,
    hint: question.hint || undefined,
    tags: question.tags,
    options: question.options?.map(opt => ({
      option_id: opt.option_id,
      option_text: opt.option_text,
      is_correct: opt.is_correct,
    })),
    aliases: question.aliases?.map(alias => alias.alias_text),
  }));
}
