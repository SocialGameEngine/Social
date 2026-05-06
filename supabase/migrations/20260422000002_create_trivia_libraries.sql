-- Create trivia library schema for prompt-admin
-- Tables: trivia_question_packs, trivia_questions, trivia_question_options, trivia_question_aliases

-- Trivia question packs (libraries)
CREATE TABLE IF NOT EXISTS public.trivia_question_packs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Trivia questions
CREATE TABLE IF NOT EXISTS public.trivia_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pack_id UUID NOT NULL REFERENCES public.trivia_question_packs(id) ON DELETE CASCADE,
  format TEXT NOT NULL CHECK (format IN ('multiple_choice', 'written_answer')),
  category_key TEXT NOT NULL,
  difficulty TEXT NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
  prompt TEXT NOT NULL,
  explanation TEXT,
  hint TEXT,
  media TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  tags TEXT[] DEFAULT '{}',
  accepted_answers TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Trivia question options (for multiple choice questions)
CREATE TABLE IF NOT EXISTS public.trivia_question_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID NOT NULL REFERENCES public.trivia_questions(id) ON DELETE CASCADE,
  option_id TEXT NOT NULL,
  option_text TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Trivia question aliases (for written answer questions)
CREATE TABLE IF NOT EXISTS public.trivia_question_aliases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID NOT NULL REFERENCES public.trivia_questions(id) ON DELETE CASCADE,
  alias_text TEXT NOT NULL,
  alias_normalized TEXT GENERATED ALWAYS AS (lower(trim(alias_text))) STORED,
  match_type TEXT NOT NULL DEFAULT 'alias' CHECK (match_type IN ('alias', 'variation')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.trivia_question_packs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trivia_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trivia_question_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trivia_question_aliases ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Read access for all authenticated users
DROP POLICY IF EXISTS "Trivia question packs - Select" ON public.trivia_question_packs;
CREATE POLICY "Trivia question packs - Select" ON public.trivia_question_packs
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Trivia questions - Select" ON public.trivia_questions;
CREATE POLICY "Trivia questions - Select" ON public.trivia_questions
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Trivia question options - Select" ON public.trivia_question_options;
CREATE POLICY "Trivia question options - Select" ON public.trivia_question_options
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Trivia question aliases - Select" ON public.trivia_question_aliases;
CREATE POLICY "Trivia question aliases - Select" ON public.trivia_question_aliases
  FOR SELECT USING (true);

-- Write access for service role only
DROP POLICY IF EXISTS "Trivia question packs - All" ON public.trivia_question_packs;
CREATE POLICY "Trivia question packs - All" ON public.trivia_question_packs
  FOR ALL USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Trivia questions - All" ON public.trivia_questions;
CREATE POLICY "Trivia questions - All" ON public.trivia_questions
  FOR ALL USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Trivia question options - All" ON public.trivia_question_options;
CREATE POLICY "Trivia question options - All" ON public.trivia_question_options
  FOR ALL USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Trivia question aliases - All" ON public.trivia_question_aliases;
CREATE POLICY "Trivia question aliases - All" ON public.trivia_question_aliases
  FOR ALL USING (auth.role() = 'service_role');

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_trivia_questions_pack_id ON public.trivia_questions(pack_id);
CREATE INDEX IF NOT EXISTS idx_trivia_questions_status ON public.trivia_questions(status);
CREATE INDEX IF NOT EXISTS idx_trivia_questions_tags ON public.trivia_questions USING GIN (tags);
CREATE INDEX IF NOT EXISTS idx_trivia_questions_accepted_answers ON public.trivia_questions USING GIN (accepted_answers);
CREATE INDEX IF NOT EXISTS idx_trivia_options_question_id ON public.trivia_question_options(question_id);
CREATE INDEX IF NOT EXISTS idx_trivia_aliases_question_id ON public.trivia_question_aliases(question_id);
CREATE INDEX IF NOT EXISTS idx_trivia_aliases_normalized ON public.trivia_question_aliases(alias_normalized);

-- Triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_trivia_question_packs_updated_at ON public.trivia_question_packs;
CREATE TRIGGER update_trivia_question_packs_updated_at 
  BEFORE UPDATE ON public.trivia_question_packs 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_trivia_questions_updated_at ON public.trivia_questions;
CREATE TRIGGER update_trivia_questions_updated_at 
  BEFORE UPDATE ON public.trivia_questions 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
