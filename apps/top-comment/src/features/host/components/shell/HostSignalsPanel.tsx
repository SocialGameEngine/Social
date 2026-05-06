/**
 * HostSignalsPanel - Soundboard, attention toggle, lock-in, and break controls
 *
 * Integrated into the shell so it adapts to screen size naturally:
 * - layout="strip"  → compact horizontal row for mobile (inside HostMobileShell)
 * - layout="panel"  → vertical section for desktop (inside left controlsPanel)
 *
 * Replaces the old floating HostSignalsToolbar overlay.
 */

import { useCallback, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { HostSignalState } from "../../../room/hooks/useHostSignals";
import { supabase } from "../../../../supabase/client";
import { useToast } from "../../../../shared/hooks";

interface HostSignalsPanelProps {
  /** Live signals state from useHostSignals (owned by parent). */
  signals: HostSignalState;
  /** Send function from useHostSignals (owned by parent). */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  send: (event: string, payload?: any) => void;
  socialeId?: string | null;
  /** "inline" = compact inside action bar; "panel" = vertical block for desktop left column */
  layout?: "inline" | "panel";
}

interface SoundboardCue {
  id: string;
  label: string;
  emoji: string;
}

const SOUNDBOARD: SoundboardCue[] = [
  { id: "drumroll", label: "Drumroll", emoji: "🥁" },
  { id: "cheer",    label: "Cheer",    emoji: "🎉" },
  { id: "boo",      label: "Boo",      emoji: "👎" },
  { id: "fail",     label: "Fail",     emoji: "📯" },
  { id: "applause", label: "Applause", emoji: "👏" },
  { id: "lobby",    label: "Lobby",    emoji: "🎵" },
  { id: "ding",     label: "Ding",     emoji: "🔔" },
  { id: "buzz",     label: "Buzz",     emoji: "📢" },
  { id: "confetti", label: "Confetti", emoji: "🎊" },
];

export function HostSignalsPanel({
  signals,
  send,
  socialeId,
  layout = "panel",
}: HostSignalsPanelProps) {
  const { toast } = useToast();
  const [showBreaks, setShowBreaks] = useState(false);
  const [breakBusy, setBreakBusy] = useState<null | number | "resume">(null);

  const callBreak = useCallback(
    async (minutes: 5 | 10 | 15 | null) => {
      if (!socialeId) return;
      setBreakBusy(minutes ?? "resume");
      try {
        const { error } = await supabase.functions.invoke("sociales-break", {
          body:
            minutes === null
              ? { socialeId, resume: true }
              : { socialeId, minutes },
        });
        if (error) throw error;
      } catch (err) {
        toast({
          title: "Break failed",
          description:
            err instanceof Error
              ? err.message
              : "Could not set break. Is the function deployed?",
          variant: "error",
        });
      } finally {
        setBreakBusy(null);
      }
    },
    [socialeId, toast]
  );

  // ── Inline layout (inside HostActionBar, compact) ─────────────────────────
  if (layout === "inline") {
    return (
      <div className="space-y-2">
        {/* Soundboard — horizontal scroll row */}
        <div className="flex gap-1.5 overflow-x-auto scrollbar-hide">
          {SOUNDBOARD.map((cue) => (
            <button
              key={cue.id}
              type="button"
              onClick={() => send("sound:play", { id: cue.id })}
              className="flex-shrink-0 flex flex-col items-center rounded-xl bg-slate-700/80 px-3 py-2 text-[10px] font-bold text-slate-200 hover:bg-slate-600 active:scale-95 transition-all min-w-[52px]"
            >
              <span className="text-lg leading-none">{cue.emoji}</span>
              <span className="mt-1">{cue.label}</span>
            </button>
          ))}
        </div>

        {/* Toggle row + break */}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() =>
              send(signals.attentionLocked ? "attention:release" : "attention:lock")
            }
            className={`flex-1 rounded-lg px-3 py-2 text-[11px] font-black uppercase tracking-wide transition ${
              signals.attentionLocked
                ? "bg-amber-500 text-amber-950 shadow-[0_0_12px_rgba(251,191,36,0.4)]"
                : "bg-slate-700/80 text-slate-200 hover:bg-slate-600"
            }`}
          >
            ⬆ Eyes Up
          </button>
          <button
            type="button"
            onClick={() =>
              send("lockin:required", { enabled: !signals.lockInRequired })
            }
            className={`flex-1 rounded-lg px-3 py-2 text-[11px] font-black uppercase tracking-wide transition ${
              signals.lockInRequired
                ? "bg-cyan-500 text-cyan-950 shadow-[0_0_12px_rgba(6,182,212,0.4)]"
                : "bg-slate-700/80 text-slate-200 hover:bg-slate-600"
            }`}
          >
            ✓ Lock-In
          </button>
          {socialeId && (
            <button
              type="button"
              onClick={() => setShowBreaks((v) => !v)}
              className={`rounded-lg px-3 py-2 text-[11px] font-black uppercase tracking-wide transition ${
                showBreaks
                  ? "bg-slate-600 text-white"
                  : "bg-slate-700/80 text-slate-300 hover:bg-slate-600"
              }`}
            >
              {showBreaks ? "✕" : "⏸ Break"}
            </button>
          )}
        </div>

        {/* Break controls */}
        <AnimatePresence>
          {showBreaks && socialeId && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="overflow-hidden"
            >
              <div className="flex gap-2 pt-1">
                <span className="text-[10px] font-bold uppercase text-slate-500 self-center flex-shrink-0">
                  Intermission
                </span>
                {([5, 10, 15] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => void callBreak(m)}
                    disabled={breakBusy !== null}
                    className="flex-1 rounded-lg bg-slate-700/80 py-2 text-xs font-bold text-slate-200 hover:bg-slate-600 disabled:opacity-40 transition"
                  >
                    {breakBusy === m ? "…" : `${m}m`}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => void callBreak(null)}
                  disabled={breakBusy !== null}
                  className="flex-1 rounded-lg bg-emerald-700 py-2 text-xs font-bold text-emerald-50 hover:bg-emerald-600 disabled:opacity-40 transition"
                >
                  {breakBusy === "resume" ? "…" : "Resume"}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // ── Panel layout (desktop left column, vertical) ──────────────────────────
  return (
    <div className="space-y-3">
      {/* Soundboard */}
      <div>
        <p className="mb-2 text-[10px] font-black uppercase tracking-wider text-slate-400">
          Soundboard
        </p>
        <div className="grid grid-cols-3 gap-1.5">
          {SOUNDBOARD.map((cue) => (
            <button
              key={cue.id}
              type="button"
              onClick={() => send("sound:play", { id: cue.id })}
              className="flex flex-col items-center rounded-xl bg-slate-700/60 px-2 py-2 text-[11px] font-bold text-slate-200 hover:bg-slate-700 active:scale-95 transition-all"
            >
              <span className="text-xl leading-none">{cue.emoji}</span>
              <span className="mt-1">{cue.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Quick toggles */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() =>
            send(
              signals.attentionLocked ? "attention:release" : "attention:lock"
            )
          }
          className={`flex-1 flex items-center justify-between rounded-lg px-3 py-2 text-[11px] font-black uppercase tracking-wide transition ${
            signals.attentionLocked
              ? "bg-amber-500 text-amber-950 shadow-[0_4px_18px_rgba(251,191,36,0.45)]"
              : "bg-slate-700/60 text-slate-200 hover:bg-slate-700"
          }`}
          title="All Eyes Up (U)"
        >
          <span>⬆ Eyes Up</span>
          <kbd className="rounded bg-black/20 px-1 py-0.5 text-[9px]">U</kbd>
        </button>
        <button
          type="button"
          onClick={() =>
            send("lockin:required", { enabled: !signals.lockInRequired })
          }
          className={`flex-1 flex items-center justify-between rounded-lg px-3 py-2 text-[11px] font-black uppercase tracking-wide transition ${
            signals.lockInRequired
              ? "bg-cyan-500 text-cyan-950 shadow-[0_4px_18px_rgba(6,182,212,0.45)]"
              : "bg-slate-700/60 text-slate-200 hover:bg-slate-700"
          }`}
          title="Lock-It-In (L)"
        >
          <span>✓ Lock-In</span>
          <kbd className="rounded bg-black/20 px-1 py-0.5 text-[9px]">L</kbd>
        </button>
      </div>

      {/* Break controls (only when a Sociale is active) */}
      {socialeId && (
        <div>
          <button
            type="button"
            onClick={() => setShowBreaks((v) => !v)}
            className="w-full flex items-center justify-between rounded-lg bg-slate-700/60 px-3 py-2 text-[10px] font-black uppercase tracking-wider text-slate-400 hover:bg-slate-700 transition"
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
                      className="rounded-lg bg-slate-700/60 px-2 py-2 text-[11px] font-bold text-slate-200 hover:bg-slate-700 disabled:opacity-40 transition"
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
                    {breakBusy === "resume" ? "…" : "Go"}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

export default HostSignalsPanel;
