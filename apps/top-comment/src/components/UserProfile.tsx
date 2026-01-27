import { useAuth } from "../shared/providers/AuthContext";
import { Button } from "./Button";

interface UserProfileProps {
  className?: string;
}

export function UserProfile({ className = "" }: UserProfileProps) {
  const { user, isGuest, signOut } = useAuth();

  if (!user) return null;

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error("Sign out failed:", error);
    }
  };

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-primary text-sm font-semibold text-white">
        {isGuest
          ? "G"
          : (user.user_metadata?.display_name?.[0] || user.email?.[0] || "U").toUpperCase()}
      </div>
      <div className="flex flex-col">
        <span className="text-sm font-medium text-slate-900">
          {isGuest ? "Guest Team" : user.user_metadata?.display_name || user.email}
        </span>
        <span className="text-xs text-slate-500">
          {isGuest ? "No data saved" : "Account linked"}
        </span>
      </div>
      {!isGuest && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleSignOut}
          className="ml-auto"
        >
          Sign Out
        </Button>
      )}
    </div>
  );
}

export default UserProfile;
