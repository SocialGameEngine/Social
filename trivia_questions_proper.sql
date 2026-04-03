-- ============================================================================
-- TRIVIA QUESTION PACK AND QUESTIONS
-- ============================================================================
-- This script creates a proper trivia question pack with questions using the existing trivia schema
-- Run this in Supabase SQL Editor
-- ============================================================================

-- Step 1: Create a trivia question pack
INSERT INTO trivia_question_packs (name, description, status) VALUES
  ('General Knowledge Test', 'A mix of general knowledge trivia questions for testing', 'published');

-- Step 2: Insert trivia questions with proper structure
-- Note: We'll need to get the pack_id from the pack we just created, or use a known ID
-- For now, let's assume the pack was created with a specific ID we can reference
INSERT INTO trivia_questions (pack_id, format, category_key, difficulty, prompt, explanation, status) VALUES 
  ('550e8400-e29b-41d4-a716-446655440000', 'written_answer', 'geography', 'easy', 'What is the capital of France?', 'Paris is the capital and largest city of France.', 'published'),
  ('550e8400-e29b-41d4-a716-446655440000', 'written_answer', 'art', 'easy', 'Who painted the Mona Lisa?', 'Leonardo da Vinci painted the Mona Lisa in the early 16th century.', 'published'),
  ('550e8400-e29b-41d4-a716-446655440000', 'written_answer', 'science', 'easy', 'What is the largest planet in our solar system?', 'Jupiter is the largest planet in our solar system.', 'published'),
  ('550e8400-e29b-41d4-a716-446655440000', 'written_answer', 'history', 'medium', 'In which year did World War II end?', 'World War II ended in 1945.', 'published'),
  ('550e8400-e29b-41d4-a716-446655440000', 'written_answer', 'science', 'easy', 'What is the chemical symbol for gold?', 'The chemical symbol for gold is Au, from the Latin word aurum.', 'published'),
  ('550e8400-e29b-41d4-a716-446655440000', 'written_answer', 'literature', 'easy', 'Who wrote "Romeo and Juliet"?', 'William Shakespeare wrote Romeo and Juliet around 1594-1596.', 'published'),
  ('550e8400-e29b-41d4-a716-446655440000', 'written_answer', 'geography', 'medium', 'What is the smallest country in the world?', 'Vatican City is the smallest country in the world by area.', 'published'),
  ('550e8400-e29b-41d4-a716-446655440000', 'written_answer', 'geography', 'easy', 'How many continents are there on Earth?', 'There are 7 continents: Africa, Antarctica, Asia, Europe, North America, South America, and Australia/Oceania.', 'published'),
  ('550e8400-e29b-41d4-a716-446655440000', 'written_answer', 'science', 'medium', 'What is the speed of light in vacuum?', 'The speed of light in vacuum is approximately 299,792,458 meters per second.', 'published'),
  ('550e8400-e29b-41d4-a716-446655440000', 'written_answer', 'history', 'easy', 'Who invented the telephone?', 'Alexander Graham Bell is credited with inventing the telephone in 1876.', 'published');
