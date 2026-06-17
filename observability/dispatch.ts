import type { AnalyticsEngineDataset } from "@cloudflare/workers-types"

export function createDispatchTracker(dataset: AnalyticsEngineDataset) {
  return (userId: string, resourceId: string, invocations: number) => {
    dataset.writeDataPoint({
      blobs: [userId, "dispatch", resourceId],
      doubles: [invocations],
      indexes: [userId],
    })
  }
}
