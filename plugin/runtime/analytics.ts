import type { AnalyticsEngineDataset } from "@cloudflare/workers-types"

export interface AnalyticsBindings {
  track(service: string, value: number): void
}

export function createAnalytics(analytics: AnalyticsEngineDataset): AnalyticsBindings {
  return {
    track(service, value) {
      analytics.writeDataPoint({
        blobs: [service],
        doubles: [value],
      })
    },
  }
}