import { Hono } from "hono"

import { createAuthRoutes } from "./auth"
import { createCfRoutes } from "./cf"
import { createObservabilityRoutes } from "./observability"

export function createRouter() {
  const app = new Hono<{ Bindings: Env }>()

  app.route("/api/auth", createAuthRoutes())
  app.route("/api/cf", createCfRoutes())
  app.route("/api/observability", createObservabilityRoutes())

  app.get("/api", (c) => c.json({ cloud: "calf" }))
  app.get("/api/", (c) => c.json({ cloud: "calf" }))

  return app
}
