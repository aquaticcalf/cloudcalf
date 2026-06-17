import type { AnalyticsEngineDataset } from "@cloudflare/workers-types"

export function createDurableobjectTracker(dataset: AnalyticsEngineDataset) {
  return (userId: string, resourceId: string, requests: number) => {
    dataset.writeDataPoint({
      blobs: [userId, "durableobject", resourceId],
      doubles: [requests],
      indexes: [userId],
    })
  }
}
