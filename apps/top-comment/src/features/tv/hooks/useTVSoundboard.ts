import { useEffect, useRef } from "react";
import { useHostSignals } from "../../room/hooks/useHostSignals";

/**
 * TV-side listener for host soundboard cues (P1-4).
 *
 * The host broadcasts `sound:play { id }`; this hook receives the cue and
 * plays a matching audio file from `/public/audio/{id}.mp3`. If the file
 * isn't present (expected initially), we degrade to a short Web Audio beep
 * per cue so the host sees confirmation even before real assets ship.
 *
 * Roadmap: drop real mp3s at /public/audio/{drumroll,cheer,boo,fail,applause,lobby}.mp3
 * to light up authentic pub-quiz SFX.
 */

const FREQUENCY_BY_ID: Record<string, number> = {
  drumroll: 120,
  cheer: 660,
  boo: 200,
  fail: 180,
  applause: 520,
  lobby: 440,
  ding: 880,
  buzz: 300,
  confetti: 740,
};

export function useTVSoundboard(roomId: string | null | undefined) {
  const { signals } = useHostSignals(roomId ?? null);
  const lastNonceRef = useRef<number | null>(null);
  const ctxRef = useRef<AudioContext | null>(null);

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
        try {
          if (!ctxRef.current) {
            ctxRef.current = new (window.AudioContext ||
              (window as any).webkitAudioContext)();
          }
          const ctx = ctxRef.current;
          if (!ctx) return;
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
