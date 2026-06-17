export * from "./schema"

import { drizzle, type DrizzleD1Database } from "drizzle-orm/d1"
import type { D1Database } from "@cloudflare/workers-types"

import { createAuth } from "./auth/core"
import { createCfRegistry } from "./cf/core"
import * as schema from "./schema"

type Db = DrizzleD1Database<typeof schema> & {
  auth: ReturnType<typeof createAuth>
  cf: ReturnType<typeof createCfRegistry>
}

export function createDb(d1: D1Database): Db {
  const db = drizzle(d1, { schema }) as unknown as Db
  db.auth = createAuth(d1)
  db.cf = createCfRegistry(d1)
  return db
}
