import type { VectorizeIndex } from "@cloudflare/workers-types"

export function createVectorize(vectorize: VectorizeIndex) {
  return {
    insert: (...args: Parameters<VectorizeIndex["insert"]>) => vectorize.insert(...args),
    upsert: (...args: Parameters<VectorizeIndex["upsert"]>) => vectorize.upsert(...args),
    query: (...args: Parameters<VectorizeIndex["query"]>) => vectorize.query(...args),
    getByIds: (...args: Parameters<VectorizeIndex["getByIds"]>) => vectorize.getByIds(...args),
    deleteByIds: (...args: Parameters<VectorizeIndex["deleteByIds"]>) =>
      vectorize.deleteByIds(...args),
  }
}
