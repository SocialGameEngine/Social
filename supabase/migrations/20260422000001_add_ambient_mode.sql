-- Add 'ambient' to the sociales mode check constraint
ALTER TABLE sociales DROP CONSTRAINT IF EXISTS sociales_mode_check;
ALTER TABLE sociales ADD CONSTRAINT sociales_mode_check
  CHECK (mode IN ('topics_only', 'trivia_only', 'alternating', 'custom', 'ambient'));
