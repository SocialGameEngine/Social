import { Card, Button } from "@social/ui";
import type { User } from "@supabase/supabase-js";
import type { Session, Room } from "../../../shared/types";
import { phaseCopy } from "../../../shared/constants";

interface HostHeaderCardProps {
  room: Room | null | undefined;
  session: Session | null;
  storedRoomId: string | null;
  storedRoomCode: string | null;
  user: User | null;
  isDark: boolean;
  presenterButton: React.ReactNode;
  onNavigateAnalytics: () => void;
  onOpenRoomSettings: () => void;
  onOpenVIBox: () => void;
}

export function HostHeaderCard({
  room,
  session,
  storedRoomId,
  storedRoomCode,
  user,
  isDark,
  presenterButton,
  onNavigateAnalytics,
  onOpenRoomSettings,
  onOpenVIBox,
}: HostHeaderCardProps) {
  return (
    <Card className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between" isDark={isDark}>
      <div className="space-y-3">
        {/* Host Console header */}
        <div>
          <h1 className="text-3xl font-black text-pink-400">
            {room?.name || "Host Console"}
          </h1>
          {session ? (
            <p className="text-sm text-cyan-300">
              {phaseCopy[session.status]}
            </p>
          ) : storedRoomId ? (
            <p className="text-sm text-cyan-300">
              Room active. Waiting for players to join.
            </p>
          ) : (
            <p className="text-sm text-cyan-300">
              Create a game room when you're ready to host.
            </p>
          )}
        </div>
        
        {/* Navigation buttons - wrap on mobile to prevent overflow */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {presenterButton}
          {storedRoomCode && user && !user.is_anonymous && (
            <>
              <Button
                variant="ghost"
                onClick={onNavigateAnalytics}
                className="text-xs sm:text-sm"
              >
                Analytics
              </Button>
              <Button
                variant="ghost"
                onClick={onOpenRoomSettings}
                className="text-xs sm:text-sm"
              >
                Room Settings
              </Button>
            </>
          )}
          <button
            onClick={onOpenVIBox}
            className="text-sm font-semibold text-cyan-400 hover:text-cyan-300 whitespace-nowrap"
          >
            Vibox
          </button>
        </div>
      </div>
    </Card>
  );
}
