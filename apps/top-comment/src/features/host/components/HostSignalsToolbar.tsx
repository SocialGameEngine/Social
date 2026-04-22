import { useCallback, useState } from "react";
import { motion } from "framer-motion";
import { useHostSignals } from "../../room/hooks/useHostSignals";
import { useHostHotkeys } from "../hooks/useHostHotkeys";
import { supabase } from "../../../supabase/client";

interface HostSignalsToolbarProps {
  /** Room id the host is controlling. Null until a room is picked. */
  roomId: string | null | undefined;
  /** Sociale id — required for P1-8 break controls. */
  socialeId?: string | null;
}

interface SoundboardCue {
  id: string;
  label: string;
  hotkey: string;
  emoji: string;
}

/**
 * Host-only toolbar (Wave 4). Groups four real-time primitives:
 *
 *   • P1-4: Soundboard cues (drumroll, cheer, boo, fail, applause, lobby).
 *           Keyboard hotkeys 1-6 fire cues; the TV plays the matching audio.
 *   • P1-6: "All Eyes Up" toggle — dims every RoomPage with an arrow.
 *   • P1-17: "Lock it in" toggle — forces confirmation on answer taps.
 *
 * Broadcasting goes through `useHostSignals` (supabase realtime broadcast).
 * The TV listens on the same channel and plays audio locally; phones listen
 * for attention + lock-in and render the matching UI.
 */
export function HostSignalsToolbar({ roomId, socialeId }: HostSignalsToolbarProps) {
  const { signals, send } = useHostSignals(roomId ?? null);
  const [expanded, setExpanded] = useState(false);
  const [breakBusy, setBreakBusy] = useState<null | number | 'resume'>(null);

  // P1-8 — call the dedicated edge function so both tables stay in sync.
  const callBreak = useCallback(
    async (minutes: 5 | 10 | 15 | null) => {
      if (!socialeId) return;
      setBreakBusy(minutes ?? 'resume');
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const headers = session?.access_token
          ? { Authorization: `Bearer ${session.access_token}` }
          : undefined;
        await supabase.functions.invoke('sociales-break', {
          headers,
          body: minutes === null ? { socialeId, resume: true } : { socialeId, minutes },
        });
      } finally {
        setBreakBusy(null);
      }
    },
    [socialeId]
  );

  const soundboard: SoundboardCue[] = [
    { id: "drumroll", label: "Drumroll", hotkey: "1", emoji: "🥁" },
    { id: "cheer", label: "Cheer", hotkey: "2", emoji: "🎉" },
    { id: "boo", label: "Boo", hotkey: "3", emoji: "👎" },
    { id: "fail", label: "Fail", hotkey: "4", emoji: "📯" },
    { id: "applause", label: "Applause", hotkey: "5", emoji: "👏" },
    { id: "lobby", label: "Lobby", hotkey: "6", emoji: "🎵" },
    { id: "ding", label: "Ding", hotkey: "7", emoji: "🔔" },
    { id: "buzz", label: "Buzz", hotkey: "8", emoji: "📢" },
    { id: "confetti", label: "Confetti", hotkey: "Y", emoji: "🎊" },
  ];

  useHostHotkeys({
    onSound: roomId
      ? (idx) => {
          const cue = soundboard[idx];
          if (cue) send("sound:play", { id: cue.id });
        }
      : undefined,
    onAttentionToggle: roomId
      ? () =>
          send(
            signals.attentionLocked ? "attention:release" : "attention:lock"
          )
      : undefined,
    onLockInToggle: roomId
      ? () => send("lockin:required", { enabled: !signals.lockInRequired })
      : undefined,
  });

  if (!roomId) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="fixed bottom-4 right-4 z-[45] flex flex-col items-end gap-2"
    >
      {expanded && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="flex flex-col gap-2 rounded-xl bg-slate-900/95 p-3 shadow-xl ring-1 ring-white/10 backdrop-blur-md"
          style={{ minWidth: 280 }}
        >
          <div className="flex flex-col gap-1">
            <p className="text-xs font-black uppercase tracking-wider text-slate-400">
              Host Controls
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              send(
                signals.attentionLocked ? "attention:release" : "attention:lock"
              )
            }
            className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm font-black uppercase tracking-wide transition ${
              signals.attentionLocked
                ? "bg-amber-500 text-amber-950 shadow-[0_4px_18px_rgba(251,191,36,0.5)]"
                : "bg-slate-800 text-slate-200 hover:bg-slate-700"
            }`}
            title="All Eyes Up (U)"
          >
            <span>⬆ All Eyes Up</span>
            <kbd className="rounded bg-black/30 px-1.5 py-0.5 text-[10px]">U</kbd>
          </button>

          <button
            type="button"
            onClick={() =>
              send("lockin:required", { enabled: !signals.lockInRequired })
            }
            className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm font-black uppercase tracking-wide transition ${
              signals.lockInRequired
                ? "bg-cyan-500 text-cyan-950 shadow-[0_4px_18px_rgba(6,182,212,0.5)]"
                : "bg-slate-800 text-slate-200 hover:bg-slate-700"
            }`}
            title="Require Lock-It-In (L)"
          >
            <span>✓ Lock-It-In</span>
            <kbd className="rounded bg-black/30 px-1.5 py-0.5 text-[10px]">L</kbd>
          </button>

          {socialeId && (
            <>
              <p className="mt-2 text-[10px] font-black uppercase tracking-wider text-slate-500">
                Intermission · drinks break
              </p>
              <div className="grid grid-cols-4 gap-2">
                {[5, 10, 15].map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => void callBreak(m as 5 | 10 | 15)}
                    disabled={breakBusy !== null}
                    className="rounded-lg bg-slate-800 px-2 py-2 text-xs font-bold text-slate-200 hover:bg-slate-700 disabled:opacity-40"
                  >
                    {breakBusy === m ? '…' : `${m} min`}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => void callBreak(null)}
                  disabled={breakBusy !== null}
                  className="rounded-lg bg-emerald-700 px-2 py-2 text-xs font-bold text-emerald-50 hover:bg-emerald-600 disabled:opacity-40"
                >
                  {breakBusy === 'resume' ? '…' : 'Resume'}
                </button>
              </div>
            </>
          )}

          <p className="mt-2 text-[10px] font-black uppercase tracking-wider text-slate-500">
            Soundboard · 1–9 + D C B F A L Y
          </p>
          <div className="grid grid-cols-4 gap-2">
            {soundboard.map((cue) => (
              <button
                key={cue.id}
                type="button"
                onClick={() => send("sound:play", { id: cue.id })}
                className="flex flex-col items-center rounded-lg bg-slate-800 px-2 py-2 text-xs font-bold text-slate-200 hover:bg-slate-700"
              >
                <span className="text-lg">{cue.emoji}</span>
                <span className="mt-0.5">{cue.label}</span>
                <kbd className="mt-1 rounded bg-black/30 px-1 text-[9px]">
                  {cue.hotkey}
                </kbd>
              </button>
            ))}
          </div>
        </motion.div>
      )}

      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="rounded-full bg-slate-800 px-4 py-2 text-xs font-black uppercase tracking-wider text-slate-200 shadow-lg ring-1 ring-white/10 hover:bg-slate-700"
        aria-expanded={expanded}
        aria-label="Toggle host signals toolbar"
      >
        {expanded ? "Close" : "Signals"}
      </button>
    </motion.div>
  );
}

export default HostSignalsToolbar;
