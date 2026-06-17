import type { CfBindings } from "./types"
import { createKv } from "./kv"
import { createR2 } from "./r2"
import { createD1 } from "./d1"
import { createQueue } from "./queue"
import { createVectorize } from "./vectorize"
import { createAi } from "./ai"
import { createAnalytics } from "./analytics"
import { createHyperdrive } from "./hyperdrive"
import { createEmail } from "./email"
import { createFetcher } from "./fetcher"
import { createDispatch } from "./dispatch"
import { createDurableObject } from "./durableobject"
import { createRateLimit } from "./ratelimit"

export function createCf(bindings: CfBindings) {
  return {
    ...(bindings.KV && { kv: createKv(bindings.KV) }),
    ...(bindings.R2 && { r2: createR2(bindings.R2) }),
    ...(bindings.D1 && { d1: createD1(bindings.D1) }),
    ...(bindings.QUEUE && { queue: createQueue(bindings.QUEUE) }),
    ...(bindings.VECTORIZE && {
      vectorize: createVectorize(bindings.VECTORIZE),
    }),
    ...(bindings.AI && { ai: createAi(bindings.AI) }),
    ...(bindings.ANALYTICS && {
      analytics: createAnalytics(bindings.ANALYTICS),
    }),
    ...(bindings.HYPERDRIVE && {
      hyperdrive: createHyperdrive(bindings.HYPERDRIVE),
    }),
    ...(bindings.EMAIL && { email: createEmail(bindings.EMAIL) }),
    ...(bindings.FETCHER && { fetcher: createFetcher(bindings.FETCHER) }),
    ...(bindings.DISPATCH && { dispatch: createDispatch(bindings.DISPATCH) }),
    ...(bindings.DO && { durableobject: createDurableObject(bindings.DO) }),
    ...(bindings.RATELIMIT && {
      ratelimit: createRateLimit(bindings.RATELIMIT),
    }),
  }
}

export * from "./types"
export * from "./kv"
export * from "./r2"
export * from "./d1"
export * from "./queue"
export * from "./vectorize"
export * from "./ai"
export * from "./analytics"
export * from "./hyperdrive"
export * from "./email"
export * from "./fetcher"
export * from "./dispatch"
export * from "./durableobject"
export * from "./ratelimit"
