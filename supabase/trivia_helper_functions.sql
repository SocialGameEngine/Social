-- Create helper function to get trivia submission with proper typing
CREATE OR REPLACE FUNCTION get_trivia_submission(
  p_interaction_id UUID,
  p_member_id UUID
)
RETURNS TABLE (
  id UUID,
  interaction_id UUID,
  room_id UUID,
  member_id UUID,
  submitted_at TIMESTAMPTZ,
  latency_ms INTEGER,
  payload JSONB,
  status TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ts.id,
    ts.interaction_id,
    ts.room_id,
    ts.member_id,
    ts.submitted_at,
    ts.latency_ms,
    ts.payload,
    ts.status
  FROM trivia_submissions ts
  WHERE ts.interaction_id = p_interaction_id
    AND ts.member_id = p_member_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create helper function to get trivia reveal data
CREATE OR REPLACE FUNCTION get_trivia_reveal(
  p_interaction_id UUID,
  p_member_id UUID
)
RETURNS TABLE (
  interaction_id UUID,
  correct_answer TEXT,
  explanation TEXT,
  total_responses BIGINT,
  correct_responses BIGINT,
  average_response_time NUMERIC
) AS $$
DECLARE
  v_interaction RECORD;
  v_correct_answer TEXT;
BEGIN
  -- Get interaction and extract correct answer
  SELECT settings INTO v_interaction
  FROM interactions 
  WHERE id = p_interaction_id;
  
  -- Extract correct answer from settings
  IF v_interaction.settings->>'format' = 'multiple_choice' THEN
    v_correct_answer := (v_interaction.settings#>>'{snapshot,multipleChoice,correctOptionId}');
  ELSIF v_interaction.settings->>'format' = 'written_answer' THEN
    v_correct_answer := (v_interaction.settings#>>'{snapshot,writtenAnswer,correctAnswer}');
  END IF;
  
  -- Return basic reveal data
  RETURN QUERY
  SELECT 
    p_interaction_id,
    v_correct_answer,
    COALESCE(v_interaction.settings#>>'{snapshot,explanation}', ''),
    COUNT(ts.id)::BIGINT,
    COUNT(CASE WHEN te.result = 'correct' THEN 1 END)::BIGINT,
    COALESCE(AVG(ts.latency_ms), 0)::NUMERIC
  FROM trivia_submissions ts
  LEFT JOIN trivia_evaluations te ON ts.id = te.submission_id
  WHERE ts.interaction_id = p_interaction_id
  GROUP BY p_interaction_id, v_correct_answer, v_interaction.settings#>>'{snapshot,explanation}';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create safe version of get_trivia_submission with proper return type
CREATE OR REPLACE FUNCTION get_trivia_submission_safe(
  p_interaction_id UUID,
  p_member_id UUID
)
RETURNS TABLE (
  id UUID,
  interaction_id UUID,
  room_id UUID,
  member_id UUID,
  submitted_at TIMESTAMPTZ,
  latency_ms INTEGER,
  payload JSONB,
  status TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ts.id,
    ts.interaction_id,
    ts.room_id,
    ts.member_id,
    ts.submitted_at,
    ts.latency_ms,
    ts.payload,
    ts.status
  FROM trivia_submissions ts
  WHERE ts.interaction_id = p_interaction_id
    AND ts.member_id = p_member_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create safe version of get_trivia_reveal with proper return type
CREATE OR REPLACE FUNCTION get_trivia_reveal_safe(
  p_interaction_id UUID,
  p_member_id UUID
)
RETURNS TABLE (
  interaction_id UUID,
  correct_answer TEXT,
  explanation TEXT,
  total_responses BIGINT,
  correct_responses BIGINT,
  average_response_time NUMERIC
) AS $$
DECLARE
  v_interaction RECORD;
  v_correct_answer TEXT;
BEGIN
  -- Get interaction and extract correct answer
  SELECT settings INTO v_interaction
  FROM interactions 
  WHERE id = p_interaction_id;
  
  -- Extract correct answer from settings
  IF v_interaction.settings->>'format' = 'multiple_choice' THEN
    v_correct_answer := (v_interaction.settings#>>'{snapshot,multipleChoice,correctOptionId}');
  ELSIF v_interaction.settings->>'format' = 'written_answer' THEN
    v_correct_answer := (v_interaction.settings#>>'{snapshot,writtenAnswer,correctAnswer}');
  END IF;
  
  -- Return basic reveal data
  RETURN QUERY
  SELECT 
    p_interaction_id,
    v_correct_answer,
    COALESCE(v_interaction.settings#>>'{snapshot,explanation}', ''),
    COUNT(ts.id)::BIGINT,
    COUNT(CASE WHEN te.result = 'correct' THEN 1 END)::BIGINT,
    COALESCE(AVG(ts.latency_ms), 0)::NUMERIC
  FROM trivia_submissions ts
  LEFT JOIN trivia_evaluations te ON ts.id = te.submission_id
  WHERE ts.interaction_id = p_interaction_id
  GROUP BY p_interaction_id, v_correct_answer, v_interaction.settings#>>'{snapshot,explanation}';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
