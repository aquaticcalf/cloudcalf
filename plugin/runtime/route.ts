export interface RouteHandlerContext {
  req: Request
  db: {
    query(sql: string, params?: unknown[]): Promise<unknown[]>
    execute(sql: string, params?: unknown[]): Promise<{ success: boolean }>
    get<T = unknown>(sql: string, params?: unknown[]): Promise<T | null>
  }
  cache: {
    get<T = unknown>(key: string): Promise<T | null>
    set<T = unknown>(key: string, value: T, ttl?: number): Promise<void>
    delete(key: string): Promise<void>
    list(prefix?: string): Promise<string[]>
  }
  storage: {
    get(key: string): Promise<{ body: ReadableStream | null; type: string } | null>
    put(key: string, body: ReadableStream | ArrayBuffer | string, type?: string): Promise<void>
    delete(key: string): Promise<void>
    list(prefix?: string): Promise<string[]>
  }
  ai: {
    run<T = unknown>(model: string, input: Record<string, unknown>): Promise<T>
    embed(input: string | string[]): Promise<number[][]>
  }
  queue: {
    send<T = unknown>(message: T): Promise<void>
    batch<T = unknown>(messages: T[]): Promise<void>
  }
  email: {
    send(to: string, from: string, subject: string, body: string): Promise<void>
  }
  analytics: {
    track(service: string, value: number): void
  }
  userId?: string
}

export type RouteHandler<T = unknown> = (ctx: RouteHandlerContext) => T | Promise<T>

export function route<T>(handler: RouteHandler<T>): RouteHandler<T> {
  return handler
}