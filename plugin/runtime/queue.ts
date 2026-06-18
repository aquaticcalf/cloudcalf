import type { Queue } from "@cloudflare/workers-types"

export interface QueueBindings {
  send<T = unknown>(message: T): Promise<void>
  batch<T = unknown>(messages: T[]): Promise<void>
}

export function createQueue(queue: Queue): QueueBindings {
  return {
    async send(message) {
      await queue.send(message)
    },
    async batch(messages) {
      await queue.sendBatch(messages.map((body) => ({ body })))
    },
  }
}