import type { DispatchNamespace } from "@cloudflare/workers-types"

export function createDispatch(dispatch: DispatchNamespace) {
  return {
    get: (...args: Parameters<DispatchNamespace["get"]>) => dispatch.get(...args),
  }
}
