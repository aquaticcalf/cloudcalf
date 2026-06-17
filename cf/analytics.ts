import type { AnalyticsEngineDataset } from "@cloudflare/workers-types"

export function createAnalytics(analytics: AnalyticsEngineDataset) {
  return {
    writeDataPoint: (...args: Parameters<AnalyticsEngineDataset["writeDataPoint"]>) =>
      analytics.writeDataPoint(...args),
  }
}
