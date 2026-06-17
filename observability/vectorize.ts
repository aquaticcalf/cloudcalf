import type { AnalyticsEngineDataset } from "@cloudflare/workers-types"

export function createVectorizeTracker(dataset: AnalyticsEngineDataset) {
  return (
    userId: string,
    resourceId: string,
    queriedDimensions: number,
    writtenDimensions: number,
  ) => {
    dataset.writeDataPoint({
      blobs: [userId, "vectorize", resourceId],
      doubles: [queriedDimensions, writtenDimensions],
      indexes: [userId],
    })
  }
}
