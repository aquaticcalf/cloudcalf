import type { AnalyticsEngineDataset } from "@cloudflare/workers-types"

export function createFetcherTracker(dataset: AnalyticsEngineDataset) {
  return (userId: string, resourceId: string, requests: number) => {
    dataset.writeDataPoint({
      blobs: [userId, "fetcher", resourceId],
      doubles: [requests],
      indexes: [userId],
    })
  }
}
