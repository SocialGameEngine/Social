-- Migrate legacy ambient rounds to snapshot format
-- Converts flat settings.options[] format to settings.snapshot.multipleChoice format
-- Also populates the new explanation column from settings if present

UPDATE ambient_rounds
SET
  explanation = COALESCE(settings->>'explanation', NULL),
  settings = jsonb_set(
    settings,
    '{snapshot}',
    jsonb_build_object(
      'prompt', COALESCE(content, ''),
      'explanation', COALESCE(settings->>'explanation', NULL),
      'multipleChoice', jsonb_build_object(
        'options', (
          SELECT jsonb_agg(jsonb_build_object('id', opt->>'option_id', 'text', opt->>'option_text'))
          FROM jsonb_array_elements(settings->'options') AS opt
        ),
        'correctOptionId', (
          SELECT opt->>'option_id'
          FROM jsonb_array_elements(settings->'options') AS opt
          WHERE (opt->>'is_correct')::boolean = true
          LIMIT 1
        )
      )
    )
  )
WHERE type = 'trivia'
  AND settings ? 'options'
  AND NOT (settings ? 'snapshot');
