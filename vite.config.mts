import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { nodePolyfills } from "vite-plugin-node-polyfills";

export default defineConfig({
  plugins: [
    react(),
    nodePolyfills({
      // Enable polyfills for specific Node.js modules
      globals: {
        Buffer: true,
        global: true,
        process: true,
      },
      protocolImports: true,
    }),
  ],
  root: "app",
  build: {
    outDir: "../dist",
  },
  resolve: {
    alias: {
      // Alias for lib directory so we can import from it
      "~/lib": "/Users/skylight/development/sky/nodes/obscr/lib",
    },
  },
});

