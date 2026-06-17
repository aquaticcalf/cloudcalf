import { drizzle } from "drizzle-orm/d1"
import type { D1Database } from "@cloudflare/workers-types"
import { createKvResources } from "./kv"
import { createR2Resources } from "./r2"
import { createD1Resources } from "./d1"
import { createQueueResources } from "./queue"
import { createVectorizeResources } from "./vectorize"
import { createAiResources } from "./ai"
import { createAnalyticsResources } from "./analytics"
import { createHyperdriveResources } from "./hyperdrive"
import { createEmailResources } from "./email"
import { createFetcherResources } from "./fetcher"
import { createDispatchResources } from "./dispatch"
import { createDurableObjectResources } from "./durableobject"
import { createRateLimitResources } from "./ratelimit"

export function createCfRegistry(d1: D1Database) {
  const db = drizzle(d1)
  return {
    kv: createKvResources(db),
    r2: createR2Resources(db),
    d1: createD1Resources(db),
    queue: createQueueResources(db),
    vectorize: createVectorizeResources(db),
    ai: createAiResources(db),
    analytics: createAnalyticsResources(db),
    hyperdrive: createHyperdriveResources(db),
    email: createEmailResources(db),
    fetcher: createFetcherResources(db),
    dispatch: createDispatchResources(db),
    durableObject: createDurableObjectResources(db),
    rateLimit: createRateLimitResources(db),
  }
}
