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

export async function queryUsage(accountId: string, apiToken: string, userId: string) {
  const query = `
    SELECT 
      blob2 as service,
      SUM(double1) as primary_metric,
      SUM(double2) as secondary_metric,
      SUM(double3) as tertiary_metric
    FROM USAGE_ANALYTICS 
    WHERE blob1 = '${userId}' AND timestamp > NOW() - INTERVAL '30' DAY
    GROUP BY blob2
  `

  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${accountId}/analytics_engine/sql`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiToken}`,
      },
      body: query,
    },
  )

  if (!response.ok) {
    throw new Error(await response.text())
  }

  return response.json()
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
