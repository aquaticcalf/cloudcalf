import type { D1Database } from "@cloudflare/workers-types"

export interface DbBindings {
  query(sql: string, params?: unknown[]): Promise<unknown[]>
  execute(sql: string, params?: unknown[]): Promise<{ success: boolean }>
  get<T = unknown>(sql: string, params?: unknown[]): Promise<T | null>
}

export function createDb(d1: D1Database): DbBindings {
  return {
    async query(sql, params) {
      const stmt = d1.prepare(sql)
      if (params) stmt.bind(...params)
      const { results } = await stmt.all()
      return results ?? []
    },
    async execute(sql, params) {
      const stmt = d1.prepare(sql)
      if (params) stmt.bind(...params)
      await stmt.run()
      return { success: true }
    },
    async get(sql, params) {
      const stmt = d1.prepare(sql)
      if (params) stmt.bind(...params)
      const result = await stmt.first()
      return (result ?? null) as any
    },
  }
}