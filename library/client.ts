import { hc } from "hono/client"
import type { Hono } from "hono"

export function createClient<T extends Hono<any, any, any>>(baseUrl = "/") {
  const cache = new WeakMap<object, unknown>()
  const wrap = (target: any): any => {
    if ((typeof target !== "object" && typeof target !== "function") || target === null)
      return target
    if (cache.has(target)) return cache.get(target)
    const proxy = new Proxy(target, {
      get(value, property, receiver) {
        if (typeof property === "string" && !property.startsWith("$")) {
          const honoMethod = `$${property}`
          if (typeof value[honoMethod] === "function") return value[honoMethod]
        }
        return wrap(Reflect.get(value, property, receiver))
      },
    })
    cache.set(target, proxy)
    return proxy
  }
  return wrap(hc<T>(baseUrl))
}

// Pass your generated AppType to createClient for end-to-end inference.
export const client = createClient<any>("/")
