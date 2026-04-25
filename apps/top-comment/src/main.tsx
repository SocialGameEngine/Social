import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./app/App";
import { registerBuiltInRoundTypes } from "./domain/sociale/rounds/index";

// Register all round types before the app mounts so the round registry is
// populated before any component that calls getRoundType() or similar.
registerBuiltInRoundTypes();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// Register service worker for PWA in production only.
// In dev, SW caching can serve stale bundles and mask code changes.
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((reg) => console.log('SW registered:', reg.scope))
      .catch((err) => console.warn('SW registration failed:', err));
  });
}
