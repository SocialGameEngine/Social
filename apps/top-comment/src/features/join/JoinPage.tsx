import { useState, useCallback, useRef, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { BackgroundAnimation } from "../../components/BackgroundAnimation";
import { JoinForm } from "./JoinForm";
import { useToast } from "../../shared/hooks";
import { roomService } from "../../services/roomService";
import { roomMembershipService } from "../../services/roomMembershipService";
import { useAuth } from "../../shared/providers/AuthContext";
import { PlayerAuthModal } from "../auth/PlayerAuthModal";
import { PlayerRecoveryModal } from "../auth/PlayerRecoveryModal";
import { VenueAuthModal } from "../auth/VenueAuthModal";
import { logger } from "../../shared/utils/logger";
import { supabase } from "../../supabase/client";
import {
  clearMembership,
  getMostRecentMembership,
  getStoredMembershipId,
  storeMembership,
} from "../../utils/membershipStorage";
import { getClientKey } from "../../utils/clientKey";

interface JoinFormState {
  code: string;
  playerName: string;
}

export function JoinPage() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user, isAnonymous, signOut } = useAuth();
  const [searchParams] = useSearchParams();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const [showPlayerAuthModal, setShowPlayerAuthModal] = useState(false);
  const [showVenueAuthModal, setShowVenueAuthModal] = useState(false);
  const accountMenuRef = useRef<HTMLDivElement>(null);
  
  // Read ?code= from invite link URL
  const codeFromUrl = searchParams.get("code")?.toUpperCase().trim() || "";
  const inviteMembershipId = searchParams.get("membership")?.trim() || "";
  const isMateInvite = searchParams.get("inv") === "1";

  // SIMPLIFIED: Only manage form state, no complex team state
  const [joinForm, setJoinForm] = useState<JoinFormState>({
    code: codeFromUrl,
    playerName: ""
  });

  const [joinErrors, setJoinErrors] = useState<Record<string, string>>({});
  const [isJoining, setIsJoining] = useState(false);
  const [showRecoveryModal, setShowRecoveryModal] = useState(false);
  const [resumableMembership, setResumableMembership] = useState<{
    id: string;
    playerName: string;
    roomId: string;
    roomCode: string;
  } | null>(null);
  const [checkingStoredMembership, setCheckingStoredMembership] = useState(false);

  // SIMPLIFIED: Direct join handler without team state management
  const handleJoin = useCallback(async (values: JoinFormState) => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }

    setIsJoining(true);
    setJoinErrors({});

    try {
      // Validate input
      const normalizedCode = values.code.trim().toUpperCase();
      const normalizedName = values.playerName.trim();
      
      if (!normalizedCode) {
        setJoinErrors({ code: "Room code is required" });
        return;
      }
      
      if (!/^[A-Z0-9]{6}$/.test(normalizedCode)) {
        setJoinErrors({ code: "Room code must be 6 alphanumeric characters" });
        return;
      }
      
      if (!normalizedName) {
        setJoinErrors({ playerName: "Player name is required" });
        return;
      }

      // Verify room exists first
      const roomResponse = await roomService.getRoom({ code: normalizedCode });
      
      if (!roomResponse.room) {
        setJoinErrors({ code: "Room not found" });
        return;
      }

      // Join the room
      const membershipResponse = await roomMembershipService.joinRoom({
        code: normalizedCode,
        playerName: normalizedName
      });

      if (!membershipResponse.membership) {
        throw new Error("Failed to join room");
      }

      // Persist the membership so this device auto-resumes on next visit.
      storeMembership(normalizedCode, membershipResponse.membership.id);

      // Navigate to room directly - no state management needed
      navigate(`/room/${normalizedCode}`);
      
      toast({
        title: "Room Joined!",
        description: `Successfully joined room ${normalizedCode}`,
        variant: "success",
      });

    } catch (error) {
      logger.error('Failed to join room', { error: error instanceof Error ? error.message : String(error) });
      const errorMessage = error instanceof Error ? error.message : 'Failed to join room';
      
      setJoinErrors({ 
        code: errorMessage.includes("not found") ? errorMessage : "",
        playerName: errorMessage.includes("name") ? errorMessage : ""
      });
      
      toast({
        title: "Join Failed",
        description: errorMessage,
        variant: "error",
      });
    } finally {
      setIsJoining(false);
    }
  }, [user, navigate]);

  // Account button handlers
  const handlePlayerSignIn = () => {
    setShowAccountMenu(false);
    setShowPlayerAuthModal(true);
  };

  const handleVenueSignIn = () => {
    setShowAccountMenu(false);
    setShowVenueAuthModal(true);
  };

  const handleSignOut = async () => {
    if (!signOut) return;
    try {
      await signOut();
      setShowAccountMenu(false);
    } catch (error) {
      console.error('Sign out failed:', error);
    }
  };

  // Same-device resume check (P1-18): if the URL has a `?code=`, use it;
  // otherwise fall back to the most-recently used membership on this device.
  // Verify the row still exists server-side before offering resume.
  useEffect(() => {
    let cancelled = false;
    const urlCode = codeFromUrl.trim().toUpperCase();
    let code = urlCode;
    let storedId = code ? getStoredMembershipId(code) : null;
    if (!storedId) {
      const recent = getMostRecentMembership();
      if (recent) {
        code = recent.roomCode;
        storedId = recent.membershipId;
      }
    }

    (async () => {
      setCheckingStoredMembership(true);
      try {
        // Resolve the target room: either the code the user landed on, or the
        // most recent one we remember locally.
        let roomRow: { id: string; code: string } | null = null;
        if (code) {
          const { data } = await supabase
            .from('rooms')
            .select('id, code')
            .eq('code', code)
            .maybeSingle();
          roomRow = data ?? null;
        }

        // Fast path: we have both code + stored membership id from localStorage.
        if (roomRow && storedId) {
          const { data, error } = await supabase
            .from('room_memberships')
            .select('id, player_name, is_banned, room_id')
            .eq('id', storedId)
            .eq('room_id', roomRow.id)
            .maybeSingle();

          if (!error && data && !data.is_banned) {
            if (!cancelled) {
              setResumableMembership({
                id: data.id,
                playerName: data.player_name ?? '',
                roomId: data.room_id,
                roomCode: roomRow.code,
              });
            }
            return;
          }
          if (code) clearMembership(code);
        }

        // P1-3/P1-18 fallback: no valid localStorage hit — try to find a
        // membership tied to this device's client_key. Works across browser
        // storage wipes as long as the server still has the row.
        const clientKey = getClientKey();
        if (clientKey && clientKey !== 'server-client') {
          let q = supabase
            .from('room_memberships')
            .select('id, player_name, is_banned, room_id, rooms!inner(code)')
            .eq('client_key', clientKey)
            .eq('is_banned', false)
            .order('last_active_at', { ascending: false, nullsFirst: false })
            .limit(1);
          if (roomRow) q = q.eq('room_id', roomRow.id);

          const { data } = await q.maybeSingle();
          if (data) {
            const fallbackCode =
              roomRow?.code ?? (data as any)?.rooms?.code ?? code ?? '';
            if (fallbackCode) {
              if (!cancelled) {
                setResumableMembership({
                  id: data.id,
                  playerName: data.player_name ?? '',
                  roomId: data.room_id,
                  roomCode: fallbackCode,
                });
              }
              return;
            }
          }
        }

        if (!cancelled) setResumableMembership(null);
      } catch {
        if (!cancelled) setResumableMembership(null);
      } finally {
        if (!cancelled) setCheckingStoredMembership(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [codeFromUrl]);

  const handleResume = useCallback(() => {
    if (!resumableMembership) return;
    storeMembership(resumableMembership.roomCode, resumableMembership.id);
    navigate(`/room/${resumableMembership.roomCode}`);
  }, [resumableMembership, navigate]);

  const handleClearResume = useCallback(async () => {
    if (!resumableMembership) return;
    clearMembership(resumableMembership.roomCode);
    // P1-18 "not me" fallback — also sever the client_key link on the server
    // so the fallback lookup doesn't keep re-offering the same resume card.
    try {
      await supabase
        .from('room_memberships')
        .update({ client_key: null })
        .eq('id', resumableMembership.id);
    } catch {
      /* best-effort */
    }
    setResumableMembership(null);
  }, [resumableMembership]);

  // Close account menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (accountMenuRef.current && !accountMenuRef.current.contains(event.target as Node)) {
        setShowAccountMenu(false);
      }
    };

    if (showAccountMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showAccountMenu]);

  // Wrapper for form submission
  const handleSubmit = useCallback((event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const values = {
      code: String(formData.get("code") ?? ""),
      playerName: String(formData.get("playerName") ?? ""),
    };
    void handleJoin(values);
  }, [handleJoin]);

  // Simplified styling
  const mainClassName = "relative z-10 flex min-h-screen items-center justify-center px-3 py-10 sm:px-4 pb-10";
  const contentWrapperClassName = "chaos-stack mx-auto flex w-full max-w-[440px] flex-col gap-4 px-4 sm:max-w-[520px] sm:gap-6";

  return (
    <>
      <BackgroundAnimation show={true} />
      <style>{`
        body {
          background: transparent !important;
        }
      `}</style>
      
      {/* Account Button - Fixed top right */}
      <div className="fixed top-4 right-4 z-50">
        <div className="relative" ref={accountMenuRef}>
          <button
            onClick={() => user ? setShowAccountMenu(!showAccountMenu) : handlePlayerSignIn()}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-600/80 hover:bg-slate-500/80 hover:scale-110 hover:shadow-lg hover:shadow-cyan-400/50 transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-slate-950"
            aria-label={user ? "Account menu" : "Sign in"}
            aria-expanded={showAccountMenu}
          >
            {user && !isAnonymous ? (
              <span className="text-slate-200 text-sm font-semibold">
                {(user.user_metadata?.display_name?.[0] || user.email?.[0] || "U").toUpperCase()}
              </span>
            ) : user && isAnonymous ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="w-5 h-5 text-cyan-400"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
                />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="w-5 h-5 text-slate-300"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            )}
          </button>

          {/* Account Menu Dropdown */}
          {showAccountMenu && (
            <div className="absolute top-full right-0 mt-2 w-64 rounded-xl bg-slate-800 border border-cyan-400/50 shadow-lg shadow-fuchsia-500/20 z-50 overflow-hidden">
              <div className="p-4 space-y-3">
                {user ? (
                  <>
                    <div className="space-y-1">
                      <p className="text-xs font-semibold uppercase tracking-wide text-cyan-400">
                        Player Account
                      </p>
                      {user.user_metadata?.display_name ? (
                        <p className="text-sm font-semibold text-pink-400">
                          {user.user_metadata.display_name}
                        </p>
                      ) : null}
                      {user.email ? (
                        <p className="text-sm text-cyan-300 break-all">
                          {user.email}
                        </p>
                      ) : (
                        <p className="text-sm text-slate-400 italic">
                          No email
                        </p>
                      )}
                    </div>
                    {isAnonymous && (
                      <div className="pt-2 border-t border-slate-700">
                        <p className="text-xs text-slate-400">
                          Guest mode
                        </p>
                      </div>
                    )}
                    <div className="pt-2 border-t border-slate-700">
                      <button
                        onClick={handleSignOut}
                        className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-rose-400 hover:text-rose-300 hover:bg-slate-700/50 rounded-lg transition-colors"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={2}
                          stroke="currentColor"
                          className="w-4 h-4"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75"
                          />
                        </svg>
                        Sign Out
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <p className="text-xs font-semibold uppercase tracking-wide text-cyan-400">
                        Not signed in
                      </p>
                      <p className="text-sm text-slate-400">
                        Choose your account type to get started
                      </p>
                    </div>
                    <div className="space-y-2">
                      <button
                        onClick={handlePlayerSignIn}
                        className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-cyan-400 hover:text-cyan-300 hover:bg-slate-700/50 rounded-lg transition-colors"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={2}
                          stroke="currentColor"
                          className="w-4 h-4"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                          />
                        </svg>
                        Player Sign In
                      </button>
                      <button
                        onClick={handleVenueSignIn}
                        className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-pink-400 hover:text-pink-300 hover:bg-slate-700/50 rounded-lg transition-colors"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={2}
                          stroke="currentColor"
                          className="w-4 h-4"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        Venue Sign In
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
      
      <div className={mainClassName}>
        <div className={contentWrapperClassName}>
          <div className="p-4"></div>

          {resumableMembership && (
            <div className="rounded-2xl border border-cyan-400/50 bg-slate-900/70 p-4 text-center shadow-lg shadow-cyan-500/20">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-300">
                Welcome back
              </p>
              <p className="mt-2 text-xl font-black text-pink-400">
                {resumableMembership.playerName || 'Previous player'}
              </p>
              <p className="mt-1 text-xs text-slate-400">
                Room {resumableMembership.roomCode}
              </p>
              <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-center">
                <button
                  onClick={handleResume}
                  disabled={checkingStoredMembership}
                  className="rounded-full bg-pink-500 px-5 py-2 text-sm font-bold text-white hover:bg-pink-400 disabled:opacity-60"
                >
                  Resume as {resumableMembership.playerName || 'me'}
                </button>
                <button
                  onClick={handleClearResume}
                  className="rounded-full border border-slate-600 px-5 py-2 text-sm font-semibold text-slate-200 hover:bg-slate-800"
                >
                  Start fresh
                </button>
              </div>
            </div>
          )}

          {!resumableMembership && isMateInvite && inviteMembershipId && (
            <p className="rounded-xl border border-pink-500/40 bg-pink-500/10 px-3 py-2 text-center text-xs text-pink-100">
              You&apos;re joining via a mate invite — you&apos;ll land in the same room. Pick your
              handset name below.
            </p>
          )}

          {!resumableMembership && (
            <>
              <JoinForm
                joinForm={joinForm}
                joinErrors={joinErrors}
                isJoining={isJoining}
                handleJoin={handleSubmit}
                setJoinForm={setJoinForm}
              />
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setShowRecoveryModal(true)}
                  className="text-sm text-cyan-300 underline-offset-4 hover:text-cyan-200 hover:underline"
                >
                  Returning player? Recover your progress
                </button>
              </div>
            </>
          )}
        </div>
      </div>
      
      {/* Authentication Modals */}
      {showAuthModal && (
        <PlayerAuthModal
          open={showAuthModal}
          onClose={() => setShowAuthModal(false)}
        />
      )}
      {showPlayerAuthModal && (
        <PlayerAuthModal
          open={showPlayerAuthModal}
          onClose={() => setShowPlayerAuthModal(false)}
        />
      )}
      {showVenueAuthModal && (
        <VenueAuthModal
          open={showVenueAuthModal}
          onClose={() => setShowVenueAuthModal(false)}
        />
      )}
      <PlayerRecoveryModal
        open={showRecoveryModal}
        onClose={() => setShowRecoveryModal(false)}
        roomCode={codeFromUrl || undefined}
        onRecovered={() => {
          if (codeFromUrl) navigate(`/room/${codeFromUrl}`);
        }}
      />
    </>
  );
}
