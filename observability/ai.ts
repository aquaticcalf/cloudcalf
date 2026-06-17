import type { AnalyticsEngineDataset } from "@cloudflare/workers-types"

export function createAiTracker(dataset: AnalyticsEngineDataset) {
  return (userId: string, resourceId: string, neurons: number, model: string) => {
    dataset.writeDataPoint({
      blobs: [userId, "ai", resourceId, model],
      doubles: [neurons],
      indexes: [userId],
    })
  }
}
