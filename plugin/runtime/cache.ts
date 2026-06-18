import type { KVNamespace } from "@cloudflare/workers-types"

export interface CacheBindings {
  get<T = unknown>(key: string): Promise<T | null>
  set<T = unknown>(key: string, value: T, ttl?: number): Promise<void>
  delete(key: string): Promise<void>
  list(prefix?: string): Promise<string[]>
}

export function createCache(kv: KVNamespace): CacheBindings {
  return {
    async get(key) {
      const value = await kv.get(key)
      if (!value) return null
      try { return JSON.parse(value) as any }
      catch { return value as any }
    },
    async set(key, value, ttl) {
      const str = typeof value === "string" ? value : JSON.stringify(value)
      if (ttl) await kv.put(key, str, { expirationTtl: ttl })
      else await kv.put(key, str)
    },
    async delete(key) {
      await kv.delete(key)
    },
    async list(prefix) {
      const { keys } = await kv.list(prefix ? { prefix } : undefined)
      return keys.map((k) => k.name)
    },
  }
}