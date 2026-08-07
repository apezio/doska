import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

// https://vite.dev/config/
export default defineConfig({
  server: {
    port: 5174,
    strictPort: true,
  },
  preview: {
    port: 3002,
  },
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      // The docs markdown lives in @doska/docs; import.meta.glob can only walk
      // a directory it can resolve at build time, so point it at the package.
      "@docs": path.resolve(__dirname, "../../packages/docs/content"),
    },
  },
})
