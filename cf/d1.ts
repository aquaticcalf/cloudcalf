import type { D1Database, D1PreparedStatement } from "@cloudflare/workers-types"

export function createD1(d1: D1Database) {
  return {
    prepare: (...args: Parameters<D1Database["prepare"]>) => d1.prepare(...args),
    dump: (...args: Parameters<D1Database["dump"]>) => d1.dump(...args),
    batch: <T = unknown>(statements: D1PreparedStatement[]) => d1.batch<T>(statements),
    exec: (...args: Parameters<D1Database["exec"]>) => d1.exec(...args),
  }
}
