import type {
  KVNamespace,
  R2Bucket,
  VectorizeIndex,
  Queue,
  Ai,
  AnalyticsEngineDataset,
  Hyperdrive,
  SendEmail,
  D1Database,
  Fetcher,
  DispatchNamespace,
  DurableObjectNamespace,
  RateLimit,
} from "@cloudflare/workers-types"

export interface CfBindings {
  KV?: KVNamespace
  R2?: R2Bucket
  D1?: D1Database
  VECTORIZE?: VectorizeIndex
  QUEUE?: Queue<any>
  AI?: Ai
  ANALYTICS?: AnalyticsEngineDataset
  HYPERDRIVE?: Hyperdrive
  EMAIL?: SendEmail
  FETCHER?: Fetcher
  DISPATCH?: DispatchNamespace
  DO?: DurableObjectNamespace
  RATELIMIT?: RateLimit
}
