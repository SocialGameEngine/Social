import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../shared/providers/AuthContext";
import { useTheme } from "../../shared/providers/ThemeProvider";
import { Button, FormField, Modal } from "@social/ui";
import { ensureVenueAccountProfile } from "../../supabase/client";

interface VenueAuthModalProps {
  open: boolean;
  onClose: () => void;
}

export function VenueAuthModal({ open, onClose }: VenueAuthModalProps) {
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

  // Reset form when modal opens/closes
  useEffect(() => {
    if (!open) {
      setEmail("");
      setPassword("");
      setNotification(null);
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

      // Close modal and navigate to host page
      setTimeout(() => {
        onClose();
        navigate("/host");
      }, 500);
      
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
    <Modal open={open} onClose={onClose} title="Venue Sign In" titleColor={!isDark ? 'text-pink-600' : 'text-pink-400'} isDark={isDark}>
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

      <div className={`mb-4 text-center ${!isDark ? 'text-pink-600' : 'text-pink-300'}`}>
        <p className="text-sm font-medium">
          Host games and manage your venue
        </p>
      </div>

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

        <Button type="submit" className="w-full bg-pink-600 hover:bg-pink-700 text-white" disabled={loading}>
          {loading ? "Signing in..." : "Sign In"}
        </Button>
      </form>

      <div className={`mt-6 text-center text-sm ${!isDark ? 'text-slate-500' : 'text-slate-400'}`}>
        <p>
          Venue access is reserved for approved partners. Need an account?
          Contact your Söcial representative.
        </p>
      </div>
    </Modal>
  );
}
