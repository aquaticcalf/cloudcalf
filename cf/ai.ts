import type { Ai } from "@cloudflare/workers-types"

export function createAi(ai: Ai) {
  return {
    run: (...args: Parameters<Ai["run"]>) => ai.run(...args),
  }
}
