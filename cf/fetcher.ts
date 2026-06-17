import type { Fetcher } from "@cloudflare/workers-types"

export function createFetcher(fetcher: Fetcher) {
  return {
    fetch: (...args: Parameters<Fetcher["fetch"]>) => fetcher.fetch(...args),
    connect: (...args: Parameters<Fetcher["connect"]>) => fetcher.connect(...args),
  }
}
