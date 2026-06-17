import type { AnalyticsEngineDataset } from "@cloudflare/workers-types"

export function createKvTracker(dataset: AnalyticsEngineDataset) {
  return (
    userId: string,
    resourceId: string,
    reads: number,
    writes: number,
    deletes: number,
    lists: number,
  ) => {
    dataset.writeDataPoint({
      blobs: [userId, "kv", resourceId],
      doubles: [reads, writes, deletes, lists],
      indexes: [userId],
    })
  }
}
