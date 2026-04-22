import { SocialeGameButton } from '../../components/layout/SocialeGameButton';
import { SessionTimer } from '@social/ui';
import { usePhaseTimer } from '../../../../shared/hooks';
import { useAuth } from '../../../../shared/providers/AuthContext';
import { SaveProgressPrompt } from '../../../auth/SaveProgressPrompt';
import { buildSocialeTimerSessionShim } from '../../utils/socialeTimerShim';
import type { Sociale } from '../../../../domain/types/sociale.types';
import type { SocialeGameParticipant } from '../../components/layout/SocialeGameButton';
import type { RoomMembership } from '../../../../shared/types';

interface SocialeEndedPhaseRoomProps {
  sociale: Sociale;
  participants: SocialeGameParticipant[];
  memberships?: RoomMembership[] | null;
  onOpenLeaderboard: () => void;
  onOpenSelfie: () => void;
}

export function SocialeEndedPhaseRoom({
  sociale,
  participants,
  memberships,
  onOpenLeaderboard,
  onOpenSelfie,
}: SocialeEndedPhaseRoomProps) {
  const { user } = useAuth();
  const timerShim = buildSocialeTimerSessionShim(sociale, 'results');
  const { totalSeconds } = usePhaseTimer({ session: timerShim });
  const myMembership = user && memberships
    ? memberships.find((m) => m.userId === user.id)
    : null;

  return (
    <div className="w-full mb-8 space-y-4">
      <SocialeGameButton
        displayState="ended"
        participants={participants}
        isMainEventMode={false}
        phase="ended"
        onClick={onOpenLeaderboard}
      />
      <SocialeGameButton
        displayState="idle"
        participants={participants}
        isMainEventMode={false}
        phase="ended"
        onClick={onOpenSelfie}
      />
      <SaveProgressPrompt membershipId={myMembership?.id} />
      <SessionTimer
        endTime={sociale.phaseEndsAt ?? undefined}
        totalSeconds={totalSeconds}
        paused={true}
        variant="neutral"
        isDark={false}
        position="inline"
        showCriticalBar={false}
      />
    </div>
  );
}
