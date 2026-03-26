import { useState, useEffect } from "react";
import { useAuth } from "../providers/AuthContext";
import { Button, FormField } from "@social/ui";

interface AuthModalProps {
  onClose: () => void;
  onSuccess?: () => void;
  initialMode?: 'login' | 'signup';
}

export function AuthModal({ onClose, onSuccess, initialMode = 'login' }: AuthModalProps) {
  const [isLogin, setIsLogin] = useState(initialMode === 'login');
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
      
      // Close immediately after successful auth
      onSuccess?.();
      onClose();
      
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
      // Close immediately after successful auth
      onSuccess?.();
      onClose();
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-md bg-slate-800 rounded-2xl border border-cyan-400/50 shadow-2xl shadow-fuchsia-500/20 max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors z-10"
          aria-label="Close"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {notification && (
          <div className="absolute top-4 left-4 right-16 z-20">
            <div
              className={`rounded-lg px-4 py-3 shadow-lg ${
                notification.type === "success"
                  ? "bg-green-500 text-white"
                  : "bg-red-500 text-white"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium text-sm">{notification.message}</span>
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

        <div className="p-6">
          <header className="mb-6 text-center">
            <h2 className="text-2xl font-black text-pink-400 mb-2">
              {headerTitle}
            </h2>
            <p className="text-sm text-slate-400">
              {headerSubtitle}
            </p>
          </header>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <FormField
                label="Display Name"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Enter your display name"
                required
                isDark={true}
              />
            )}

            <FormField
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
              isDark={true}
            />

            <FormField
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              isDark={true}
            />

            {!isLogin && (
              <FormField
                label="Confirm Password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your password"
                required
                isDark={true}
              />
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Please wait..." : isLogin ? "Sign In" : "Sign Up"}
            </Button>
          </form>

          <div className="mt-6 space-y-3">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-600" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-slate-800 text-slate-400">Or</span>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={handleGuestMode}
              disabled={loading}
              isDark={true}
            >
              Continue as Guest
            </Button>
          </div>

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm text-cyan-400 hover:text-cyan-300 underline"
            >
              {isLogin
                ? "Don't have an account? Sign up"
                : "Already have an account? Sign in"}
            </button>
          </div>

          {!isLogin && (
            <div className="mt-4 text-center text-xs text-slate-400">
              <p>
                Guest mode allows you to play without an account, but your progress
                won't be saved.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
