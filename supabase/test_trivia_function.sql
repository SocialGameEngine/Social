-- Test the current trivia function to see what it returns
-- Run this in Supabase SQL Editor to debug

-- First, let's see what a sample interaction looks like
SELECT 
  id,
  type,
  settings,
  settings->>'format' as format,
  settings->'snapshot' as snapshot,
  settings->'snapshot'->'multipleChoice' as multiple_choice_snapshot,
  settings->'snapshot'->'multipleChoice'->>'correctOptionId' as correct_option_id_old_way,
  settings#>>'{snapshot,multipleChoice,correctOptionId}' as correct_option_id_new_way
FROM interactions 
WHERE type = 'trivia' 
LIMIT 1;

-- Test the function with sample data (replace with actual IDs)
/*
SELECT submit_trivia_answer(
  'your-interaction-id-uuid',
  'your-membership-id-uuid', 
  '{"format": "multiple_choice", "selectedOptionId": "c"}'
);
*/
