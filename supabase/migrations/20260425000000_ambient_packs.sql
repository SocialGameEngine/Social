-- Ambient Packs Migration (AON-3 GAP 4)
-- Adds pack-based organization to ambient_rounds

-- Create ambient_packs table
CREATE TABLE ambient_packs (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name         TEXT NOT NULL,
  description  TEXT,
  emoji        TEXT DEFAULT '📦',
  is_default   BOOLEAN NOT NULL DEFAULT FALSE,
  sort_order   INTEGER NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Only one default at a time (partial unique index)
CREATE UNIQUE INDEX ambient_packs_one_default
  ON ambient_packs ((is_default)) WHERE is_default = TRUE;

-- Seed General default pack
INSERT INTO ambient_packs (id, name, description, emoji, is_default, sort_order)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'General',
  'Default general knowledge pack',
  '🌍',
  TRUE,
  0
) ON CONFLICT DO NOTHING;

-- Add pack_id to ambient_rounds
ALTER TABLE ambient_rounds
  ADD COLUMN pack_id UUID REFERENCES ambient_packs(id);

-- Migrate existing rounds to General pack
UPDATE ambient_rounds
SET pack_id = '00000000-0000-0000-0000-000000000001'::uuid
WHERE pack_id IS NULL;

-- Make pack_id NOT NULL after migration
ALTER TABLE ambient_rounds
  ALTER COLUMN pack_id SET NOT NULL;

-- Replace global unique order_index with (pack_id, order_index)
DROP INDEX IF EXISTS ambient_rounds_order_index_idx;
CREATE UNIQUE INDEX ambient_rounds_pack_order_idx
  ON ambient_rounds (pack_id, order_index);

-- Add ambient_pack_id to sociales
ALTER TABLE sociales
  ADD COLUMN ambient_pack_id UUID REFERENCES ambient_packs(id);

-- If any existing ambient sociales exist, point them to General pack
UPDATE sociales
SET ambient_pack_id = '00000000-0000-0000-0000-000000000001'::uuid
WHERE mode = 'ambient' AND ambient_pack_id IS NULL;

-- Enable RLS for ambient_packs
ALTER TABLE ambient_packs ENABLE ROW LEVEL SECURITY;

-- Policies for ambient_packs
CREATE POLICY ambient_packs_read ON ambient_packs FOR SELECT USING (TRUE);
CREATE POLICY ambient_packs_write ON ambient_packs FOR ALL
  USING (auth.role() = 'service_role');

-- Add indexes for performance
CREATE INDEX ambient_packs_sort_order ON ambient_packs (sort_order);
