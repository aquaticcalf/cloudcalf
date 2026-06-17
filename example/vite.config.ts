import { defineConfig } from "vite-plus"
import react from "@vitejs/plugin-react"
import cloudcalf from "cloudcalf"

export default defineConfig({
  plugins: [react(), cloudcalf()],
})
