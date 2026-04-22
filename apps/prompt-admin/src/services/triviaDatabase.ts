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

// Question Packs
export async function getTriviaPacks(): Promise<TriviaQuestionPack[]> {
  const { data, error } = await supabase
    .from('trivia_question_packs')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data ?? [];
}

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

export async function createTriviaPack(pack: Omit<TriviaQuestionPack, 'id' | 'created_at' | 'created_by'>): Promise<TriviaQuestionPack> {
  const { data, error } = await supabase
    .from('trivia_question_packs')
    .insert(pack)
    .select()
    .single();

  if (error) throw error;
  return data;
}

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

export async function deleteTriviaPack(id: string): Promise<void> {
  // This will cascade delete questions, options, and aliases
  const { error } = await supabase
    .from('trivia_question_packs')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// Questions
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

export async function createTriviaQuestion(question: Omit<TriviaQuestion, 'id' | 'created_at' | 'updated_at' | 'created_by'>): Promise<TriviaQuestion> {
  const { data, error } = await supabase
    .from('trivia_questions')
    .insert(question)
    .select()
    .single();

  if (error) throw error;
  return data;
}

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

export async function deleteTriviaQuestion(id: string): Promise<void> {
  // This will cascade delete options and aliases
  const { error } = await supabase
    .from('trivia_questions')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// Options
export async function createTriviaOption(option: Omit<TriviaQuestionOption, 'id'>): Promise<TriviaQuestionOption> {
  const { data, error } = await supabase
    .from('trivia_question_options')
    .insert(option)
    .select()
    .single();

  if (error) throw error;
  return data;
}

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

export async function deleteTriviaOption(id: string): Promise<void> {
  const { error } = await supabase
    .from('trivia_question_options')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

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

export async function deleteTriviaAlias(id: string): Promise<void> {
  // Get the question_id before deleting
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

// Bulk operations
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
