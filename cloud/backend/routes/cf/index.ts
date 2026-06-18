import { Hono } from "hono"
import { createDb } from "db"
import { getCookie } from "hono/cookie"

import { createKvRoutes } from "./kv"
import { createR2Routes } from "./r2"
import { createD1Routes } from "./d1"
import { createQueueRoutes } from "./queue"
import { createVectorizeRoutes } from "./vectorize"
import { createAiRoutes } from "./ai"
import { createAnalyticsRoutes } from "./analytics"
import { createHyperdriveRoutes } from "./hyperdrive"
import { createEmailRoutes } from "./email"
import { createFetcherRoutes } from "./fetcher"
import { createDispatchRoutes } from "./dispatch"
import { createDurableobjectRoutes } from "./durableobject"
import { createRatelimitRoutes } from "./ratelimit"
import { createWorkerRoutes } from "./worker"

export function createCfRoutes() {
  const app = new Hono<{
    Bindings: Env
    Variables: { userId: string; db: ReturnType<typeof createDb> }
  }>()

  app.use("*", async (c, next) => {
    const db = createDb(c.env.DB)
    const token = getCookie(c, "session")
    if (!token) return c.json({ error: "Unauthorized" }, 401)

    const session = await db.auth.getSession(token)
    if (!session || !session.userId) return c.json({ error: "Unauthorized" }, 401)

    c.set("userId", session.userId)
    c.set("db", db)
    await next()
  })

  app.route("/kv", createKvRoutes())
  app.route("/r2", createR2Routes())
  app.route("/d1", createD1Routes())
  app.route("/queue", createQueueRoutes())
  app.route("/vectorize", createVectorizeRoutes())
  app.route("/ai", createAiRoutes())
  app.route("/analytics", createAnalyticsRoutes())
  app.route("/hyperdrive", createHyperdriveRoutes())
  app.route("/email", createEmailRoutes())
  app.route("/fetcher", createFetcherRoutes())
  app.route("/dispatch", createDispatchRoutes())
  app.route("/durableobject", createDurableobjectRoutes())
  app.route("/ratelimit", createRatelimitRoutes())
  app.route("/worker", createWorkerRoutes())

  return app
}
