import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../shared/providers/AuthContext";
import { useTheme } from "../../shared/providers/ThemeProvider";
import { Button, FormField, Card } from "@social/ui";
import { ensureVenueAccountProfile, supabase } from "../../supabase/client";

interface AuthPageProps {
  variant?: "player" | "venue";
}

export function AuthPage({ variant = "player" }: AuthPageProps) {
  const { isDark } = useTheme();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);
  const { user, signIn, signUp, signInAnonymously, refreshVenueAccount, venueAccountLoading, isVenueAccount, venueAccount } = useAuth();
  const navigate = useNavigate();
  const isVenueVariant = variant === "venue";
  const allowSignUp = true;
  const allowGuestMode = !isVenueVariant;
  const redirectPath = isVenueVariant ? "/host" : "/";

  const syncVenueAccount = async (nameHint?: string) => {
    if (!isVenueVariant) {
      return;
    }
    
    // Get the current session directly from Supabase (more reliable than waiting for React state)
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session?.user) {
      // If no session yet, wait a bit for it to be available
      let waitAttempts = 0;
      const maxWaitAttempts = 15; // Wait up to 1.5 seconds
      while (waitAttempts < maxWaitAttempts) {
        await new Promise(resolve => setTimeout(resolve, 100));
        const { data: { session: retrySession } } = await supabase.auth.getSession();
        if (retrySession?.user) {
          // Session is now available, proceed
          break;
        }
        waitAttempts++;
      }
      
      // Final check
      const { data: { session: finalSession } } = await supabase.auth.getSession();
      if (!finalSession?.user) {
        throw new Error("Authentication failed. Please try again.");
      }
    }
    
    // Now ensure the venue account profile exists/updates
    await ensureVenueAccountProfile({
      fullName: nameHint?.trim() || undefined,
    });
    
    // Brief wait for database commit
    await new Promise(resolve => setTimeout(resolve, 150));
    
    // Fetch the venue account directly from database (don't rely on React state)
    const currentSession = await supabase.auth.getSession();
    const userId = currentSession.data.session?.user?.id;
    
    if (!userId) {
      throw new Error("Authentication failed. Please try again.");
    }
    
    // Retry logic to fetch the venue account
    let account = null;
    let attempts = 0;
    const maxAttempts = 3;
    
    while (attempts < maxAttempts) {
      const { data: venueAccount, error: fetchError } = await supabase
        .from('venue_accounts')
        .select('id, auth_user_id, email, full_name, phone, role, avatar_url, created_at, last_active_at, is_active')
        .eq('auth_user_id', userId)
        .maybeSingle();
      
      if (fetchError && fetchError.code !== 'PGRST116') {
        // Error other than "not found"
        if (attempts < maxAttempts - 1) {
          await new Promise(resolve => setTimeout(resolve, 150));
          attempts++;
          continue;
        }
        throw new Error("Venue account verification failed. Please try signing in again.");
      }
      
      if (venueAccount) {
        // Map the account to match the expected format
        account = {
          id: venueAccount.id,
          authUserId: venueAccount.auth_user_id,
          email: venueAccount.email,
          fullName: venueAccount.full_name,
          phone: venueAccount.phone,
          role: venueAccount.role,
          avatarUrl: venueAccount.avatar_url ?? undefined,
          createdAt: venueAccount.created_at,
          lastActiveAt: venueAccount.last_active_at ?? undefined,
          isActive: venueAccount.is_active,
        };
        
        // If account exists and is active, refresh the React state and wait for it to update
        if (account.isActive) {
          // Trigger a refresh in the auth provider so state is in sync
          await refreshVenueAccount();
          
          // Wait for React state to update and propagate to all components
          // We need to give React time to re-render with the updated venueAccount state
          await new Promise(resolve => setTimeout(resolve, 300));
          
          // Verify the state was actually updated by checking once more
          const verifyAccount = await refreshVenueAccount();
          if (verifyAccount?.isActive) {
            // Give one more render cycle to ensure state is fully propagated
            await new Promise(resolve => setTimeout(resolve, 100));
            return; // Success - exit early
          }
        } else {
          // Account exists but isn't active
          throw new Error("Venue account is not active. Please contact your Söcial representative.");
        }
      }
      
      // Account doesn't exist yet, wait and retry
      if (attempts < maxAttempts - 1) {
        await new Promise(resolve => setTimeout(resolve, 150));
      }
      attempts++;
    }
    
    // Final verification
    if (!account) {
      throw new Error("Venue account verification failed. Please try signing in again.");
    }
  };

  // Auto-dismiss notifications after 3 seconds
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin || !allowSignUp) {
        await signIn(email, password);
        
        // For venue variant, sync and verify venue account before navigating
        if (isVenueVariant) {
          await syncVenueAccount(displayName || email);
        }
        
        setNotification({
          message: isVenueVariant ? "Venue sign in successful!" : "Sign in successful!",
          type: "success",
        });
        // For venue variant, state is already updated in syncVenueAccount, so navigate quickly
        // For non-venue, shorter delay is fine too
        setTimeout(() => navigate(redirectPath), isVenueVariant ? 300 : 800);
      } else {
        if (password !== confirmPassword) {
          setNotification({ message: "Passwords do not match", type: "error" });
          setLoading(false);
          return;
        }
        if (password.length < 6) {
          setNotification({
            message: "Password must be at least 6 characters",
            type: "error",
          });
          setLoading(false);
          return;
        }
        await signUp(email, password, displayName);
        
        // For venue variant, sync and verify venue account before navigating
        if (isVenueVariant) {
          await syncVenueAccount(displayName || email);
        }
        
        setNotification({
          message: "Account created successfully!",
          type: "success",
        });
        // Reduced delay for faster navigation
        setTimeout(() => navigate(redirectPath), 800);
      }
    } catch (error: unknown) {
      let errorMessage = "Authentication failed";

      const authError =
        typeof error === "object" && error
          ? (error as { code?: string; message?: string })
          : null;

      if (authError?.code === "auth/email-already-in-use") {
        errorMessage = "An account with this email already exists";
      } else if (authError?.code === "auth/weak-password") {
        errorMessage = "Password is too weak";
      } else if (authError?.code === "auth/invalid-email") {
        errorMessage = "Invalid email address";
      } else if (authError?.code === "auth/user-not-found") {
        errorMessage = "User not found in the system";
      } else if (authError?.code === "auth/wrong-password") {
        errorMessage = "Incorrect password";
      } else if (authError?.code === "auth/invalid-credential") {
        errorMessage = "User not found in the system";
      } else if (authError?.message) {
        errorMessage = authError.message;
      }

      setNotification({ message: errorMessage, type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleGuestMode = async () => {
    if (!allowGuestMode) return;
    setLoading(true);
    try {
      await signInAnonymously();
      setNotification({ message: "Signed in as guest", type: "success" });
      setTimeout(() => navigate(redirectPath), 2000);
    } catch (error: unknown) {
      const authError =
        typeof error === "object" && error
          ? (error as { message?: string })
          : null;
      setNotification({
        message: authError?.message || "Guest sign-in failed",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const headerTitle = isVenueVariant
    ? isLogin
      ? "Venue Login"
      : "Unlock Venue Access"
    : isLogin
      ? "Welcome Back"
      : "Join Söcial";

  const headerSubtitle = isVenueVariant
    ? "Sign in with your venue credentials to host games"
    : isLogin
      ? "Sign in to save your game history"
      : "Create an account to track your wins";

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
            {headerTitle}
          </h1>
          <p className={`mt-2 ${!isDark ? 'text-slate-600' : 'text-slate-400'}`}>
            {headerSubtitle}
          </p>
        </header>

        <Card className="p-6" isDark={isDark}>
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && allowSignUp && (
              <FormField
                label="Display Name"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Enter your display name"
                required
                isDark={isDark}
              />
            )}

            <FormField
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
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

            {!isLogin && allowSignUp && (
              <FormField
                label="Confirm Password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your password"
                required
                isDark={isDark}
              />
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Please wait..." : isLogin ? "Sign In" : "Sign Up"}
            </Button>
          </form>

          {allowGuestMode && (
          <div className="mt-6 space-y-3">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className={`w-full border-t ${!isDark ? 'border-slate-300' : 'border-slate-600'}`} />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className={`px-2 ${!isDark ? 'bg-white text-slate-500' : 'bg-slate-800 text-slate-400'}`}>Or</span>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={handleGuestMode}
              disabled={loading}
              isDark={isDark}
            >
              Continue as Guest
            </Button>
          </div>
          )}

          {allowSignUp && (
            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={() => setIsLogin(!isLogin)}
                className={`text-sm underline ${!isDark ? 'text-brand-primary hover:text-brand-dark' : 'text-cyan-400 hover:text-cyan-300'}`}
              >
                {isLogin
                  ? "Don't have an account? Sign up"
                  : "Already have an account? Sign in"}
              </button>
            </div>
          )}
        </Card>

        {allowGuestMode ? (
          <div className={`mt-6 text-center text-sm ${!isDark ? 'text-slate-500' : 'text-slate-400'}`}>
            <p>
              Guest mode allows you to play without an account, but your progress
              won't be saved.
            </p>
          </div>
        ) : (
          <div className={`mt-6 text-center text-sm ${!isDark ? 'text-slate-500' : 'text-slate-400'}`}>
            <p>
              Venue access is reserved for approved partners. Need an account?
              Contact your Söcial representative.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}

export default AuthPage;
