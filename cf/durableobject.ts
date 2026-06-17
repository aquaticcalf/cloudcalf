import type { DurableObjectNamespace } from "@cloudflare/workers-types"

export function createDurableObject(doNamespace: DurableObjectNamespace) {
  return {
    newUniqueId: (...args: Parameters<DurableObjectNamespace["newUniqueId"]>) =>
      doNamespace.newUniqueId(...args),
    idFromName: (...args: Parameters<DurableObjectNamespace["idFromName"]>) =>
      doNamespace.idFromName(...args),
    idFromString: (...args: Parameters<DurableObjectNamespace["idFromString"]>) =>
      doNamespace.idFromString(...args),
    get: (...args: Parameters<DurableObjectNamespace["get"]>) => doNamespace.get(...args),
  }
}
