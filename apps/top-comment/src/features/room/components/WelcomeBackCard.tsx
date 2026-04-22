interface WelcomeBackCardProps {
  playerName: string;
  roomCode: string;
  onContinue: () => void;
  onNotMe: () => void;
  busy?: boolean;
}

/**
 * P1-18: passwordless resume when `client_key` or stored membership matches.
 */
export function WelcomeBackCard({
  playerName,
  roomCode,
  onContinue,
  onNotMe,
  busy = false,
}: WelcomeBackCardProps) {
  const label = playerName?.trim() || "Previous player";

  return (
    <div className="fixed top-20 left-1/2 z-40 w-[min(92vw,28rem)] -translate-x-1/2 rounded-2xl border border-cyan-400/50 bg-slate-900/90 p-4 text-center shadow-2xl shadow-cyan-500/20 backdrop-blur">
      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-300">Welcome back</p>
      <p className="mt-2 text-xl font-black text-pink-400">{label}</p>
      <p className="mt-1 text-xs text-slate-400">Room {roomCode}</p>
      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-center">
        <button
          type="button"
          onClick={onContinue}
          disabled={busy}
          className="rounded-full bg-pink-500 px-5 py-2 text-sm font-bold text-white hover:bg-pink-400 disabled:opacity-60"
        >
          Continue as {label}
        </button>
        <button
          type="button"
          onClick={onNotMe}
          disabled={busy}
          className="rounded-full border border-slate-600 px-5 py-2 text-sm font-semibold text-slate-200 hover:bg-slate-800 disabled:opacity-60"
        >
          Not me — different name
        </button>
      </div>
    </div>
  );
}

export default WelcomeBackCard;
