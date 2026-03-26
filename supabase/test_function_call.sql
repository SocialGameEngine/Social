-- Test the actual function call to see what it returns
-- Replace with your actual interaction and membership IDs

-- First get a real interaction and membership ID
SELECT 
  i.id as interaction_id,
  rm.id as membership_id,
  i.settings->'snapshot'->'multipleChoice'->>'correctOptionId' as expected_correct_answer
FROM interactions i
JOIN room_memberships rm ON rm.room_id = i.room_id
WHERE i.type = 'trivia' 
LIMIT 1;

-- Then test the function (replace IDs from above query)
/*
SELECT submit_trivia_answer(
  'interaction-id-from-above',
  'membership-id-from-above',
  '{"format": "multiple_choice", "selectedOptionId": "b"}'
);
*/
