-- Allow the user who created a Sociale to insert its round rows (edge function uses JWT).
-- Previously only SELECT existed on sociale_rounds, so batch insert after creating sociales failed RLS.

CREATE POLICY "Sociale creators can insert rounds"
  ON sociale_rounds FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM sociales
      WHERE sociales.id = sociale_id
      AND sociales.created_by = auth.uid()
    )
  );
