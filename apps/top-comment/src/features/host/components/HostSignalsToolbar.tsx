import { useCallback, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useHostSignals } from "../../room/hooks/useHostSignals";
import { useHostHotkeys } from "../hooks/useHostHotkeys";
import { supabase } from "../../../supabase/client";
import { useToast } from "../../../shared/hooks";

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
 * Host-only floating controls panel (Wave 4).
 *
 * Priority order inside the panel:
 *   1. Soundboard (P1-4) — horizontal scroll grid, always visible in panel
 *   2. Quick toggles: All Eyes Up (P1-6) + Lock-It-In (P1-17)
 *   3. Break controls (P1-8) — expandable via "More" when socialeId present
 *
 * Floats at bottom-right so it doesn't cover content on any screen size.
 */
export function HostSignalsToolbar({ roomId, socialeId }: HostSignalsToolbarProps) {
  const { signals, send } = useHostSignals(roomId ?? null);
  const { toast } = useToast();
  const [expanded, setExpanded] = useState(false);
  const [showBreaks, setShowBreaks] = useState(false);
  const [breakBusy, setBreakBusy] = useState<null | number | 'resume'>(null);

  const callBreak = useCallback(
    async (minutes: 5 | 10 | 15 | null) => {
      if (!socialeId) return;
      setBreakBusy(minutes ?? 'resume');
      try {
        // supabase.functions.invoke handles auth headers automatically
        const { error } = await supabase.functions.invoke('sociales-break', {
          body: minutes === null
            ? { socialeId, resume: true }
            : { socialeId, minutes },
        });
        if (error) throw error;
      } catch (err) {
        toast({
          title: 'Break failed',
          description: err instanceof Error ? err.message : 'Could not set break. Is the function deployed?',
          variant: 'error',
        });
      } finally {
        setBreakBusy(null);
      }
    },
    [socialeId, toast]
  );

  const soundboard: SoundboardCue[] = [
    { id: "drumroll",  label: "Drumroll", hotkey: "1", emoji: "🥁" },
    { id: "cheer",     label: "Cheer",    hotkey: "2", emoji: "🎉" },
    { id: "boo",       label: "Boo",      hotkey: "3", emoji: "👎" },
    { id: "fail",      label: "Fail",     hotkey: "4", emoji: "📯" },
    { id: "applause",  label: "Applause", hotkey: "5", emoji: "👏" },
    { id: "lobby",     label: "Lobby",    hotkey: "6", emoji: "🎵" },
    { id: "ding",      label: "Ding",     hotkey: "7", emoji: "🔔" },
    { id: "buzz",      label: "Buzz",     hotkey: "8", emoji: "📢" },
    { id: "confetti",  label: "Confetti", hotkey: "Y", emoji: "🎊" },
  ];

  useHostHotkeys({
    onSound: roomId
      ? (idx) => {
          const cue = soundboard[idx];
          if (cue) send("sound:play", { id: cue.id });
        }
      : undefined,
    onAttentionToggle: roomId
      ? () => send(signals.attentionLocked ? "attention:release" : "attention:lock")
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
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ duration: 0.15 }}
            className="flex flex-col gap-3 rounded-2xl bg-slate-900/97 p-4 shadow-2xl ring-1 ring-white/10 backdrop-blur-md"
            style={{ width: 280 }}
          >
            {/* ── 1. SOUNDBOARD (top priority) ── */}
            <div>
              <p className="mb-2 text-[10px] font-black uppercase tracking-wider text-slate-400">
                Soundboard · 1–9 Y
              </p>
              <div className="grid grid-cols-3 gap-1.5">
                {soundboard.map((cue) => (
                  <button
                    key={cue.id}
                    type="button"
                    onClick={() => send("sound:play", { id: cue.id })}
                    className="flex flex-col items-center rounded-xl bg-slate-800 px-2 py-2 text-[11px] font-bold text-slate-200 hover:bg-slate-700 active:scale-95 transition-all"
                  >
                    <span className="text-xl leading-none">{cue.emoji}</span>
                    <span className="mt-1">{cue.label}</span>
                    <kbd className="mt-0.5 rounded bg-black/30 px-1 text-[9px] text-slate-400">{cue.hotkey}</kbd>
                  </button>
                ))}
              </div>
            </div>

            {/* ── 2. QUICK TOGGLES ── */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => send(signals.attentionLocked ? "attention:release" : "attention:lock")}
                className={`flex-1 flex items-center justify-between rounded-lg px-3 py-2 text-[11px] font-black uppercase tracking-wide transition ${
                  signals.attentionLocked
                    ? "bg-amber-500 text-amber-950 shadow-[0_4px_18px_rgba(251,191,36,0.45)]"
                    : "bg-slate-800 text-slate-200 hover:bg-slate-700"
                }`}
                title="All Eyes Up (U)"
              >
                <span>⬆ Eyes</span>
                <kbd className="rounded bg-black/20 px-1 py-0.5 text-[9px]">U</kbd>
              </button>

              <button
                type="button"
                onClick={() => send("lockin:required", { enabled: !signals.lockInRequired })}
                className={`flex-1 flex items-center justify-between rounded-lg px-3 py-2 text-[11px] font-black uppercase tracking-wide transition ${
                  signals.lockInRequired
                    ? "bg-cyan-500 text-cyan-950 shadow-[0_4px_18px_rgba(6,182,212,0.45)]"
                    : "bg-slate-800 text-slate-200 hover:bg-slate-700"
                }`}
                title="Lock-It-In (L)"
              >
                <span>✓ Lock</span>
                <kbd className="rounded bg-black/20 px-1 py-0.5 text-[9px]">L</kbd>
              </button>
            </div>

            {/* ── 3. BREAK CONTROLS (expandable, only with socialeId) ── */}
            {socialeId && (
              <div>
                <button
                  type="button"
                  onClick={() => setShowBreaks((v) => !v)}
                  className="w-full flex items-center justify-between rounded-lg bg-slate-800 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-slate-400 hover:bg-slate-700 transition"
                >
                  <span>Intermission</span>
                  <span className="text-slate-500">{showBreaks ? "▲" : "▼"}</span>
                </button>
                <AnimatePresence>
                  {showBreaks && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.15 }}
                      className="overflow-hidden"
                    >
                      <div className="grid grid-cols-4 gap-1.5 pt-2">
                        {([5, 10, 15] as const).map((m) => (
                          <button
                            key={m}
                            type="button"
                            onClick={() => void callBreak(m)}
                            disabled={breakBusy !== null}
                            className="rounded-lg bg-slate-800 px-2 py-2 text-[11px] font-bold text-slate-200 hover:bg-slate-700 disabled:opacity-40 transition"
                          >
                            {breakBusy === m ? "…" : `${m}m`}
                          </button>
                        ))}
                        <button
                          type="button"
                          onClick={() => void callBreak(null)}
                          disabled={breakBusy !== null}
                          className="rounded-lg bg-emerald-700 px-2 py-2 text-[11px] font-bold text-emerald-50 hover:bg-emerald-600 disabled:opacity-40 transition"
                        >
                          {breakBusy === 'resume' ? "…" : "Go"}
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating trigger button */}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className={`rounded-full px-4 py-2 text-xs font-black uppercase tracking-wider shadow-lg ring-1 ring-white/10 transition-all ${
          expanded
            ? "bg-slate-700 text-white"
            : "bg-slate-800 text-slate-200 hover:bg-slate-700"
        }`}
        aria-expanded={expanded}
        aria-label="Toggle host controls panel"
      >
        {expanded ? "✕ Close" : "🎛 Controls"}
      </button>
    </motion.div>
  );
}

export default HostSignalsToolbar;
