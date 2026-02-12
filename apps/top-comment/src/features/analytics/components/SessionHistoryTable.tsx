import { useState } from "react";
import type { SessionDetail } from "../../../services/analyticsService";

interface SessionHistoryTableProps {
  sessions: SessionDetail[];
  isLoading: boolean;
}

type SortKey = "startedAt" | "joinedCount" | "answerRate" | "voteRate" | "durationSec" | "roundsPlayed";

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

function formatDuration(sec: number | null): string {
  if (sec == null) return "—";
  if (sec < 60) return `${Math.round(sec)}s`;
  return `${Math.floor(sec / 60)}m ${Math.round(sec % 60)}s`;
}

function formatRate(rate: number | null): string {
  if (rate == null) return "—";
  return `${Math.round(rate * 100)}%`;
}

const statusColors: Record<string, string> = {
  ended: "text-slate-400",
  lobby: "text-cyan-400",
  answer: "text-green-400",
  vote: "text-yellow-400",
  results: "text-purple-400",
};

export function SessionHistoryTable({ sessions, isLoading }: SessionHistoryTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>("startedAt");
  const [sortAsc, setSortAsc] = useState(false);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(false);
    }
  };

  const sorted = [...sessions].sort((a, b) => {
    let av: number, bv: number;
    switch (sortKey) {
      case "startedAt":
        av = a.startedAt ? new Date(a.startedAt).getTime() : 0;
        bv = b.startedAt ? new Date(b.startedAt).getTime() : 0;
        break;
      case "joinedCount":
        av = a.joinedCount ?? 0; bv = b.joinedCount ?? 0; break;
      case "answerRate":
        av = a.answerRate ?? 0; bv = b.answerRate ?? 0; break;
      case "voteRate":
        av = a.voteRate ?? 0; bv = b.voteRate ?? 0; break;
      case "durationSec":
        av = a.durationSec ?? 0; bv = b.durationSec ?? 0; break;
      case "roundsPlayed":
        av = a.roundsPlayed; bv = b.roundsPlayed; break;
      default:
        av = 0; bv = 0;
    }
    return sortAsc ? av - bv : bv - av;
  });

  const SortHeader = ({ label, field }: { label: string; field: SortKey }) => (
    <th
      className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400 cursor-pointer hover:text-cyan-300 select-none"
      onClick={() => handleSort(field)}
    >
      {label} {sortKey === field ? (sortAsc ? "↑" : "↓") : ""}
    </th>
  );

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-slate-700 bg-slate-800/80 p-6">
        <div className="animate-pulse space-y-3">
          <div className="h-4 w-32 rounded bg-slate-700" />
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-8 rounded bg-slate-700/50" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-700 bg-slate-800/80 overflow-hidden">
      <div className="px-4 pt-4 pb-2">
        <h3 className="text-sm font-bold text-cyan-400 uppercase tracking-wider">Session History</h3>
        <p className="text-xs text-slate-400 mt-0.5">{sessions.length} sessions</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-700/50">
              <SortHeader label="Date" field="startedAt" />
              <SortHeader label="Players" field="joinedCount" />
              <SortHeader label="Rounds" field="roundsPlayed" />
              <SortHeader label="Answer %" field="answerRate" />
              <SortHeader label="Vote %" field="voteRate" />
              <SortHeader label="Duration" field="durationSec" />
              <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400">Status</th>
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-slate-500 text-sm">
                  No sessions yet
                </td>
              </tr>
            ) : (
              sorted.map((s) => (
                <tr key={s.sessionId} className="border-b border-slate-700/30 hover:bg-slate-700/30 transition-colors">
                  <td className="px-3 py-2 text-cyan-100 whitespace-nowrap">{formatDate(s.startedAt)}</td>
                  <td className="px-3 py-2 text-slate-300">{s.joinedCount ?? "—"}</td>
                  <td className="px-3 py-2 text-slate-300">{s.roundsPlayed}</td>
                  <td className="px-3 py-2 text-slate-300">{formatRate(s.answerRate)}</td>
                  <td className="px-3 py-2 text-slate-300">{formatRate(s.voteRate)}</td>
                  <td className="px-3 py-2 text-slate-300">{formatDuration(s.durationSec)}</td>
                  <td className={`px-3 py-2 font-semibold text-xs uppercase ${statusColors[s.status] || "text-slate-400"}`}>
                    {s.status}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
