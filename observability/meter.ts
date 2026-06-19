import type { AnalyticsEngineDataset } from "@cloudflare/workers-types"

const costs: Record<string, number> = {
  "/kv/get": 1,
  "/kv/set": 2,
  "/kv/delete": 1,
  "/d1/query": 5,
  "/r2/upload": 10,
  "/r2/get": 2,
  "/r2/delete": 2,
  "/ai/run": 50,
  "/vector/query": 20,
  "/vector/insert": 25,
  "/email/send": 25,
  "/queue/send": 5,
}

export function operationCredits(path: string) {
  return costs[path] ?? 1
}

export function meterOperation(
  dataset: AnalyticsEngineDataset,
  userId: string,
  project: string,
  path: string,
) {
  const [, service = "unknown", operation = "request"] = path.split("/")
  const credits = operationCredits(path)
  dataset.writeDataPoint({
    blobs: [userId, service, project, operation],
    doubles: [1, credits],
    indexes: [userId],
  })
  return credits
}
