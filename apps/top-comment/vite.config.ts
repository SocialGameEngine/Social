import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Load .env files from the monorepo root instead of app directory
  envDir: path.resolve(__dirname, "../../"),
  // Ensure JSON files are served as static assets
  server: {
    fs: {
      // Allow serving files from the project root
      strict: false,
    },
  },
});
