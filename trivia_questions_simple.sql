-- ============================================================================
-- TRIVIA QUESTION PACK AND QUESTIONS (Simple Version)
-- ============================================================================
-- This script creates a proper trivia question pack with questions using the existing trivia schema
-- Run this in Supabase SQL Editor
-- ============================================================================

-- Step 1: Create a trivia question pack with auto-generated UUID
INSERT INTO trivia_question_packs (id, name, description, status) VALUES
  (gen_random_uuid(), 'General Knowledge Test', 'A mix of general knowledge trivia questions for testing', 'published')
RETURNING id; -- This will show us the generated UUID

-- Step 2: Use the returned UUID to insert questions
-- Replace the UUID below with the one returned from the first query
INSERT INTO trivia_questions (pack_id, format, category_key, difficulty, prompt, explanation, status) VALUES 
  ('REPLACE_WITH_UUID', 'written_answer', 'geography', 'easy', 'What is the capital of France?', 'Paris is the capital and largest city of France.', 'published'),
  ('REPLACE_WITH_UUID', 'written_answer', 'art', 'easy', 'Who painted the Mona Lisa?', 'Leonardo da Vinci painted the Mona Lisa in the early 16th century.', 'published'),
  ('REPLACE_WITH_UUID', 'written_answer', 'science', 'easy', 'What is the largest planet in our solar system?', 'Jupiter is the largest planet in our solar system.', 'published'),
  ('REPLACE_WITH_UUID', 'written_answer', 'history', 'medium', 'In which year did World War II end?', 'World War II ended in 1945.', 'published'),
  ('REPLACE_WITH_UUID', 'written_answer', 'science', 'easy', 'What is the chemical symbol for gold?', 'The chemical symbol for gold is Au, from the Latin word aurum.', 'published'),
  ('REPLACE_WITH_UUID', 'written_answer', 'literature', 'easy', 'Who wrote "Romeo and Juliet"?', 'William Shakespeare wrote Romeo and Juliet around 1594-1596.', 'published'),
  ('REPLACE_WITH_UUID', 'written_answer', 'geography', 'medium', 'What is the smallest country in the world?', 'Vatican City is the smallest country in the world by area.', 'published'),
  ('REPLACE_WITH_UUID', 'written_answer', 'geography', 'easy', 'How many continents are there on Earth?', 'There are 7 continents: Africa, Antarctica, Asia, Europe, North America, South America, and Australia/Oceania.', 'published'),
  ('REPLACE_WITH_UUID', 'written_answer', 'science', 'medium', 'What is the speed of light in vacuum?', 'The speed of light in vacuum is approximately 299,792,458 meters per second.', 'published'),
  ('REPLACE_WITH_UUID', 'written_answer', 'history', 'easy', 'Who invented the telephone?', 'Alexander Graham Bell is credited with inventing the telephone in 1876.', 'published');
