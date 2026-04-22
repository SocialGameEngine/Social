import { useCallback, useRef, useState } from 'react';
import { supabase } from '../../../supabase/client';

interface RoundAudioEditorProps {
  /** Round currently on screen — audio is attached to this row. */
  roundId: string;
  /** Existing round.settings so we can merge and not clobber other keys. */
  settings: Record<string, any> | null | undefined;
  /** Compact layout variant for inlining under the answer prompt. */
  compact?: boolean;
  /** Invalidate caches after a successful save. */
  onSaved?: () => void;
}

/**
 * P1-12 — quick host control for attaching an MP3 or YouTube link to the
 * currently-playing round. Intentionally minimal (no batch editor yet):
 *
 *   • MP3  → upload to the `question-audio` bucket, store public URL
 *   • YT   → paste watch URL, stored with kind='youtube' + start offset
 *
 * The saved shape is written to `sociale_rounds.settings.audio` so we avoid
 * touching the main column layer while the DB migration lands downstream.
 */
export function RoundAudioEditor({
  roundId,
  settings,
  compact,
  onSaved,
}: RoundAudioEditorProps) {
  const existing = (settings?.audio ?? {}) as {
    url?: string;
    kind?: 'mp3' | 'youtube';
    startSeconds?: number;
  };
  const [kind, setKind] = useState<'mp3' | 'youtube'>(existing.kind ?? 'mp3');
  const [url, setUrl] = useState<string>(existing.url ?? '');
  const [startSeconds, setStartSeconds] = useState<number>(existing.startSeconds ?? 0);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const saveAudio = useCallback(
    async (next: {
      url: string | null;
      kind: 'mp3' | 'youtube';
      startSeconds?: number;
    }) => {
      setBusy(true);
      setStatus(null);
      try {
        const nextSettings = {
          ...(settings ?? {}),
          audio: next.url ? next : null,
        };
        const { error } = await supabase
          .from('sociale_rounds')
          .update({
            settings: nextSettings,
            updated_at: new Date().toISOString(),
          })
          .eq('id', roundId);
        if (error) throw error;
        setStatus(next.url ? 'Saved' : 'Cleared');
        onSaved?.();
      } catch (err) {
        setStatus(err instanceof Error ? err.message : 'Save failed');
      } finally {
        setBusy(false);
      }
    },
    [roundId, settings, onSaved]
  );

  const onFilePicked = useCallback(
    async (file: File) => {
      setBusy(true);
      setStatus('Uploading…');
      try {
        const objectPath = `rounds/${roundId}-${Date.now()}-${file.name}`;
        const { error: uploadErr } = await supabase.storage
          .from('question-audio')
          .upload(objectPath, file, {
            contentType: file.type || 'audio/mpeg',
            upsert: true,
          });
        if (uploadErr) throw uploadErr;
        const { data: pub } = supabase.storage
          .from('question-audio')
          .getPublicUrl(objectPath);
        const publicUrl = pub?.publicUrl;
        if (!publicUrl) throw new Error('Missing public URL after upload');
        setUrl(publicUrl);
        setKind('mp3');
        await saveAudio({ url: publicUrl, kind: 'mp3', startSeconds: 0 });
      } catch (err) {
        setStatus(err instanceof Error ? err.message : 'Upload failed');
      } finally {
        setBusy(false);
      }
    },
    [roundId, saveAudio]
  );

  return (
    <div
      className={
        compact
          ? 'rounded-lg border border-slate-700 bg-slate-900/60 p-3 text-xs'
          : 'rounded-xl border border-slate-700 bg-slate-900 p-4 text-sm'
      }
    >
      <div className="flex items-center justify-between">
        <div className="font-bold text-slate-100">Question audio (optional)</div>
        {status && <div className="text-[11px] text-slate-400">{status}</div>}
      </div>

      <div className="mt-2 flex gap-2">
        <button
          type="button"
          onClick={() => setKind('mp3')}
          className={`rounded-md px-2 py-1 text-xs font-bold ${
            kind === 'mp3' ? 'bg-cyan-500 text-slate-900' : 'bg-slate-800 text-slate-300'
          }`}
        >
          MP3
        </button>
        <button
          type="button"
          onClick={() => setKind('youtube')}
          className={`rounded-md px-2 py-1 text-xs font-bold ${
            kind === 'youtube' ? 'bg-rose-500 text-slate-900' : 'bg-slate-800 text-slate-300'
          }`}
        >
          YouTube
        </button>
      </div>

      {kind === 'mp3' ? (
        <div className="mt-2 space-y-2">
          <div className="flex items-center gap-2">
            <input
              ref={fileRef}
              type="file"
              accept="audio/mpeg,audio/mp3,audio/wav,audio/ogg,audio/webm"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void onFilePicked(file);
              }}
            />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={busy}
              className="rounded-md bg-slate-800 px-3 py-1 text-xs font-bold text-slate-200 hover:bg-slate-700 disabled:opacity-40"
            >
              {busy ? '…' : 'Upload MP3'}
            </button>
            {url && (
              <button
                type="button"
                onClick={() =>
                  void saveAudio({ url: null, kind: 'mp3', startSeconds: 0 })
                }
                disabled={busy}
                className="rounded-md bg-slate-800 px-3 py-1 text-xs font-bold text-rose-300 hover:bg-slate-700 disabled:opacity-40"
              >
                Remove
              </button>
            )}
          </div>
          {url && <div className="truncate text-[11px] text-slate-400">{url}</div>}
        </div>
      ) : (
        <div className="mt-2 space-y-2">
          <input
            type="url"
            placeholder="https://youtu.be/…"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="w-full rounded-md bg-slate-800 px-2 py-1 text-xs text-slate-100 outline-none placeholder:text-slate-500"
          />
          <div className="flex items-center gap-2">
            <label className="text-[11px] text-slate-400">Start (s)</label>
            <input
              type="number"
              min={0}
              value={startSeconds}
              onChange={(e) => setStartSeconds(Math.max(0, Number(e.target.value) || 0))}
              className="w-16 rounded-md bg-slate-800 px-2 py-1 text-xs text-slate-100 outline-none"
            />
            <button
              type="button"
              onClick={() =>
                void saveAudio({
                  url: url.trim() || null,
                  kind: 'youtube',
                  startSeconds,
                })
              }
              disabled={busy}
              className="ml-auto rounded-md bg-cyan-500 px-3 py-1 text-xs font-bold text-slate-900 hover:bg-cyan-400 disabled:opacity-40"
            >
              Save
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default RoundAudioEditor;
