import type { Plugin, ResolvedConfig } from "vite"

export interface cloudcalfPluginOptions {
  test?: string
}

export default function cloudcalf(options: cloudcalfPluginOptions = {}): Plugin {
  let config: ResolvedConfig

  return {
    name: "cloudcalf",

    configResolved(resolvedConfig) {
      config = resolvedConfig
      config.logger.info("[cloudcalf] " + options.test)
      if (config.command === "build") {
        config.logger.info("[cloudcalf] build test")
      }
    },
  }
}
