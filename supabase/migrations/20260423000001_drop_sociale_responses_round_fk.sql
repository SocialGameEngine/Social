-- =============================================================================
-- DROP FOREIGN KEY ON sociale_responses.round_id
-- =============================================================================
-- Ambient sociales use ambient_rounds IDs as round_id, not sociale_rounds IDs.
-- The FK to sociale_rounds prevents inserting responses for ambient rounds.
-- Validation is enforced at the application layer (sociales-submit-response).

ALTER TABLE sociale_responses
  DROP CONSTRAINT IF EXISTS sociale_responses_round_id_fkey;
