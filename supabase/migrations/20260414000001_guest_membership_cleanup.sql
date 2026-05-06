-- =============================================================================
-- GUEST MEMBERSHIP CLEANUP
-- =============================================================================
-- Guest memberships (user_id IS NULL) are ephemeral — once a browser session
-- ends there is no way to reclaim them. This migration:
--   1. Fixes the FK on socialites.membership_id → ON DELETE SET NULL so
--      deleting a guest membership preserves the socialite for leaderboards.
--   2. Adds two cleanup functions (global age-based + room-scoped).
--   3. Adds a trigger that cleans guest memberships when a room is archived.
--   4. Schedules the global cleanup via pg_cron (requires pg_cron extension).
-- =============================================================================


-- -----------------------------------------------------------------------------
-- 1. Fix FK: socialites.membership_id → ON DELETE SET NULL
-- -----------------------------------------------------------------------------
-- Default (no action) prevents deleting a room_membership that is still
-- referenced by a socialite. Changing to SET NULL lets us delete the membership
-- while keeping the socialite record intact for historical scores/leaderboards.

ALTER TABLE socialites
  DROP CONSTRAINT IF EXISTS socialites_membership_id_fkey,
  ADD CONSTRAINT socialites_membership_id_fkey
    FOREIGN KEY (membership_id)
    REFERENCES room_memberships(id)
    ON DELETE SET NULL;


-- -----------------------------------------------------------------------------
-- 2a. Global cleanup: delete all stale guest memberships by age
-- -----------------------------------------------------------------------------
-- Uses created_at rather than last_active_at because guest sessions can never
-- be reclaimed — a 48-hour-old guest row is permanently stale regardless of
-- whether the player was active near the end of that window.

CREATE OR REPLACE FUNCTION cleanup_guest_memberships()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  WITH deleted AS (
    DELETE FROM room_memberships
    WHERE user_id IS NULL
      AND created_at < NOW() - INTERVAL '48 hours'
    RETURNING id
  )
  SELECT COUNT(*) INTO deleted_count FROM deleted;

  RETURN deleted_count;
END;
$$;


-- -----------------------------------------------------------------------------
-- 2b. Room-scoped cleanup: delete all guest memberships for a specific room
-- -----------------------------------------------------------------------------
-- Called immediately when a sociale ends or a room is archived so guest rows
-- are removed promptly rather than waiting for the next hourly cron pass.

CREATE OR REPLACE FUNCTION cleanup_guest_memberships_for_room(p_room_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  WITH deleted AS (
    DELETE FROM room_memberships
    WHERE room_id = p_room_id
      AND user_id IS NULL
    RETURNING id
  )
  SELECT COUNT(*) INTO deleted_count FROM deleted;

  RETURN deleted_count;
END;
$$;


-- -----------------------------------------------------------------------------
-- 3. Trigger: clean guest memberships when a room is archived
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION trigger_cleanup_guests_on_room_archive()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Only fire when status transitions TO 'archived'
  IF NEW.status = 'archived' AND OLD.status IS DISTINCT FROM 'archived' THEN
    PERFORM cleanup_guest_memberships_for_room(NEW.id);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS cleanup_guests_on_room_archive ON rooms;
CREATE TRIGGER cleanup_guests_on_room_archive
  AFTER UPDATE OF status ON rooms
  FOR EACH ROW
  EXECUTE FUNCTION trigger_cleanup_guests_on_room_archive();


-- -----------------------------------------------------------------------------
-- 4. Schedule hourly global cleanup via pg_cron
-- -----------------------------------------------------------------------------
-- Requires the pg_cron extension to be enabled in the Supabase dashboard
-- (Database → Extensions → pg_cron).  Safe to run even if some rooms already
-- had their guests cleaned eagerly by the trigger or edge function.
-- Only runs if pg_cron extension is available

DO $$
BEGIN
  -- Check if cron schema exists (pg_cron extension is enabled)
  IF EXISTS (
    SELECT 1 FROM information_schema.schemata 
    WHERE schema_name = 'cron'
  ) THEN
    PERFORM cron.schedule(
      'cleanup-guest-memberships',   -- job name (idempotent)
      '0 * * * *',                   -- every hour on the hour
      'SELECT cleanup_guest_memberships()'
    );
  END IF;
END $$;
