-- Season auto-create cron job (T3-3).
-- Runs on the 1st of each month at 00:05 UTC.
-- Inserts a new season row if none exists for the current calendar month.
-- Requires pg_cron (enabled by default on Supabase).

SELECT cron.schedule(
  'seasons-auto-create',   -- job name (unique)
  '5 0 1 * *',             -- At 00:05 on the 1st of every month
  $$
    INSERT INTO seasons (name, starts_at, ends_at, status)
    SELECT
      to_char(date_trunc('month', now()), 'Month YYYY'),
      date_trunc('month', now())::date,
      (date_trunc('month', now()) + interval '1 month' - interval '1 day')::date,
      'active'
    WHERE NOT EXISTS (
      SELECT 1 FROM seasons
      WHERE starts_at = date_trunc('month', now())::date
    );
    -- Mark previous season(s) as completed
    UPDATE seasons
    SET status = 'completed'
    WHERE status = 'active'
      AND ends_at < current_date;
  $$
);
