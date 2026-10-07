import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: "/Umamusume-CM-Practice-Tracker/",
  plugins: [react()],
  // Recharts makes the single bundle ~600 kB; fine for a small personal tool.
  build: { chunkSizeWarningLimit: 800 },
});
