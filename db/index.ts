export * from "./schema"

import { drizzle, type DrizzleD1Database } from "drizzle-orm/d1"
import type { D1Database } from "@cloudflare/workers-types"
import { createAuth } from "./auth/core"
import type { schema } from "./schema"

type Db = DrizzleD1Database<typeof schema> & { auth: ReturnType<typeof createAuth> }

export function createDb(d1: D1Database): Db {
  const db = drizzle(d1, { schema }) as Db
  db.auth = createAuth(d1)
  return db
}
