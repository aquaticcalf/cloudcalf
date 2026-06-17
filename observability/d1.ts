import type { AnalyticsEngineDataset } from "@cloudflare/workers-types"

export function createD1Tracker(dataset: AnalyticsEngineDataset) {
  return (
    userId: string,
    resourceId: string,
    queries: number,
    rowsRead: number,
    rowsWritten: number,
  ) => {
    dataset.writeDataPoint({
      blobs: [userId, "d1", resourceId],
      doubles: [queries, rowsRead, rowsWritten],
      indexes: [userId],
    })
  }
}
