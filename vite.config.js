import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  return {
    // GitHub Pages example: VITE_BASE_PATH=/repo-name/
    base: env.VITE_BASE_PATH || process.env.VITE_BASE_PATH || "/",
    plugins: [react(), tailwindcss()],
  };
});
