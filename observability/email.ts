import type { AnalyticsEngineDataset } from "@cloudflare/workers-types"

export function createEmailTracker(dataset: AnalyticsEngineDataset) {
  return (userId: string, resourceId: string, emailsSent: number) => {
    dataset.writeDataPoint({
      blobs: [userId, "email", resourceId],
      doubles: [emailsSent],
      indexes: [userId],
    })
  }
}
