import type { Ai } from "@cloudflare/workers-types"

export interface AiBindings {
  run<T = unknown>(model: string, input: Record<string, unknown>): Promise<T>
  embed(input: string | string[]): Promise<number[][]>
}

export function createAi(ai: Ai): AiBindings {
  return {
    async run(model, input) {
      return (await ai.run(model, input)) as any
    },
    async embed(input) {
      const texts = typeof input === "string" ? [input] : input
      const result = await ai.run("@cf/baai/bge-base-en-v1.5", { text: texts }) as any
      return result.data ?? result
    },
  }
}