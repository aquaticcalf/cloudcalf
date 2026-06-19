import { defineConfig } from "vite-plus"

export default defineConfig({
  test: {
    include: ["../observability/**/*.test.ts", "backend/**/*.test.ts"],
    environment: "node",
  },
})
