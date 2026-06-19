import { AsyncLocalStorage } from "node:async_hooks"
export { Hono } from "hono"

export type CalfcloudEnv = Record<string, any>
const environments = new AsyncLocalStorage<CalfcloudEnv>()

export function runWithEnv<T>(env: CalfcloudEnv, callback: () => T): T {
  return environments.run(env, callback)
}

function binding<T>(name: string): T {
  const value = environments.getStore()?.[name]
  if (!value) throw new Error(`cloudcalf: ${name} is not available in this environment`)
  return value as T
}

export const storage = {
  async get<T = unknown>(key: string): Promise<T | null> {
    const raw = await binding<any>("KV").get(key)
    return raw === null ? null : JSON.parse(raw)
  },
  set: (key: string, value: unknown) => binding<any>("KV").put(key, JSON.stringify(value)),
  delete: (key: string) => binding<any>("KV").delete(key),
}

export const database = {
  query: async <T = Record<string, unknown>>(sql: string, params: unknown[] = []) =>
    binding<any>("D1")
      .prepare(sql)
      .bind(...params)
      .all() as Promise<{ results: T[]; success: boolean; meta: unknown }>,
}

export const files = {
  upload: (key: string, value: any) => binding<any>("R2").put(key, value),
  get: (key: string) => binding<any>("R2").get(key),
  delete: (key: string) => binding<any>("R2").delete(key),
}

export const ai = { run: (model: string, input: unknown) => binding<any>("AI").run(model, input) }
export const vector = {
  query: (values: number[], options: unknown = {}) => binding<any>("VECTOR").query(values, options),
  insert: (records: unknown[]) => binding<any>("VECTOR").insert(records),
}
export const email = { send: (message: unknown) => binding<any>("EMAIL").send(message) }

export const jobs = new Map<string, (data: any) => void | Promise<void>>()
export function background<T>(handler: (data: T) => void | Promise<void>, name?: string) {
  const job = name || handler.name
  if (!job)
    throw new Error("cloudcalf: background() needs a named function or an explicit job name")
  jobs.set(job, handler)
  return (data: T) => binding<any>("QUEUE").send({ job, data })
}

export const state = {
  async join(room: string) {
    const namespace = binding<any>("STATE")
    return namespace.get(namespace.idFromName(room))
  },
}
