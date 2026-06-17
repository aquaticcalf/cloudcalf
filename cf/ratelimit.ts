import type { RateLimit } from "@cloudflare/workers-types"

export function createRateLimit(rateLimit: RateLimit) {
  return {
    limit: (...args: Parameters<RateLimit["limit"]>) => rateLimit.limit(...args),
  }
}
