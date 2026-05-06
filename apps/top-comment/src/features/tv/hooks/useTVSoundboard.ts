import { useEffect, useRef } from "react";
import { useHostSignals } from "../../room/hooks/useHostSignals";

/**
 * TV-side listener for host soundboard cues (P1-4).
 *
 * The host broadcasts `sound:play { id }`; this hook receives the cue and
 * plays a matching audio file from `/public/audio/{id}.mp3`. If the file
 * isn't present, we fall back to a Web Audio beep.
 *
 * Browser autoplay policy: AudioContext can only be created/resumed after a
 * user gesture. We unlock it lazily on first click so the TV operator just
 * taps the screen once (which happens naturally at game start).
 */

const FREQUENCY_BY_ID: Record<string, number> = {
  drumroll: 120,
  cheer:    660,
  boo:      200,
  fail:     180,
  applause: 520,
  lobby:    440,
  ding:     880,
  buzz:     300,
  confetti: 740,
};

export function useTVSoundboard(roomId: string | null | undefined) {
  const { signals } = useHostSignals(roomId ?? null);
  const lastNonceRef = useRef<number | null>(null);
  const ctxRef = useRef<AudioContext | null>(null);
  const unlockedRef = useRef(false);

  // Prime AudioContext on first user gesture so the beep fallback works.
  useEffect(() => {
    const unlock = async () => {
      if (unlockedRef.current) return;
      unlockedRef.current = true;
      try {
        if (!ctxRef.current) {
          ctxRef.current = new (window.AudioContext ||
            (window as any).webkitAudioContext)();
        }
        if (ctxRef.current.state === "suspended") {
          await ctxRef.current.resume();
        }
      } catch {
        // Best-effort — audio is not critical.
      }
    };

    document.addEventListener("click", unlock, { once: true });
    document.addEventListener("touchend", unlock, { once: true });
    return () => {
      document.removeEventListener("click", unlock);
      document.removeEventListener("touchend", unlock);
    };
  }, []);

  useEffect(() => {
    const sound = signals.lastSound;
    if (!sound) return;
    if (lastNonceRef.current === sound.nonce) return;
    lastNonceRef.current = sound.nonce;

    const audioUrl = `/audio/${sound.id}.mp3`;
    const audio = new Audio(audioUrl);
    audio.volume = 0.85;
    const playPromise = audio.play();

    if (playPromise && typeof playPromise.catch === "function") {
      playPromise.catch(() => {
        // MP3 not found or autoplay blocked — fall back to Web Audio beep,
        // but only if the AudioContext was already unlocked by a user gesture.
        if (!unlockedRef.current || !ctxRef.current) return;
        try {
          const ctx = ctxRef.current;
          if (ctx.state === "suspended") return; // Not yet resumed, skip.
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = sound.id === "drumroll" ? "square" : "sine";
          osc.frequency.value = FREQUENCY_BY_ID[sound.id] ?? 440;
          gain.gain.setValueAtTime(0.0001, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.4, ctx.currentTime + 0.05);
          gain.gain.exponentialRampToValueAtTime(
            0.0001,
            ctx.currentTime + 0.6
          );
          osc.connect(gain).connect(ctx.destination);
          osc.start(ctx.currentTime);
          osc.stop(ctx.currentTime + 0.65);
        } catch {
          // Swallow — audio is best-effort.
        }
      });
    }
  }, [signals.lastSound]);
}

export default useTVSoundboard;
