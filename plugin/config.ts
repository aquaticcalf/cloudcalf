export interface BackendConfig {
  webhook?: {
    github?: { secret: string }
  }
  observability?: boolean
}

export interface FrontendConfig {
  plugins: any[]
}

export interface CloudConfig {
  name: string
  backend?: BackendConfig
  frontend?: FrontendConfig
}

export function defineConfig(config: CloudConfig): CloudConfig {
  return config
}