import type { Queue } from "@cloudflare/workers-types"

export function createQueue<Body = unknown>(queue: Queue<Body>) {
  return {
    send: (...args: Parameters<Queue<Body>["send"]>) => queue.send(...args),
    sendBatch: (...args: Parameters<Queue<Body>["sendBatch"]>) => queue.sendBatch(...args),
  }
}
