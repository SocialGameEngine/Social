-- ============================================================================
-- TRIVIA QUESTION PACK AND QUESTIONS
-- ============================================================================
-- This script creates a proper trivia question pack with questions using the existing trivia schema
-- Run this in Supabase SQL Editor
-- ============================================================================

-- Step 1: Create a trivia question pack with auto-generated UUID
INSERT INTO trivia_question_packs (id, name, description, status) VALUES
  (gen_random_uuid(), 'General Knowledge Test', 'A mix of general knowledge trivia questions for testing', 'published');

-- Step 2: Get the pack ID we just created and insert questions
-- We need to use a CTE (Common Table Expression) to get the pack ID and use it in the questions
WITH pack_id AS (
  SELECT id FROM trivia_question_packs WHERE name = 'General Knowledge Test' ORDER BY created_at DESC LIMIT 1
)
INSERT INTO trivia_questions (pack_id, format, category_key, difficulty, prompt, explanation, status) 
SELECT 
  pack_id.id,
  'written_answer', 
  'geography', 
  'easy', 
  'What is the capital of France?', 
  'Paris is the capital and largest city of France.', 
  'published'
FROM pack_id
UNION ALL
SELECT 
  pack_id.id,
  'written_answer', 
  'art', 
  'easy', 
  'Who painted the Mona Lisa?', 
  'Leonardo da Vinci painted the Mona Lisa in the early 16th century.', 
  'published'
FROM pack_id
UNION ALL
SELECT 
  pack_id.id,
  'written_answer', 
  'science', 
  'easy', 
  'What is the largest planet in our solar system?', 
  'Jupiter is the largest planet in our solar system.', 
  'published'
FROM pack_id
UNION ALL
SELECT 
  pack_id.id,
  'written_answer', 
  'history', 
  'medium', 
  'In which year did World War II end?', 
  'World War II ended in 1945.', 
  'published'
FROM pack_id
UNION ALL
SELECT 
  pack_id.id,
  'written_answer', 
  'science', 
  'easy', 
  'What is the chemical symbol for gold?', 
  'The chemical symbol for gold is Au, from the Latin word aurum.', 
  'published'
FROM pack_id
UNION ALL
SELECT 
  pack_id.id,
  'written_answer', 
  'literature', 
  'easy', 
  'Who wrote "Romeo and Juliet"?', 
  'William Shakespeare wrote Romeo and Juliet around 1594-1596.', 
  'published'
FROM pack_id
UNION ALL
SELECT 
  pack_id.id,
  'written_answer', 
  'geography', 
  'medium', 
  'What is the smallest country in the world?', 
  'Vatican City is the smallest country in the world by area.', 
  'published'
FROM pack_id
UNION ALL
SELECT 
  pack_id.id,
  'written_answer', 
  'geography', 
  'easy', 
  'How many continents are there on Earth?', 
  'There are 7 continents: Africa, Antarctica, Asia, Europe, North America, South America, and Australia/Oceania.', 
  'published'
FROM pack_id
UNION ALL
SELECT 
  pack_id.id,
  'written_answer', 
  'science', 
  'medium', 
  'What is the speed of light in vacuum?', 
  'The speed of light in vacuum is approximately 299,792,458 meters per second.', 
  'published'
FROM pack_id
UNION ALL
SELECT 
  pack_id.id,
  'written_answer', 
  'history', 
  'easy', 
  'Who invented the telephone?', 
  'Alexander Graham Bell is credited with inventing the telephone in 1876.', 
  'published'
FROM pack_id;
