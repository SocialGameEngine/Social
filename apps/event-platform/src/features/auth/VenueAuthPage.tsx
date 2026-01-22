import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../shared/providers/AuthContext";
import { useTheme } from "../../shared/providers/ThemeProvider";
import { Button, FormField, Card } from "@social/ui";
import { ensureVenueAccountProfile } from "../../supabase/client";

export function VenueAuthPage() {
  const { isDark } = useTheme();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);
  const { signIn, refreshVenueAccount } = useAuth();
  const navigate = useNavigate();

  // Auto-dismiss notifications after 3 seconds
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Sign in with Supabase auth
      await signIn(email, password);
      
      // Wait a moment for auth state to settle
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Try to load venue account from database
      const venueAccount = await refreshVenueAccount();
      
      // If no venue account exists, try to create one
      if (!venueAccount) {
        const response = await ensureVenueAccountProfile({
          fullName: email,
        });
        
        if (!response?.venueAccount?.is_active) {
          throw new Error("Venue account is not active. Please contact your Söcial representative.");
        }
      } else if (!venueAccount.isActive) {
        throw new Error("Venue account is not active. Please contact your Söcial representative.");
      }

      setNotification({
        message: "Venue sign in successful!",
        type: "success",
      });

      // Navigate to host page
      setTimeout(() => navigate("/host"), 500);
      
    } catch (error: unknown) {
      let errorMessage = "Authentication failed";

      if (error instanceof Error) {
        // Handle specific auth errors
        if (error.message.includes("Venue account is not active")) {
          errorMessage = error.message;
        } else if (error.message.includes("Invalid login credentials")) {
          errorMessage = "Invalid email or password";
        } else if (error.message.includes("User not found")) {
          errorMessage = "Venue account not found";
        } else {
          errorMessage = error.message;
        }
      }

      setNotification({ message: errorMessage, type: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className={`flex min-h-screen flex-col items-center justify-center px-6 py-10 ${!isDark ? 'bg-amber-50' : 'bg-slate-950'}`}>
      {/* Notification Popup */}
      {notification && (
        <div className="fixed bottom-4 right-4 z-50 max-w-sm">
          <div
            className={`rounded-lg px-4 py-3 shadow-lg ${
              notification.type === "success"
                ? "bg-green-500 text-white"
                : "bg-red-500 text-white"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-medium">{notification.message}</span>
              <button
                onClick={() => setNotification(null)}
                className="ml-3 text-white hover:text-gray-200"
              >
                ×
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="w-full max-w-md">
        <header className="mb-8 text-center">
          <div className="mb-4">
            <img
              src="/logo.png"
              alt="Söcial logo"
              className="mx-auto h-16 w-auto"
            />
          </div>
          <h1 className="text-3xl font-black text-brand-primary sm:text-4xl">
            Venue Login
          </h1>
          <p className={`mt-2 ${!isDark ? 'text-slate-600' : 'text-slate-400'}`}>
            Sign in with your venue credentials to host games
          </p>
        </header>

        <Card className="p-6" isDark={isDark}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <FormField
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your venue email"
              required
              isDark={isDark}
            />

            <FormField
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              isDark={isDark}
            />

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </form>
        </Card>

        <div className={`mt-6 text-center text-sm ${!isDark ? 'text-slate-500' : 'text-slate-400'}`}>
          <p>
            Venue access is reserved for approved partners. Need an account?
            Contact your Söcial representative.
          </p>
        </div>
      </div>
    </main>
  );
}
