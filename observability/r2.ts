import type { AnalyticsEngineDataset } from "@cloudflare/workers-types"

export function createR2Tracker(dataset: AnalyticsEngineDataset) {
  return (
    userId: string,
    resourceId: string,
    classA: number,
    classB: number,
    egressBytes: number,
  ) => {
    dataset.writeDataPoint({
      blobs: [userId, "r2", resourceId],
      doubles: [classA, classB, egressBytes],
      indexes: [userId],
    })
  }
}
