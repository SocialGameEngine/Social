
import { Card } from "@social/ui";
import type { ReactNode } from "react";

interface SessionsPanelProps {
  isDark: boolean;
  session: any;
  sessionId: string | null;
  sessionControls?: React.ReactNode;
  promptLibraryContent?: React.ReactNode;
  phaseContent?: React.ReactNode;
  room?: any;
  roomMemberships?: any[];
  pendingSubmissions?: React.ReactNode;
  copyLinkHandler?: (link: string) => void;
  roomJoinCode?: string;
  inviteLink?: string;
}

export function SessionsPanel({
  isDark,
  session,
  sessionId,
  sessionControls,
  promptLibraryContent,
  phaseContent,
  room,
  roomMemberships,
  pendingSubmissions,
  copyLinkHandler,
  roomJoinCode,
  inviteLink,
}: SessionsPanelProps) {
  // Always show the panel, even when no session
  const hasSession = !!session;

  return (
    <Card className="space-y-5" isDark={isDark}>
      <div className={`border-t pt-5 ${!isDark ? "border-slate-200" : "border-cyan-400/20"}`}>
        <div className="mb-3 flex items-center justify-between">
          <h4 className={`text-sm font-semibold uppercase tracking-wide ${!isDark ? "text-slate-500" : "text-cyan-400"}`}>
            Session
          </h4>
          <div className="flex gap-2">
            <span className={`text-xs font-medium px-2 py-1 rounded-full ${!isDark ? "bg-slate-100 text-slate-600" : "bg-pink-500/20 text-pink-400 border border-pink-400/30"}`}>
              {!hasSession 
                ? "No Session" 
                : session.status === "lobby" 
                  ? "In Lobby"
                  : session.status === "answer"
                  ? "Players are Answering"
                  : session.status === "vote"
                  ? "Players are Voting"
                  : session.status === "results"
                  ? "Viewing Results"
                  : session.status === "ended"
                  ? "Game Complete"
                  : session.status
              }
            </span>
          </div>
        </div>
        
        <div className="space-y-4">
          {!hasSession ? (
            /* No Session State */
            <div className="space-y-4">
              <div className="text-center py-4">
                <div className={`text-lg font-semibold mb-2 ${!isDark ? 'text-slate-900' : 'text-cyan-400'}`}>
                  No Active Session
                </div>
                <p className={`text-sm ${!isDark ? 'text-slate-600' : 'text-cyan-300'}`}>
                  Create a new session or load an existing one to get started
                </p>
              </div>
              <div className="space-y-3">
                {sessionControls}
              </div>
            </div>
          ) : (
            /* Active Session State */
            <>
              {/* Session Header */}
              <div className="flex items-center justify-between">
                <div className="flex gap-2">
                  {sessionControls}
                </div>
              </div>

              {/* Prompt Library Section */}
          {promptLibraryContent && (
            <div className={`border-t pt-5 ${!isDark ? 'border-slate-200' : 'border-cyan-400/20'}`}>
              {promptLibraryContent}
            </div>
          )}

          {/* Phase Content */}
              {phaseContent && (
                <div className={`border-t pt-5 ${!isDark ? 'border-slate-200' : 'border-cyan-400/20'}`}>
                  {phaseContent}
                </div>
              )}

              {/* Session Info */}
              <div className="grid gap-3 sm:grid-cols-1">
                <div className={`rounded-2xl border p-4 ${!isDark ? 'border-slate-200 bg-slate-50' : 'border-cyan-400/50 bg-slate-700'}`}>
                  <div className={`text-xs font-semibold uppercase tracking-wide mb-2 ${!isDark ? 'text-slate-500' : 'text-cyan-300'}`}>
                    Session Details
                  </div>
                  <div className="space-y-1">
                    <div className={`text-sm ${!isDark ? 'text-slate-600' : 'text-cyan-400'}`}>
                      Round: {session.roundIndex + 1} / {session.settings?.totalRounds || '∞'}
                    </div>
                    <div className={`text-sm ${!isDark ? 'text-slate-600' : 'text-cyan-400'}`}>
                      Status: <span className="font-medium capitalize">{session.status}</span>
                    </div>
                    {session.paused && (
                      <div className={`flex items-center gap-1 text-sm ${!isDark ? 'text-amber-600' : 'text-amber-400'}`}>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Paused
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </Card>
  );
}
