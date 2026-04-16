import { Card, Button } from "@social/ui";

interface HostVenueLoginPromptProps {
  show: boolean;
  isDark: boolean;
  onOpenVenueLogin: () => void;
}

export function HostVenueLoginPrompt({
  show,
  isDark,
  onOpenVenueLogin,
}: HostVenueLoginPromptProps) {
  if (!show) {
    return null;
  }

  return (
    <Card className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between" isDark={isDark}>
      <div>
        <p className={`text-sm font-semibold ${!isDark ? 'text-slate-900' : 'text-pink-400'}`}>
          Venue login required
        </p>
        <p className={`text-sm ${!isDark ? 'text-slate-600' : 'text-cyan-300'}`}>
          Sign in with your venue credentials before creating a new game.
        </p>
      </div>
      <Button
        variant="secondary"
        onClick={onOpenVenueLogin}
      >
        Open venue login
      </Button>
    </Card>
  );
}
