import type { Plugin, ResolvedConfig } from "vite"

export interface cloudcalfPluginOptions {
  test?: string
}

export function cloudcalf(options: cloudcalfPluginOptions = {}): Plugin {
  let config: ResolvedConfig

  return {
    name: "cloudcalf",

    configResolved(resolvedConfig) {
      config = resolvedConfig
      console.log("[cloudcalf] ", options.test)
      if (config.command === "build") {
        config.log("[cloudcalf] build test")
      }
    },
  }
}

export default cloudcalf
