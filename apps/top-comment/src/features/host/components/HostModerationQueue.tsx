import { useCallback, useEffect, useState } from "react";
import { supabase } from "../../../supabase/client";

interface PendingRow {
  id: string;
  value: unknown;
  socialite_id: string | null;
}

interface HostModerationQueueProps {
  socialeId: string | null | undefined;
}

/**
 * P1-24: host-side queue for open-text responses awaiting approval.
 */
export function HostModerationQueue({ socialeId }: HostModerationQueueProps) {
  const [pending, setPending] = useState<PendingRow[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  const load = useCallback(async () => {
    if (!socialeId) {
      setPending([]);
      return;
    }
    const { data, error } = await supabase
      .from("sociale_responses")
      .select("id, value, socialite_id")
      .eq("sociale_id", socialeId)
      .eq("moderation_status", "pending")
      .order("created_at", { ascending: true });
    if (error) {
      console.warn("Moderation queue load failed", error.message);
      return;
    }
    setPending((data ?? []) as PendingRow[]);
  }, [socialeId]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!socialeId) return;
    const channel = supabase
      .channel(`mod-queue-${socialeId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "sociale_responses",
          filter: `sociale_id=eq.${socialeId}`,
        },
        () => void load()
      )
      .subscribe();
    return () => {
      channel.unsubscribe();
      supabase.removeChannel(channel);
    };
  }, [socialeId, load]);

  const act = useCallback(
    async (responseId: string, action: "approve" | "scrub") => {
      setBusy(responseId);
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        await supabase.functions.invoke("sociales-moderate-response", {
          body: { responseId, action },
          headers: session?.access_token
            ? { Authorization: `Bearer ${session.access_token}` }
            : {},
        });
        await load();
      } finally {
        setBusy(null);
      }
    },
    [load]
  );

  if (!socialeId) return null;

  return (
    <div className="fixed bottom-20 left-4 z-[44] max-w-sm">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="rounded-full bg-rose-900/90 px-4 py-2 text-xs font-black uppercase tracking-wider text-rose-100 shadow-lg ring-1 ring-rose-500/40"
      >
        Moderation {pending.length > 0 ? `(${pending.length})` : ""}
      </button>
      {open && (
        <div className="mt-2 max-h-64 overflow-y-auto rounded-xl border border-white/10 bg-slate-950/95 p-3 text-left shadow-xl backdrop-blur">
          {pending.length === 0 ? (
            <p className="text-xs text-slate-400">No answers waiting.</p>
          ) : (
            <ul className="space-y-2">
              {pending.map((row) => (
                <li
                  key={row.id}
                  className="rounded-lg border border-white/10 bg-slate-900/80 p-2 text-sm text-slate-100"
                >
                  <p className="line-clamp-3 break-words">
                    {typeof row.value === "string" ? row.value : JSON.stringify(row.value)}
                  </p>
                  <div className="mt-2 flex gap-2">
                    <button
                      type="button"
                      disabled={busy === row.id}
                      onClick={() => void act(row.id, "approve")}
                      className="flex-1 rounded-md bg-emerald-600 py-1 text-xs font-bold text-white hover:bg-emerald-500 disabled:opacity-50"
                    >
                      Approve
                    </button>
                    <button
                      type="button"
                      disabled={busy === row.id}
                      onClick={() => void act(row.id, "scrub")}
                      className="flex-1 rounded-md bg-slate-700 py-1 text-xs font-bold text-slate-100 hover:bg-slate-600 disabled:opacity-50"
                    >
                      Scrub
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

export default HostModerationQueue;
