import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../../../shared/providers/AuthContext';
import { SplitFlap } from '../../../tv/components/SplitFlap';
import { useToast } from '../../../../shared/hooks/useToast';
import { triggerHaptic } from '../../../../shared/utils/sessionUtils';
import { getMascotPath } from '../../../../shared/mascots';
import type { RoomMembership } from '../../../../shared/types';
import type { Sociale, Socialite } from '../../../../domain/types/sociale.types';
import {
  useJoinSociale,
  useLeaveSociale,
  useCurrentSocialite,
  useSocialites,
} from '../../../../features/sociale';

type JoinState = 'idle' | 'joining' | 'joined' | 'error';

interface SocialeLobbyPhaseRoomProps {
  sociale: Sociale;
  roomId: string;
  memberships: RoomMembership[] | null;
  onJoinRoom?: () => void;
}

export function SocialeLobbyPhaseRoom({ sociale, roomId, memberships, onJoinRoom }: SocialeLobbyPhaseRoomProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [joinState, setJoinState] = useState<JoinState>('idle');
  const [isLeaving, setIsLeaving] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const lastJoinAttemptRef = useRef<number>(0);
  const JOIN_DEBOUNCE_MS = 500;

  const { data: socialites = [] } = useSocialites(sociale.id);
  const { data: currentSocialite } = useCurrentSocialite(sociale.id, user?.id);

  const joinSociale = useJoinSociale();
  const leaveSociale = useLeaveSociale();

  const isJoining = joinState === 'joining';

  const myMembership = user ? memberships?.find((m) => m.userId === user.id) : null;
  const displayName = myMembership?.playerName || user?.user_metadata?.display_name || 'Player';
  const isRoomMember = !!myMembership;

  useEffect(() => {
    if (currentSocialite && joinState !== 'joined') {
      setJoinState('joined');
    }
    if (!currentSocialite && joinState === 'joined') {
      setJoinState('idle');
    }
  }, [currentSocialite, joinState]);

  useEffect(() => {
    if (isRoomMember && joinState === 'idle' && !currentSocialite) {
      setJoinState('idle');
    }
  }, [isRoomMember, joinState, currentSocialite]);

  const handleJoin = useCallback(async () => {
    if (!user?.id || !sociale?.id) return;
    const now = Date.now();
    if (now - lastJoinAttemptRef.current < JOIN_DEBOUNCE_MS) return;
    lastJoinAttemptRef.current = now;
    if (joinState === 'joining' || joinState === 'joined') return;

    if (!isRoomMember && onJoinRoom) {
      onJoinRoom();
      return;
    }

    setJoinState('joining');
    triggerHaptic('medium');

    try {
      await joinSociale.mutateAsync({
        socialeId: sociale.id,
        roomId,
        userId: user.id,
        displayName,
      });

      setJoinState('joined');
      triggerHaptic('success');
      toast({ title: 'Joined Sociale!', variant: 'success', description: "You're ready to play" });

      queryClient.invalidateQueries({ queryKey: ['socialites', sociale.id] });
      queryClient.invalidateQueries({ queryKey: ['socialite', sociale.id, user.id] });
    } catch (error) {
      console.error('Failed to join Sociale:', error);
      setJoinState('error');
      triggerHaptic('error');
      toast({
        title: 'Failed to join',
        variant: 'error',
        description: error instanceof Error ? error.message : 'Unknown error',
      });
      setTimeout(() => setJoinState('idle'), 1500);
    }
  }, [user?.id, sociale.id, roomId, displayName, isRoomMember, onJoinRoom, joinState, joinSociale, toast, queryClient]);

  const handleLeave = useCallback(async () => {
    if (!currentSocialite?.id || isLeaving) return;
    setIsLeaving(true);
    try {
      await leaveSociale.mutateAsync(currentSocialite.id);
      setJoinState('idle');
      triggerHaptic('success');

      queryClient.invalidateQueries({ queryKey: ['socialites', sociale.id] });
      queryClient.invalidateQueries({ queryKey: ['socialite', sociale.id, user?.id] });
    } catch (e) {
      console.error('Error leaving Sociale:', e);
      triggerHaptic('error');
      toast({
        title: 'Failed to leave',
        variant: 'error',
        description: 'Please try again',
      });
    } finally {
      setIsLeaving(false);
      setShowLeaveConfirm(false);
    }
  }, [currentSocialite?.id, isLeaving, leaveSociale, queryClient, sociale.id, user?.id, toast]);

  const isInSociale = !!currentSocialite;

  const activeSocialites = useMemo(
    () => (socialites as Socialite[]).filter((s) => s.isActive),
    [socialites],
  );

  const joinCountLabel = activeSocialites.length;

  return (
    <div className="w-full mb-6 px-4">
      <div className="chaos-room-panel p-4 sm:p-5 space-y-4" data-phase="lobby">
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-col gap-2">
            <span className="chaos-room-eyebrow">
              <span>Lobby</span>
              <span className="opacity-60">·</span>
              <span className="flex items-center gap-1">
                <SplitFlap
                  value={String(joinCountLabel)}
                  length={Math.max(2, String(joinCountLabel).length)}
                  flipMs={60}
                  staggerMs={30}
                  charWidthEm={0.55}
                  style={{ fontSize: '11px' }}
                />
                <span className="opacity-70">in</span>
              </span>
            </span>
            <h2 className="text-2xl font-black leading-tight text-white">
              {isInSociale ? "You're in!" : isRoomMember ? 'Join the Sociale' : 'Join the room'}
            </h2>
            <p className="text-sm text-white/60">
              {isInSociale
                ? 'Hang tight — we kick off when the host starts the round.'
                : isRoomMember
                ? 'Tap below to grab a spot before the host starts.'
                : 'You need to join the room first.'}
            </p>
          </div>
        </div>

        {activeSocialites.length > 0 && (
          <div className="flex flex-wrap gap-2" aria-label="Players in the lobby">
            <AnimatePresence>
              {activeSocialites.slice(0, 12).map((s) => {
                const mascotPath = getMascotPath(s.mascotId);
                return (
                  <motion.div
                    key={s.id}
                    layout
                    initial={{ scale: 0.6, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 340, damping: 22 }}
                    className="relative flex flex-col items-center gap-1 w-14"
                    title={s.displayName}
                  >
                    <div
                      className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center border-2"
                      style={{
                        borderColor: s.id === currentSocialite?.id ? '#22d3ee' : 'rgba(34, 211, 238, 0.4)',
                        background: 'rgba(10, 1, 24, 0.6)',
                        boxShadow:
                          s.id === currentSocialite?.id
                            ? '0 0 14px rgba(34,211,238,0.45)'
                            : 'none',
                      }}
                    >
                      {mascotPath ? (
                        <img src={mascotPath} alt="" className="w-full h-full object-contain" draggable={false} />
                      ) : (
                        <span className="text-sm font-black text-white">
                          {s.displayName?.slice(0, 1).toUpperCase() ?? '?'}
                        </span>
                      )}
                    </div>
                  </motion.div>
                );
              })}
              {activeSocialites.length > 12 && (
                <motion.div
                  key="overflow"
                  initial={{ scale: 0.6, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="flex items-center justify-center w-10 h-10 rounded-full bg-white/10 text-xs font-black text-white"
                >
                  +{activeSocialites.length - 12}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {!isInSociale ? (
          <button
            type="button"
            onClick={handleJoin}
            disabled={isJoining}
            className="chaos-room-cta w-full px-4"
            style={{ ['--chaos-room-accent-rgb' as any]: 'var(--chaos-room-phase-lobby-rgb)' }}
          >
            {isJoining
              ? 'Joining…'
              : isRoomMember
              ? 'Join the Sociale'
              : 'Join the room first'}
          </button>
        ) : (
          <div className="flex items-center justify-center pt-1">
            <button
              type="button"
              onClick={() => setShowLeaveConfirm(true)}
              disabled={isLeaving}
              className="text-xs font-bold uppercase tracking-widest text-white/50 hover:text-white/80 transition"
            >
              {isLeaving ? 'Leaving…' : 'Leave Sociale'}
            </button>
          </div>
        )}
      </div>

      <AnimatePresence>
        {showLeaveConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          >
            <div
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
              onClick={() => !isLeaving && setShowLeaveConfirm(false)}
              aria-hidden="true"
            />
            <motion.div
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 40, opacity: 0 }}
              className="chaos-room-shell relative w-full max-w-sm rounded-[24px] p-5 space-y-4"
              data-phase="lobby"
              role="dialog"
              aria-modal="true"
            >
              <h3 className="text-lg font-black text-white">Leave Sociale?</h3>
              <p className="text-sm text-white/70">
                Your score and progress will be cleared. You can rejoin until the first round starts.
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowLeaveConfirm(false)}
                  disabled={isLeaving}
                  className="flex-1 min-h-[48px] rounded-full border border-white/15 bg-white/5 text-white font-black text-sm uppercase tracking-wider"
                >
                  Stay
                </button>
                <button
                  type="button"
                  onClick={() => void handleLeave()}
                  disabled={isLeaving}
                  className="chaos-room-cta flex-1 px-4"
                  style={{ ['--chaos-room-accent-rgb' as any]: '239, 68, 68' }}
                >
                  {isLeaving ? 'Leaving…' : 'Leave'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
