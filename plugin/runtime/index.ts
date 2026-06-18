import type { D1Database, KVNamespace, R2Bucket, Ai, Queue, SendEmail, AnalyticsEngineDataset } from "@cloudflare/workers-types"
import { createDb, type DbBindings } from "./db"
import { createCache, type CacheBindings } from "./cache"
import { createStorage, type StorageBindings } from "./storage"
import { createAi, type AiBindings } from "./ai"
import { createQueue, type QueueBindings } from "./queue"
import { createEmail, type EmailBindings } from "./email"
import { createAnalytics, type AnalyticsBindings } from "./analytics"

export interface Runtime {
  db?: DbBindings
  cache?: CacheBindings
  storage?: StorageBindings
  ai?: AiBindings
  queue?: QueueBindings
  email?: EmailBindings
  analytics?: AnalyticsBindings
}

export function createRuntime(env: {
  DB?: D1Database
  KV?: KVNamespace
  R2?: R2Bucket
  AI?: Ai
  QUEUE?: Queue
  EMAIL?: SendEmail
  ANALYTICS?: AnalyticsEngineDataset
}): Runtime {
  return {
    ...(env.DB && { db: createDb(env.DB) }),
    ...(env.KV && { cache: createCache(env.KV) }),
    ...(env.R2 && { storage: createStorage(env.R2) }),
    ...(env.AI && { ai: createAi(env.AI) }),
    ...(env.QUEUE && { queue: createQueue(env.QUEUE) }),
    ...(env.EMAIL && { email: createEmail(env.EMAIL) }),
    ...(env.ANALYTICS && { analytics: createAnalytics(env.ANALYTICS) }),
  } as Runtime
}

export { route, type RouteHandler, type RouteHandlerContext } from "./route"
export { createDb, type DbBindings } from "./db"
export { createCache, type CacheBindings } from "./cache"
export { createStorage, type StorageBindings } from "./storage"
export { createAi, type AiBindings } from "./ai"
export { createQueue, type QueueBindings } from "./queue"
export { createEmail, type EmailBindings } from "./email"
export { createAnalytics, type AnalyticsBindings } from "./analytics"
export { createWebhookHandler, webhookRoute, type WebhookContext, type WebhookHandlerOptions } from "./webhook"
export { createCloudApi, type CloudApiClient } from "./cloud"