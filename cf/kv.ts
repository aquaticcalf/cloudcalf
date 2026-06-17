import type { KVNamespace } from "@cloudflare/workers-types"

export function createKv(kv: KVNamespace) {
  return {
    get: <T = string>(...args: Parameters<KVNamespace["get"]>) =>
      kv.get(...args) as Promise<T | null>,
    put: (...args: Parameters<KVNamespace["put"]>) => kv.put(...args),
    delete: (...args: Parameters<KVNamespace["delete"]>) => kv.delete(...args),
    list: (...args: Parameters<KVNamespace["list"]>) => kv.list(...args),
    getWithMetadata: <Value = string, Metadata = unknown>(
      ...args: Parameters<KVNamespace["getWithMetadata"]>
    ) => kv.getWithMetadata<Value, Metadata>(...args),
  }
}
