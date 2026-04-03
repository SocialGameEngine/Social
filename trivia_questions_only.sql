-- ============================================================================
-- TRIVIA QUESTIONS ONLY (Using Existing Pack ID)
-- ============================================================================
-- This script inserts trivia questions using the existing pack ID
-- Run this in Supabase SQL Editor
-- ============================================================================

-- Insert trivia questions using the existing pack ID
INSERT INTO trivia_questions (pack_id, format, category_key, difficulty, prompt, explanation, status) VALUES 
  ('e155a8a0-b74c-477b-82cd-e3c159e9d326', 'written_answer', 'geography', 'easy', 'What is the capital of France?', 'Paris is the capital and largest city of France.', 'published'),
  ('e155a8a0-b74c-477b-82cd-e3c159e9d326', 'written_answer', 'art', 'easy', 'Who painted the Mona Lisa?', 'Leonardo da Vinci painted the Mona Lisa in the early 16th century.', 'published'),
  ('e155a8a0-b74c-477b-82cd-e3c159e9d326', 'written_answer', 'science', 'easy', 'What is the largest planet in our solar system?', 'Jupiter is the largest planet in our solar system.', 'published'),
  ('e155a8a0-b74c-477b-82cd-e3c159e9d326', 'written_answer', 'history', 'medium', 'In which year did World War II end?', 'World War II ended in 1945.', 'published'),
  ('e155a8a0-b74c-477b-82cd-e3c159e9d326', 'written_answer', 'science', 'easy', 'What is the chemical symbol for gold?', 'The chemical symbol for gold is Au, from the Latin word aurum.', 'published'),
  ('e155a8a0-b74c-477b-82cd-e3c159e9d326', 'written_answer', 'literature', 'easy', 'Who wrote "Romeo and Juliet"?', 'William Shakespeare wrote Romeo and Juliet around 1594-1596.', 'published'),
  ('e155a8a0-b74c-477b-82cd-e3c159e9d326', 'written_answer', 'geography', 'medium', 'What is the smallest country in the world?', 'Vatican City is the smallest country in the world by area.', 'published'),
  ('e155a8a0-b74c-477b-82cd-e3c159e9d326', 'written_answer', 'geography', 'easy', 'How many continents are there on Earth?', 'There are 7 continents: Africa, Antarctica, Asia, Europe, North America, South America, and Australia/Oceania.', 'published'),
  ('e155a8a0-b74c-477b-82cd-e3c159e9d326', 'written_answer', 'science', 'medium', 'What is the speed of light in vacuum?', 'The speed of light in vacuum is approximately 299,792,458 meters per second.', 'published'),
  ('e155a8a0-b74c-477b-82cd-e3c159e9d326', 'written_answer', 'history', 'easy', 'Who invented the telephone?', 'Alexander Graham Bell is credited with inventing the telephone in 1876.', 'published');
