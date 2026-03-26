-- Create database views to provide type-safe access to trivia tables
-- This avoids the need for complex type augmentation

CREATE OR REPLACE VIEW trivia_submissions_view AS
SELECT 
  id,
  interaction_id,
  room_id,
  member_id,
  submitted_at,
  latency_ms,
  payload,
  status
FROM trivia_submissions;

CREATE OR REPLACE VIEW trivia_evaluations_view AS
SELECT 
  id,
  submission_id,
  interaction_id,
  room_id,
  member_id,
  result,
  points_awarded,
  method,
  confidence,
  matched_alias,
  reasoning_short,
  grader_version,
  judged_at
FROM trivia_evaluations;

-- Grant access to these views
GRANT SELECT ON trivia_submissions_view TO authenticated;
GRANT SELECT ON trivia_evaluations_view TO authenticated;
