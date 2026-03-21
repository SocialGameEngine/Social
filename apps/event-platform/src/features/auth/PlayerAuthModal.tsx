import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../shared/providers/AuthContext";
import { useTheme } from "../../shared/providers/ThemeProvider";
import { Button, FormField, Modal } from "@social/ui";

interface PlayerAuthModalProps {
  open: boolean;
  onClose: () => void;
}

export function PlayerAuthModal({ open, onClose }: PlayerAuthModalProps) {
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
    }
  }, [open]);

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
      
      // Close modal and navigate after successful auth
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

  const headerTitle = isLogin ? "Player Sign In" : "Create Player Account";

  return (
    <Modal open={open} onClose={onClose} title={headerTitle} titleColor={!isDark ? 'text-cyan-600' : 'text-cyan-400'} isDark={isDark}>
      {/* Notification */}
      {notification && (
        <div
          className={`rounded-lg px-4 py-3 text-sm ${
            notification.type === "success"
              ? "bg-green-500 text-white"
              : "bg-red-500 text-white"
          }`}
        >
          {notification.message}
        </div>
      )}

      <div className={`mb-4 text-center ${!isDark ? 'text-blue-600' : 'text-cyan-300'}`}>
        <p className="text-sm font-medium">
          Join games, vote, and win prizes!
        </p>
      </div>

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

        <Button type="submit" className="w-full bg-cyan-600 hover:bg-cyan-700 text-white" disabled={loading}>
          {loading ? "Please wait..." : isLogin ? "Sign In" : "Sign Up"}
        </Button>
      </form>

      <div className="space-y-3">
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
          className="w-full border-cyan-300 text-cyan-600 hover:bg-cyan-50"
          onClick={handleGuestMode}
          disabled={loading}
          isDark={isDark}
        >
          Continue as Guest
        </Button>
      </div>

      <div className="text-center">
        <button
          type="button"
          onClick={() => setIsLogin(!isLogin)}
          className={`text-sm underline ${!isDark ? 'text-cyan-600 hover:text-cyan-800' : 'text-cyan-400 hover:text-cyan-300'}`}
        >
          {isLogin
            ? "Don't have an account? Sign up"
            : "Already have an account? Sign in"}
        </button>
      </div>

      <div className={`text-center text-xs ${!isDark ? 'text-slate-500' : 'text-slate-400'}`}>
        <p>
          Guest mode allows you to play without an account, but your progress
          won't be saved.
        </p>
      </div>
    </Modal>
  );
}
