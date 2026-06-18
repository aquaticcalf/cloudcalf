import type { R2Bucket } from "@cloudflare/workers-types"

export interface StorageBindings {
  get(key: string): Promise<{ body: ReadableStream | null; type: string } | null>
  put(key: string, body: ReadableStream | ArrayBuffer | string, type?: string): Promise<void>
  delete(key: string): Promise<void>
  list(prefix?: string): Promise<string[]>
}

export function createStorage(r2: R2Bucket): StorageBindings {
  return {
    async get(key) {
      const obj = await r2.get(key)
      if (!obj) return null
      return { body: obj.body, type: obj.httpMetadata?.contentType ?? "application/octet-stream" }
    },
    async put(key, body, type) {
      await r2.put(key, body, type ? { httpMetadata: { contentType: type } } : undefined)
    },
    async delete(key) {
      await r2.delete(key)
    },
    async list(prefix) {
      const { objects } = await r2.list(prefix ? { prefix } : undefined)
      return objects.map((o: any) => o.key)
    },
  }
}