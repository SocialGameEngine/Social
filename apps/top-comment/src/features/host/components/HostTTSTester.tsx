import { useCallback, useState } from "react";
import {
  getPhaseAnnouncement,
  getRoundIntroAnnouncement,
  getTimerWarningAnnouncement,
  getVenueSponsorAnnouncement,
} from "../../tv/utils/tvAnnouncements";

/**
 * P1-16: dev/host panel to preview announcer strings with the browser TTS engine.
 */
export function HostTTSTester() {
  const [open, setOpen] = useState(false);

  const speak = useCallback((text: string) => {
    if (!text || typeof window === "undefined" || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 1;
    window.speechSynthesis.speak(u);
  }, []);

  if (!import.meta.env.DEV) {
    return null;
  }

  return (
    <div className="fixed top-24 right-4 z-[43] text-left">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="rounded-full bg-indigo-900/90 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-indigo-100 ring-1 ring-indigo-400/30"
      >
        TTS tester
      </button>
      {open && (
        <div className="mt-2 w-64 space-y-1 rounded-xl border border-white/10 bg-slate-950/95 p-3 shadow-xl backdrop-blur">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
            P1-16 samples
          </p>
          <button
            type="button"
            className="block w-full rounded bg-slate-800 py-1.5 text-xs text-slate-100 hover:bg-slate-700"
            onClick={() =>
              speak(
                getPhaseAnnouncement({
                  phase: "answer",
                  roundType: "trivia",
                  roundIndex: 2,
                  totalRounds: 5,
                  playerCount: 12,
                })
              )
            }
          >
            Phase · answer trivia
          </button>
          <button
            type="button"
            className="block w-full rounded bg-slate-800 py-1.5 text-xs text-slate-100 hover:bg-slate-700"
            onClick={() =>
              speak(
                getRoundIntroAnnouncement({
                  roundIndex: 2,
                  totalRounds: 5,
                  title: "Capital cities",
                  roundType: "trivia",
                  isFinalRound: true,
                })
              )
            }
          >
            Round intro · final
          </button>
          <button
            type="button"
            className="block w-full rounded bg-slate-800 py-1.5 text-xs text-slate-100 hover:bg-slate-700"
            onClick={() => speak(getTimerWarningAnnouncement(30))}
          >
            Timer · 30s
          </button>
          <button
            type="button"
            className="block w-full rounded bg-slate-800 py-1.5 text-xs text-slate-100 hover:bg-slate-700"
            onClick={() =>
              speak(
                getVenueSponsorAnnouncement({
                  venueName: "The Crown",
                  sponsorMessages: ["Proudly poured by Hop House"],
                })
              )
            }
          >
            Venue + sponsor
          </button>
        </div>
      )}
    </div>
  );
}

export default HostTTSTester;
