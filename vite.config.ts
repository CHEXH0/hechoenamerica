import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: true, // Better Windows compatibility than "::"
    port: 8080,
    watch: {
      // Enable polling for better Windows file watching reliability
      usePolling: true,
      interval: 1000, // Check for changes every second
    },
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  // Enable more verbose logging
  logLevel: 'info',
}));
