import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
    strictPort: true,

    // wichtig: nicht nur 127.0.0.1
    host: true, // entspricht 0.0.0.0

    allowedHosts: [
      "healthyeatingforeveryone.ch",
      "api.healthyeatingforeveryone.ch"
    ],

    proxy: {
      "/api": {
        target: "http://127.0.0.1:5000",
        changeOrigin: true
      }
    }
  }
});
