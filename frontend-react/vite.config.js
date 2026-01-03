import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
    strictPort: true,
    // Erlaubt Vite, auf der IP zu lauschen, die der Tunnel erwartet
    host: '127.0.0.1', 
    allowedHosts: [
      'healthyeatingforeveryone.ch',
      'api.healthyeatingforeveryone.ch'
    ]
  },
});