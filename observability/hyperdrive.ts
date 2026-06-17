import type { AnalyticsEngineDataset } from "@cloudflare/workers-types"

export function createHyperdriveTracker(dataset: AnalyticsEngineDataset) {
  return (userId: string, resourceId: string, queries: number) => {
    dataset.writeDataPoint({
      blobs: [userId, "hyperdrive", resourceId],
      doubles: [queries],
      indexes: [userId],
    })
  }
}
