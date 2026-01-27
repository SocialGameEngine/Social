import { useEffect, useState } from "react";

/**
 * Shared timer hook for session-based views
 * Provides current time updated every 500ms for timer displays
 */
export function useSessionTimers() {
  const [now, setNow] = useState(Date.now());

  // Update now every 500ms for timer display
  useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 500);
    return () => window.clearInterval(interval);
  }, []);

  return { now };
}
