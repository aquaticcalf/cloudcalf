export * from "./kv"
export * from "./r2"
export * from "./d1"
export * from "./queue"
export * from "./vectorize"
export * from "./ai"
export * from "./analytics"
export * from "./hyperdrive"
export * from "./email"
export * from "./fetcher"
export * from "./dispatch"
export * from "./durableobject"
export * from "./ratelimit"
export * from "./worker"

import { relations } from "drizzle-orm"
import { users } from "../auth/schema"
import { kvNamespaces } from "./kv"
import { r2Buckets } from "./r2"
import { d1Databases } from "./d1"
import { queues } from "./queue"
import { vectorizeIndexes } from "./vectorize"
import { aiModels } from "./ai"
import { analyticsDatasets } from "./analytics"
import { hyperdriveConfigs } from "./hyperdrive"
import { emailRoutes } from "./email"
import { serviceBindings } from "./fetcher"
import { dispatchNamespaces } from "./dispatch"
import { durableObjects } from "./durableobject"
import { rateLimits } from "./ratelimit"
import { workers } from "./worker"

export const usersCfRelations = relations(users, ({ many }) => ({
  kvNamespaces: many(kvNamespaces),
  r2Buckets: many(r2Buckets),
  d1Databases: many(d1Databases),
  queues: many(queues),
  vectorizeIndexes: many(vectorizeIndexes),
  aiModels: many(aiModels),
  analyticsDatasets: many(analyticsDatasets),
  hyperdriveConfigs: many(hyperdriveConfigs),
  emailRoutes: many(emailRoutes),
  serviceBindings: many(serviceBindings),
  dispatchNamespaces: many(dispatchNamespaces),
  durableObjects: many(durableObjects),
  rateLimits: many(rateLimits),
  workers: many(workers),
}))
