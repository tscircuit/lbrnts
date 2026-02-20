import { fileURLToPath, URL } from "node:url"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

const repoRoot = fileURLToPath(new URL("..", import.meta.url))

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      lbrnts: fileURLToPath(new URL("../index.ts", import.meta.url)),
    },
  },
  server: {
    fs: {
      allow: [repoRoot],
    },
  },
})
