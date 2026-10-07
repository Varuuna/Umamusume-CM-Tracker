import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  // Relative base: works on GitHub Pages regardless of the repo name.
  base: "./",
  plugins: [react()],
  // Recharts makes the single bundle ~600 kB; fine for a small personal tool.
  build: { chunkSizeWarningLimit: 800 },
});
