import type { AnalyticsEngineDataset } from "@cloudflare/workers-types"

export function createQueueTracker(dataset: AnalyticsEngineDataset) {
  return (userId: string, resourceId: string, messagesPushed: number, messagesPulled: number) => {
    dataset.writeDataPoint({
      blobs: [userId, "queue", resourceId],
      doubles: [messagesPushed, messagesPulled],
      indexes: [userId],
    })
  }
}
