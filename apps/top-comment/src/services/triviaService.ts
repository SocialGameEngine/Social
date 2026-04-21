import { supabase } from '../supabase/client';

// --- Question Management Types ---

export interface QuestionPack {
  id: string;
  name: string;
  description?: string;
  status: 'draft' | 'published' | 'archived';
  createdBy: string;
  createdAt: string;
  questionCount?: number;
}

export interface TriviaQuestion {
  id: string;
  packId?: string;
  format: 'multiple_choice' | 'written_answer';
  categoryKey: string;
  difficulty: 'easy' | 'medium' | 'hard';
  prompt: string;
  explanation?: string;
  hint?: string;
  media?: {
    imageUrl?: string;
    audioUrl?: string;
  };
  status: 'draft' | 'published' | 'archived';
  tags: string[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  // Format-specific data
  options?: Array<{
    id: string;
    text: string;
    isCorrect: boolean;
    sortOrder: number;
  }>;
  aliases?: Array<{
    text: string;
    normalized: string;
    matchType: 'exact' | 'alias';
  }>;
}

export interface PackFilters {
  status?: 'draft' | 'published' | 'archived';
  createdBy?: string;
}

export interface QuestionFilters {
  packId?: string;
  format?: 'multiple_choice' | 'written_answer';
  categoryKey?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  status?: 'draft' | 'published' | 'archived';
}

// --- Utility Functions ---

export function normalizeText(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/[^\w\s]/g, ''); // Remove non-alphanumeric chars
}

export function areAnswersEquivalent(answer1: string, answer2: string): boolean {
  return normalizeText(answer1) === normalizeText(answer2);
}

// --- Database Operations ---

async function getQuestionPacks(filters: PackFilters = {}): Promise<QuestionPack[]> {
  let query = supabase
    .from('trivia_question_packs')
    .select('*')
    .order('created_at', { ascending: false });

  if (filters.status) {
    query = query.eq('status', filters.status);
  }
  if (filters.createdBy) {
    query = query.eq('created_by', filters.createdBy);
  }

  const { data, error } = await query;
  if (error) throw error;

  return (data || []).map(pack => ({
    id: pack.id,
    name: pack.name,
    description: pack.description || undefined,
    status: pack.status as 'draft' | 'published' | 'archived',
    createdBy: pack.created_by || '',
    createdAt: pack.created_at || '',
    questionCount: 0, // Will be populated separately if needed
  })) as QuestionPack[];
}

async function getQuestions(filters: QuestionFilters = {}): Promise<TriviaQuestion[]> {
  let query = supabase
    .from('trivia_questions')
    .select(`
      *,
      trivia_question_options(*),
      trivia_question_aliases(*)
    `)
    .order('created_at', { ascending: false });

  if (filters.packId) {
    query = query.eq('pack_id', filters.packId);
  }
  if (filters.format) {
    query = query.eq('format', filters.format);
  }
  if (filters.categoryKey) {
    query = query.eq('category_key', filters.categoryKey);
  }
  if (filters.difficulty) {
    query = query.eq('difficulty', filters.difficulty);
  }
  if (filters.status) {
    query = query.eq('status', filters.status);
  }

  const { data, error } = await query;
  if (error) throw error;

  return (data || []).map(q => ({
    id: q.id,
    packId: q.pack_id || undefined,
    format: q.format as 'multiple_choice' | 'written_answer',
    categoryKey: q.category_key,
    difficulty: q.difficulty as 'easy' | 'medium' | 'hard',
    prompt: q.prompt,
    explanation: q.explanation || undefined,
    hint: q.hint || undefined,
    media: undefined, // media_url doesn't exist in schema
    status: q.status as 'draft' | 'published' | 'archived',
    tags: q.tags || [],
    createdBy: q.created_by || '',
    createdAt: q.created_at || '',
    updatedAt: q.updated_at || '',
    options: (q as any).trivia_question_options?.map((opt: any) => ({
      id: opt.option_id, // Use option_id from database
      text: opt.option_text,
      isCorrect: opt.is_correct,
      sortOrder: opt.sort_order,
    })),
    aliases: (q as any).trivia_question_aliases?.map((alias: any) => ({
      text: alias.alias_text,
      normalized: alias.alias_normalized,
      matchType: 'alias' as const,
    })),
  }));
}

async function createQuestionPack(pack: Omit<QuestionPack, 'id' | 'createdAt'>): Promise<QuestionPack> {
  const { data, error } = await supabase
    .from('trivia_question_packs')
    .insert({
      name: pack.name,
      description: pack.description,
      status: pack.status,
      created_by: pack.createdBy,
    })
    .select()
    .single();

  if (error) throw error;

  return {
    id: data.id,
    name: data.name,
    description: data.description || undefined,
    status: data.status as 'draft' | 'published' | 'archived',
    createdBy: data.created_by || '',
    createdAt: data.created_at || '',
  };
}

async function createQuestion(question: Omit<TriviaQuestion, 'id' | 'createdAt' | 'updatedAt'>): Promise<TriviaQuestion> {
  const { data, error } = await supabase
    .from('trivia_questions')
    .insert({
      pack_id: question.packId,
      format: question.format,
      category_key: question.categoryKey,
      difficulty: question.difficulty,
      prompt: question.prompt,
      explanation: question.explanation,
      hint: question.hint,
      status: question.status,
      tags: question.tags,
      created_by: question.createdBy,
    })
    .select()
    .single();

  if (error) throw error;

  return {
    id: data.id,
    packId: data.pack_id || undefined,
    format: data.format as 'multiple_choice' | 'written_answer',
    categoryKey: data.category_key,
    difficulty: data.difficulty as 'easy' | 'medium' | 'hard',
    prompt: data.prompt,
    explanation: data.explanation || undefined,
    hint: data.hint || undefined,
    media: undefined,
    status: data.status as 'draft' | 'published' | 'archived',
    tags: data.tags || [],
    createdBy: data.created_by || '',
    createdAt: data.created_at || '',
    updatedAt: data.updated_at || '',
  };
}

async function createQuestionOption(questionId: string, option: { text: string; isCorrect: boolean; sortOrder: number }) {
  const { data, error } = await supabase
    .from('trivia_question_options')
    .insert({
      option_id: crypto.randomUUID(), // Generate unique option_id
      question_id: questionId,
      option_text: option.text,
      is_correct: option.isCorrect,
      sort_order: option.sortOrder,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

async function createQuestionAlias(questionId: string, alias: { text: string; normalized: string }) {
  const { data, error } = await supabase
    .from('trivia_question_aliases')
    .insert({
      question_id: questionId,
      alias_text: alias.text,
      alias_normalized: alias.normalized,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

async function deleteQuestionPack(packId: string) {
  const { error } = await supabase
    .from('trivia_question_packs')
    .delete()
    .eq('id', packId);

  if (error) throw error;
}

async function deleteQuestion(questionId: string) {
  const { error } = await supabase
    .from('trivia_questions')
    .delete()
    .eq('id', questionId);

  if (error) throw error;
}

// Export triviaService object for compatibility
export const triviaService = {
  normalizeText,
  areAnswersEquivalent,
  getQuestionPacks,
  getQuestions,
  createQuestionPack,
  createQuestion,
  createQuestionOption,
  createQuestionAlias,
  deleteQuestionPack,
  deleteQuestion,
};
