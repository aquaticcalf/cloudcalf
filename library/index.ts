import { request, CalfcloudError } from "./http"

type JsonValue = null | boolean | number | string | JsonValue[] | { [key: string]: JsonValue }
type QueryOptions = { topK?: number; namespace?: string; returnMetadata?: boolean }
type VectorRecord = { id: string; values: number[]; metadata?: Record<string, JsonValue> }

const json = (value: unknown) => JSON.stringify(value)
const post = <T>(path: string, body: unknown) =>
  request<T>(path, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: json(body),
  })

export const storage = {
  get: async <T = JsonValue>(key: string) =>
    (await post<{ value: T | null }>("/kv/get", { key })).value,
  set: (key: string, value: JsonValue) => post<void>("/kv/set", { key, value }),
  delete: (key: string) => post<void>("/kv/delete", { key }),
}

export const database = {
  query: <T = Record<string, unknown>>(sql: string, params: JsonValue[] = []) =>
    post<{ results: T[]; success: boolean; meta: unknown }>("/d1/query", { sql, params }),
}

export const files = {
  upload: async (key: string, value: Blob) => {
    const body = new FormData()
    body.set("key", key)
    body.set("file", value)
    return request<void>("/r2/upload", { method: "POST", body })
  },
  get: async (key: string) => {
    const response = await fetch(`/_cloudcalf/r2/get?key=${encodeURIComponent(key)}`)
    if (!response.ok) throw new CalfcloudError(`Could not read file “${key}”`, response.status)
    return response.blob()
  },
  delete: (key: string) => post<void>("/r2/delete", { key }),
}

export const ai = {
  run: <T = unknown>(model: string, input: unknown) => post<T>("/ai/run", { model, input }),
}
export const vector = {
  query: (values: number[], options: QueryOptions = {}) =>
    post<unknown>("/vector/query", { values, options }),
  insert: (records: VectorRecord[]) => post<unknown>("/vector/insert", { records }),
}

export const email = {
  send: (message: { to: string; subject: string; text: string; from?: string }) =>
    post<void>("/email/send", message),
}

export function background<T>(handler: (data: T) => void | Promise<void>, name?: string) {
  const job = name || handler.name
  if (!job) throw new CalfcloudError("background() needs a named function or an explicit job name")
  return (data: T) => post<void>("/queue/send", { job, data })
}

export const state = {
  join: async (room: string) => {
    const protocol = location.protocol === "https:" ? "wss:" : "ws:"
    const socket = new WebSocket(
      `${protocol}//${location.host}/_cloudcalf/state?room=${encodeURIComponent(room)}`,
    )
    return {
      send(message: string | ArrayBuffer | Blob) {
        if (socket.readyState === WebSocket.OPEN) socket.send(message)
        else socket.addEventListener("open", () => socket.send(message), { once: true })
      },
      onMessage(listener: (message: MessageEvent["data"]) => void) {
        const handler = (event: MessageEvent) => listener(event.data)
        socket.addEventListener("message", handler)
        return () => socket.removeEventListener("message", handler)
      },
      close: () => socket.close(),
      socket,
    }
  },
}

export { CalfcloudError }
