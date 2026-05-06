-- Storage buckets for picture and photo round types.
-- sociale-photos: host-uploaded question images (picture rounds)
-- sociale-audio:  host-uploaded audio clips (future audio rounds)

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  (
    'sociale-photos',
    'sociale-photos',
    false,
    5242880, -- 5 MB
    ARRAY['image/jpeg', 'image/png', 'image/webp']
  ),
  (
    'sociale-audio',
    'sociale-audio',
    false,
    10485760, -- 10 MB
    ARRAY['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/webm']
  )
ON CONFLICT (id) DO NOTHING;

-- ── RLS policies ──────────────────────────────────────────────────────────────

-- sociale-photos: hosts can upload; authenticated users can read
CREATE POLICY "hosts can upload sociale photos"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'sociale-photos'
  );

CREATE POLICY "authenticated users can read sociale photos"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'sociale-photos'
  );

CREATE POLICY "hosts can delete own sociale photos"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'sociale-photos'
    AND owner = auth.uid()
  );

-- sociale-audio: same pattern
CREATE POLICY "hosts can upload sociale audio"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'sociale-audio'
  );

CREATE POLICY "authenticated users can read sociale audio"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'sociale-audio'
  );

CREATE POLICY "hosts can delete own sociale audio"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'sociale-audio'
    AND owner = auth.uid()
  );
