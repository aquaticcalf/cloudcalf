import { defineConfig } from "vite-plus"

export default defineConfig({
  staged: {
    "*": "vp check --fix",
  },
  pack: {
    entry: ["plugin/index.ts", "plugin/cli.ts"],
    dts: true,
    format: ["esm", "cjs"],
    sourcemap: true,
    clean: true,
    external: ["vite"],
  },
  fmt: {
    semi: false,
  },
  lint: {
    jsPlugins: [{ name: "vite-plus", specifier: "vite-plus/oxlint-plugin" }],
    rules: { "vite-plus/prefer-vite-plus-imports": "error" },
    options: { typeAware: true, typeCheck: true },
    overrides: [
      {
        files: ["cloud/**"],
        plugins: ["react"],
        rules: {
          "react/jsx-no-undef": "error",
        },
      },
    ],
  },
})
