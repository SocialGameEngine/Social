/**
 * Boot Screen Component
 * 
 * Displays during app initialization while auth and prerequisites resolve.
 * Provides branded loading experience with status messages.
 */

import { motion } from "framer-motion";
import type { BootState } from "../../hooks/async/types";

interface BootScreenProps {
  state: BootState;
  message?: string;
}

export function BootScreen({ state, message }: BootScreenProps) {
  const getDefaultMessage = () => {
    switch (state.status) {
      case "booting":
        return "Warming up your room...";
      case "auth_resolving":
        return "Signing you in...";
      case "venue_loading":
        return "Loading your venue...";
      case "error":
        return state.error?.message || "Something went wrong";
      default:
        return "Loading...";
    }
  };

  const displayMessage = message || getDefaultMessage();

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <div className="text-center space-y-6">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="flex justify-center"
        >
          <div className="w-24 h-24 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="w-16 h-16 border-4 border-white/30 border-t-white rounded-full"
            />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-2"
        >
          <h2 className="text-2xl font-bold text-white">
            {state.status === "error" ? "Oops!" : "Top Comment"}
          </h2>
          <p className="text-white/80 text-lg">
            {displayMessage}
          </p>
        </motion.div>

        {state.status === "error" && state.error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mt-6"
          >
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-white/20 hover:bg-white/30 text-white rounded-lg font-medium transition-colors backdrop-blur-sm"
            >
              Retry
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
