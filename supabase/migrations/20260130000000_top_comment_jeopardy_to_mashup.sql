-- Migration: Convert top_comment_sessions from Jeopardy to Mashup
-- Version: 20260130000000_top_comment_jeopardy_to_mashup

-- Step 1: Backup existing data (filtering for top-comment sessions that were jeopardy)
-- This allows recovery if the data transformation needs to be inspected.
CREATE TABLE IF NOT EXISTS top_comment_jeopardy_backup AS 
SELECT * FROM top_comment_sessions WHERE settings->>'gameMode' = 'jeopardy';

-- Step 2: Add Mashup columns
-- These columns store the library rotation state.
ALTER TABLE top_comment_sessions 
ADD COLUMN IF NOT EXISTS selected_libraries TEXT[],
ADD COLUMN IF NOT EXISTS current_library_index INTEGER DEFAULT 0;

-- Step 3: Convert category grid to selected libraries and update settings
-- We extract the category IDs from the JSONB grid and put them into the new flat array.
-- We also update the settings JSONB to reflect the new mode and transition timer.
UPDATE top_comment_sessions 
SET 
  selected_libraries = ARRAY(
    SELECT jsonb_array_elements_text(category_grid->'categories'->'id')
  ),
  current_library_index = 0,
  settings = settings || jsonb_build_object(
    'gameMode', 'mashup',
    'librarySetupSecs', 30
  )
WHERE settings->>'gameMode' = 'jeopardy' 
  AND category_grid IS NOT NULL;

-- Step 4: Clean up old column
-- The category_grid is no longer used in Mashup mode.
ALTER TABLE top_comment_sessions 
DROP COLUMN IF EXISTS category_grid;

-- Step 5: Update the status constraint if one exists
-- Some environments use a status constraint to prevent invalid states.
-- If 'category-select' was a restricted status, we would update it here,
-- but typically status is just a text column in this project.
