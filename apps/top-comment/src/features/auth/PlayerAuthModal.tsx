import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../shared/providers/AuthContext";
import { Button, FormField } from "@social/ui";
import { supabase } from "../../supabase/client";

interface PlayerAuthModalProps {
  open: boolean;
  onClose: () => void;
}

export function PlayerAuthModal({ open, onClose }: PlayerAuthModalProps) {
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
  const [displayNameError, setDisplayNameError] = useState<string | null>(null);
  const [isCheckingName, setIsCheckingName] = useState(false);
  const { signIn, signUp, signInAnonymously } = useAuth();
  const navigate = useNavigate();
  const redirectPath = "/join";

  // Reset form when modal opens/closes
  useEffect(() => {
    if (!open) {
      setEmail("");
      setPassword("");
      setConfirmPassword("");
      setDisplayName("");
      setNotification(null);
      setIsLogin(true);
      setDisplayNameError(null);
      setIsCheckingName(false);
    }
  }, [open]);

  // Validate display name on blur event
  const validateDisplayName = async (name: string) => {
    if (!name || name.trim().length < 2) {
      setDisplayNameError(null);
      setIsCheckingName(false);
      return;
    }

    setIsCheckingName(true);
    try {
      const { data: nameAvailable, error } = await (supabase as any).rpc('check_display_name_available', {
        p_display_name: name.trim()
      });
      
      if (error) {
        setDisplayNameError('Error checking name availability');
      } else if (!nameAvailable) {
        setDisplayNameError('Display name is already taken');
      } else {
        setDisplayNameError(null);
      }
    } catch (error) {
      setDisplayNameError('Error checking name availability');
    } finally {
      setIsCheckingName(false);
    }
  };

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

        // Check display name availability
        if (displayNameError) {
          setNotification({
            message: displayNameError,
            type: "error",
          });
          setLoading(false);
          return;
        }
        
        // Sign up - player account will be created when user joins a room
        try {
          await signUp(email, password, displayName);
          setNotification({
            message: "Account created! Please check your email to verify.",
            type: "success",
          });
        } catch (signupError: any) {
          // If user already exists, try signing in instead
          if (signupError.message?.includes('already registered') || signupError.message?.includes('already exists')) {
            try {
              await signIn(email, password);
              setNotification({
                message: "Signed in successfully!",
                type: "success",
              });
            } catch (signInError) {
              setNotification({
                message: "Invalid password for existing account",
                type: "error",
              });
              return;
            }
          } else {
            throw signupError;
          }
        }
      }
      
      // Close modal and navigate after successful auth
      setLoading(false);
      setTimeout(() => {
        onClose();
        navigate(redirectPath);
      }, 800);
      
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
      setTimeout(() => {
        onClose();
        navigate(redirectPath);
      }, 2000);
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

  const headerTitle = isLogin ? "Player Log-In" : "Create Player Account";

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-md bg-slate-800 rounded-2xl border border-cyan-400/50 shadow-2xl shadow-cyan-500/20 max-h-[90vh] overflow-y-auto">
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
            <h2 className="text-2xl font-black text-cyan-400 mb-2">
              {headerTitle}
            </h2>
            <p className="text-sm text-cyan-300 font-medium">
              {isLogin ? "Welcome back to the game!" : "Join the community and start playing"}
            </p>
          </header>

          <form onSubmit={handleSubmit} className="space-y-4">
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

            {!isLogin && (
              <div>
                <FormField
                  label="Display Name"
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  onBlur={(e) => validateDisplayName(e.target.value)}
                  placeholder="Enter your display name"
                  required
                  isDark={true}
                  className={displayNameError ? 'border-red-500' : ''}
                />
                {isCheckingName && (
                  <div className="mt-1 text-xs text-cyan-400 flex items-center">
                    <svg className="animate-spin h-3 w-3 mr-1" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                    </svg>
                    Checking availability...
                  </div>
                )}
                {displayNameError && (
                  <div className="mt-1 text-xs text-red-400 flex items-center">
                    <svg className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {displayNameError}
                  </div>
                )}
                {displayName && displayName.trim().length >= 2 && !displayNameError && !isCheckingName && (
                  <div className="mt-1 text-xs text-green-400 flex items-center">
                    <svg className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Display name is available
                  </div>
                )}
              </div>
            )}

            <Button type="submit" className="w-full bg-cyan-600 hover:bg-cyan-700 text-white" disabled={loading}>
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
              className="w-full border-cyan-300 text-cyan-400 hover:bg-cyan-50"
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

          <div className="mt-4 text-center text-xs text-slate-400">
            <p>
              Guest mode allows you to play without an account, but your progress
              won't be saved.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
