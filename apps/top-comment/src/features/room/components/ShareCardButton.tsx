import { useState } from "react";
import { shareCard, type ShareCardInput, buildShareCardText } from "../utils/shareCard";

interface ShareCardButtonProps extends ShareCardInput {
  className?: string;
}

/**
 * P1-13: "Share recap" button that turns a finished sociale into a Wordle-
 * style emoji card, then uses Web Share (preferred) or clipboard fallback.
 *
 * Render on the final leaderboard modal + any venue-specific end screen.
 */
export function ShareCardButton(props: ShareCardButtonProps) {
  const { className, ...input } = props;
  const [state, setState] = useState<"idle" | "sharing" | "done-clipboard" | "done-native" | "error">("idle");

  const label =
    state === "sharing"
      ? "Preparing…"
      : state === "done-clipboard"
        ? "Copied! Paste anywhere"
        : state === "done-native"
          ? "Shared"
          : state === "error"
            ? "Copy failed"
            : "Share recap";

  const preview = buildShareCardText(input);

  const handleClick = async () => {
    setState("sharing");
    const result = await shareCard(input);
    if (result === "native") setState("done-native");
    else if (result === "clipboard") setState("done-clipboard");
    else setState("error");
    window.setTimeout(() => setState("idle"), 3000);
  };

  return (
    <div className={className}>
      <pre className="whitespace-pre-wrap rounded-xl bg-slate-900/60 px-4 py-3 text-xs text-slate-200 font-mono leading-snug mb-2">
        {preview}
      </pre>
      <button
        type="button"
        onClick={handleClick}
        disabled={state === "sharing"}
        className="w-full rounded-xl bg-cyan-500 px-4 py-3 text-sm font-black uppercase tracking-wider text-white shadow-lg hover:bg-cyan-400 disabled:opacity-60"
      >
        {label}
      </button>
    </div>
  );
}

export default ShareCardButton;
