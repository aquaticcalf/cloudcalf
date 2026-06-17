import { defineConfig } from "vite-plus"
import react from "@vitejs/plugin-react"
import cloudcalf from "cloudcalf"
import { cloudflare } from "@cloudflare/vite-plugin"
import tailwindcss from "@tailwindcss/vite"

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    cloudcalf({
      test: "hello",
    }),
    cloudflare(),
  ],
})
