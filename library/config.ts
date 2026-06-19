import type { UserConfig } from "vite-plus"

export interface CloudConfig {
  /** Project root. Defaults to the directory containing cloud.config.ts. */
  root?: string
  /** Port used by the local Cloudflare worker. */
  backendPort?: number
  /** Escape hatch for frontend compiler options. Cloudcalf still owns the Vite lifecycle and core plugins. */
  vite?: UserConfig
}

export function defineConfig(config: CloudConfig): CloudConfig {
  return config
}
