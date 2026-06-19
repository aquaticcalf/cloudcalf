import { defineConfig } from "vite-plus"

export default defineConfig({
  pack: {
    entry: ["index.ts", "routes.ts", "worker.ts", "auth.ts", "cli.ts"],
    dts: true,
    format: ["esm", "cjs"],
    sourcemap: true,
    clean: true,
    external: ["vite", "miniflare", "esbuild"],
  },
})
