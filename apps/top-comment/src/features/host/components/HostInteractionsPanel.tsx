import { Button, Card } from "@social/ui";
import { HostInteractionManager } from "./HostInteractionManager";

interface HostInteractionsPanelProps {
  isDark: boolean;
  room: { id: string; code: string } | null;
  roomMemberships: any[];
  onOpenSettings?: () => void;
}

export function HostInteractionsPanel({
  isDark,
  room,
  roomMemberships,
  onOpenSettings,
}: HostInteractionsPanelProps) {
  if (!room) return null;

  return (
    <Card className="space-y-5" isDark={isDark}>
      <div className={`border-t pt-5 ${!isDark ? "border-slate-200" : "border-cyan-400/20"}`}>
        <div className="mb-3 flex items-center justify-between">
          <h4 className={`text-sm font-semibold uppercase tracking-wide ${!isDark ? "text-slate-500" : "text-cyan-400"}`}>
            Interactions Panel
          </h4>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={onOpenSettings}>
              Settings
            </Button>
          </div>
        </div>
        <HostInteractionManager
          room={{ id: room.id, code: room.code }}
          memberships={roomMemberships}
        />
      </div>
    </Card>
  );
}
