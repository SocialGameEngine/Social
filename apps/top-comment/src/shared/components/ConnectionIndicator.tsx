/**
 * Connection Indicator Component
 * 
 * Shows real-time connection status with visual feedback.
 * Displays Live/Reconnecting/Offline states.
 */

import { motion } from "framer-motion";
import type { ConnectionStatus } from "../../hooks/async/types";

interface ConnectionIndicatorProps {
  status: ConnectionStatus;
  onReconnect?: () => void;
  className?: string;
}

export function ConnectionIndicator({ status, onReconnect, className = "" }: ConnectionIndicatorProps) {
  const getStatusConfig = () => {
    switch (status) {
      case "connected":
        return {
          label: "Live",
          color: "bg-green-500",
          textColor: "text-green-100",
          bgColor: "bg-green-500/20",
          pulse: true,
        };
      case "connecting":
        return {
          label: "Connecting...",
          color: "bg-yellow-500",
          textColor: "text-yellow-100",
          bgColor: "bg-yellow-500/20",
          pulse: true,
        };
      case "reconnecting":
        return {
          label: "Reconnecting...",
          color: "bg-yellow-500",
          textColor: "text-yellow-100",
          bgColor: "bg-yellow-500/20",
          pulse: true,
        };
      case "disconnected":
        return {
          label: "Offline",
          color: "bg-gray-500",
          textColor: "text-gray-100",
          bgColor: "bg-gray-500/20",
          pulse: false,
        };
      case "error":
        return {
          label: "Error",
          color: "bg-red-500",
          textColor: "text-red-100",
          bgColor: "bg-red-500/20",
          pulse: false,
        };
    }
  };

  const config = getStatusConfig();

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <div className={`px-3 py-1 rounded-full ${config.bgColor} flex items-center space-x-2`}>
        <div className="relative">
          <div className={`w-2 h-2 rounded-full ${config.color}`} />
          {config.pulse && (
            <motion.div
              className={`absolute inset-0 w-2 h-2 rounded-full ${config.color}`}
              animate={{ scale: [1, 1.5, 1], opacity: [1, 0, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          )}
        </div>
        <span className={`text-xs font-medium ${config.textColor}`}>
          {config.label}
        </span>
      </div>

      {(status === "error" || status === "disconnected") && onReconnect && (
        <button
          onClick={onReconnect}
          className="px-2 py-1 text-xs bg-white/10 hover:bg-white/20 text-white rounded transition-colors"
        >
          Retry
        </button>
      )}
    </div>
  );
}
