import { defineConfig } from "vite-plus"

export default defineConfig({
  staged: {
    "*": "vp check --fix",
  },
  pack: {
    entry: ["main/index.ts"],
    dts: true,
    format: ["esm", "cjs"],
    sourcemap: true,
    clean: true,
  },
  fmt: {
    semi: false,
  },
})
