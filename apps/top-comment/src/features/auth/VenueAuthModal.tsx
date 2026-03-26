import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../shared/providers/AuthContext";
import { Button, FormField } from "@social/ui";

interface VenueAuthModalProps {
  open: boolean;
  onClose: () => void;
}

export function VenueAuthModal({ open, onClose }: VenueAuthModalProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);
  const { signIn } = useAuth();
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
      // Sign in with Supabase auth only
      await signIn(email, password);
      
      setNotification({
        message: "Sign in successful!",
        type: "success",
      });

      // Navigate to host page - venue account resolution happens there
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

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-md bg-slate-800 rounded-2xl border border-pink-400/50 shadow-2xl shadow-pink-500/20 max-h-[90vh] overflow-y-auto">
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
              Venue Log-In
            </h2>
            <p className="text-sm text-pink-300 font-medium">
              Host games and manage your venue
            </p>
          </header>

          <form onSubmit={handleSubmit} className="space-y-4">
            <FormField
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your venue email"
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

            <Button type="submit" className="w-full bg-pink-600 hover:bg-pink-700 text-white" disabled={loading}>
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Signing in...
                </span>
              ) : (
                "Sign In"
              )}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-slate-400">
            <p>
              Venue access is reserved for approved partners. Need an account?
              Contact your Söcial representative.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
