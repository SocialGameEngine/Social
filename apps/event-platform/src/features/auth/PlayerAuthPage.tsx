import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../shared/providers/AuthContext";
import { useTheme } from "../../shared/providers/ThemeProvider";
import { Button, FormField, Card } from "@social/ui";

export function PlayerAuthPage() {
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
  const { signIn, signUp, signInAnonymously } = useAuth();
  const navigate = useNavigate();
  const redirectPath = "/";

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
      if (isLogin) {
        await signIn(email, password);
        setNotification({
          message: "Sign in successful!",
          type: "success",
        });
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
        setNotification({
          message: "Account created successfully!",
          type: "success",
        });
      }
      
      // Navigate after successful auth
      setTimeout(() => navigate(redirectPath), 800);
      
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

  const headerTitle = isLogin ? "Welcome Back" : "Join Söcial";
  const headerSubtitle = isLogin
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
            {!isLogin && (
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

            {!isLogin && (
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
        </Card>

        <div className={`mt-6 text-center text-sm ${!isDark ? 'text-slate-500' : 'text-slate-400'}`}>
          <p>
            Guest mode allows you to play without an account, but your progress
            won't be saved.
          </p>
        </div>
      </div>
    </main>
  );
}
