import type { AnalyticsEngineDataset } from "@cloudflare/workers-types"

export function createAnalyticsTracker(dataset: AnalyticsEngineDataset) {
  return (userId: string, resourceId: string, dataPointsWritten: number) => {
    dataset.writeDataPoint({
      blobs: [userId, "analytics", resourceId],
      doubles: [dataPointsWritten],
      indexes: [userId],
    })
  }
}
