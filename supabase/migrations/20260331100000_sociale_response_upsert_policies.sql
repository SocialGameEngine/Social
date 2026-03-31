-- Allow Socialites to update their own responses.
-- Needed for "upsert" behavior in `sociales-submit-response` so players can't
-- create duplicate responses by submitting multiple times.

CREATE POLICY "Socialites can update their own response"
  ON sociale_responses FOR UPDATE
  USING (
    EXISTS (
      SELECT 1
      FROM socialites
      WHERE socialites.id = sociale_responses.socialite_id
        AND socialites.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM socialites
      WHERE socialites.id = sociale_responses.socialite_id
        AND socialites.user_id = auth.uid()
    )
  );

-- Allow inserting score events (edge functions may insert score events
-- when scoring is non-zero).
CREATE POLICY "Socialites can insert their own score events"
  ON sociale_score_events FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM socialites
      WHERE socialites.id = sociale_score_events.socialite_id
        AND socialites.user_id = auth.uid()
    )
  );

