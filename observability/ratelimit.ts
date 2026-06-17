import type { AnalyticsEngineDataset } from "@cloudflare/workers-types"

export function createRatelimitTracker(dataset: AnalyticsEngineDataset) {
  return (userId: string, resourceId: string, evaluates: number) => {
    dataset.writeDataPoint({
      blobs: [userId, "ratelimit", resourceId],
      doubles: [evaluates],
      indexes: [userId],
    })
  }
}
