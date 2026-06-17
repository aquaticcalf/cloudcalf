import type { AnalyticsEngineDataset } from "@cloudflare/workers-types"

import { createKvTracker } from "./kv"
import { createR2Tracker } from "./r2"
import { createD1Tracker } from "./d1"
import { createQueueTracker } from "./queue"
import { createVectorizeTracker } from "./vectorize"
import { createAiTracker } from "./ai"
import { createAnalyticsTracker } from "./analytics"
import { createHyperdriveTracker } from "./hyperdrive"
import { createEmailTracker } from "./email"
import { createFetcherTracker } from "./fetcher"
import { createDispatchTracker } from "./dispatch"
import { createDurableobjectTracker } from "./durableobject"
import { createRatelimitTracker } from "./ratelimit"

export function createObservability(dataset: AnalyticsEngineDataset) {
  return {
    kv: createKvTracker(dataset),
    r2: createR2Tracker(dataset),
    d1: createD1Tracker(dataset),
    queue: createQueueTracker(dataset),
    vectorize: createVectorizeTracker(dataset),
    ai: createAiTracker(dataset),
    analytics: createAnalyticsTracker(dataset),
    hyperdrive: createHyperdriveTracker(dataset),
    email: createEmailTracker(dataset),
    fetcher: createFetcherTracker(dataset),
    dispatch: createDispatchTracker(dataset),
    durableobject: createDurableobjectTracker(dataset),
    ratelimit: createRatelimitTracker(dataset),
  }
}

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
