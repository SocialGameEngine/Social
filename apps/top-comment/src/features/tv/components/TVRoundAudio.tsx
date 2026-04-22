import { useEffect, useRef } from 'react';

interface TVRoundAudioProps {
  /** MP3 URL or YouTube watch/share URL attached to the current round. */
  url?: string | null;
  /** How to interpret `url`. Defaults to 'mp3'. */
  kind?: 'mp3' | 'youtube' | null;
  /** Offset (seconds) to start the clip at — only applied to YouTube. */
  startSeconds?: number | null;
  /** Current TV phase so we can mute/fade during reveal and beyond. */
  phase?: string | null;
  /** Round id, used as a key to fully remount the audio on round change. */
  roundKey?: string | null;
}

/**
 * P1-12 — plays the per-question audio clip on the /tv surface during the
 * answer phase. Fades out once the phase moves past `answer` so it never steps
 * on the reveal drumroll. MP3s stream via <audio>; YouTube links use a hidden
 * embed so hosts can paste share URLs without a dedicated mp3 asset.
 */
export function TVRoundAudio({
  url,
  kind,
  startSeconds,
  phase,
  roundKey,
}: TVRoundAudioProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const shouldPlay = Boolean(url) && phase === 'answer';

  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    if (!shouldPlay) {
      // Graceful fade so the reveal drumroll has clean air.
      const start = el.volume;
      const steps = 10;
      let i = 0;
      const id = window.setInterval(() => {
        i += 1;
        if (!audioRef.current) return window.clearInterval(id);
        audioRef.current.volume = Math.max(0, start * (1 - i / steps));
        if (i >= steps) {
          window.clearInterval(id);
          audioRef.current?.pause();
        }
      }, 60);
      return () => window.clearInterval(id);
    }

    el.volume = 0.75;
    void el.play().catch(() => {
      // Autoplay can be blocked when /tv hasn't been interacted with yet. We
      // swallow the error — the host can kick it off by clicking the screen.
    });
  }, [shouldPlay, url, roundKey]);

  if (!url) return null;

  if (kind === 'youtube') {
    const videoId = parseYouTubeId(url);
    if (!videoId) return null;
    const src =
      `https://www.youtube.com/embed/${videoId}` +
      `?autoplay=${shouldPlay ? 1 : 0}` +
      `&start=${Math.max(0, Math.floor(startSeconds ?? 0))}` +
      `&controls=0&modestbranding=1&rel=0&playsinline=1`;
    // Hidden 1x1 iframe so audio plays but video doesn't take over the TV.
    return (
      <iframe
        key={`${roundKey}-${shouldPlay ? 'on' : 'off'}`}
        title="Round audio"
        src={src}
        width={1}
        height={1}
        className="pointer-events-none fixed -left-10 -top-10 opacity-0"
        allow="autoplay; encrypted-media"
      />
    );
  }

  return (
    <audio
      ref={audioRef}
      key={roundKey ?? 'round-audio'}
      src={url}
      preload="auto"
      className="hidden"
    />
  );
}

function parseYouTubeId(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname.includes('youtu.be')) {
      return u.pathname.replace('/', '') || null;
    }
    if (u.searchParams.has('v')) return u.searchParams.get('v');
    const parts = u.pathname.split('/');
    const embedIdx = parts.indexOf('embed');
    if (embedIdx >= 0 && parts[embedIdx + 1]) return parts[embedIdx + 1];
    return null;
  } catch {
    return null;
  }
}

export default TVRoundAudio;
