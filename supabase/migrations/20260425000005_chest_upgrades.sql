-- Chest Upgrades Migration (P2-12)
-- Adds roguelike-style upgrade system for chest rounds

CREATE TABLE sociale_chest_upgrades (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sociale_id       UUID NOT NULL REFERENCES sociales(id) ON DELETE CASCADE,
  socialite_id     UUID NOT NULL REFERENCES socialites(id) ON DELETE CASCADE,
  applies_to_round INTEGER NOT NULL,     -- round index the buff fires in
  upgrade_id       TEXT NOT NULL,         -- string key from upgradePool
  upgrade_json     JSONB NOT NULL,        -- full effect descriptor
  consumed         BOOLEAN NOT NULL DEFAULT FALSE,
  awarded_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (sociale_id, socialite_id, applies_to_round)
);

-- Index for chest upgrade queries
CREATE INDEX idx_chest_upgrades_sociale ON sociale_chest_upgrades (sociale_id, applies_to_round);
CREATE INDEX idx_chest_upgrades_socialite ON sociale_chest_upgrades (socialite_id, consumed);

-- Add chest frequency setting to sociales
ALTER TABLE sociales
  ADD COLUMN chest_every_n_rounds INTEGER NOT NULL DEFAULT 5;
