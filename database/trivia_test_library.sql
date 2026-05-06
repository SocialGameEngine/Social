-- ============================================================================
-- TRIVIA TEST LIBRARY SEED DATA
-- ============================================================================
-- This script creates a test trivia library with 10 questions
-- Run this in Supabase SQL Editor
-- ============================================================================

-- Step 1: Insert the trivia test library
INSERT INTO prompt_libraries (id, name, emoji, description, is_active, sort_order) VALUES
  ('trivia-test', 'Trivia Test', '🧠', 'Test trivia library with 10 general knowledge questions.', true, 100)
ON CONFLICT (id) DO UPDATE SET 
  name = EXCLUDED.name, 
  emoji = EXCLUDED.emoji, 
  description = EXCLUDED.description,
  sort_order = EXCLUDED.sort_order;

-- Step 2: Insert 10 trivia questions
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES 
  ('trivia-test', 'What is the capital of France?', true, 0),
  ('trivia-test', 'Who painted the Mona Lisa?', true, 1),
  ('trivia-test', 'What is the largest planet in our solar system?', true, 2),
  ('trivia-test', 'In which year did World War II end?', true, 3),
  ('trivia-test', 'What is the chemical symbol for gold?', true, 4),
  ('trivia-test', 'Who wrote "Romeo and Juliet"?', true, 5),
  ('trivia-test', 'What is the smallest country in the world?', true, 6),
  ('trivia-test', 'How many continents are there on Earth?', true, 7),
  ('trivia-test', 'What is the speed of light in vacuum?', true, 8),
  ('trivia-test', 'Who invented the telephone?', true, 9)
ON CONFLICT DO NOTHING;
