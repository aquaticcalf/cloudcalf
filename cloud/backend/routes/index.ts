import { Hono } from "hono"

import { createAuthRoutes } from "./auth"
import { createCfRoutes } from "./cf"
import { createObservabilityRoutes } from "./observability"
import { createProjectRoutes } from "./projects"
import { createBillingRoutes } from "./billing"

export function createRouter() {
  const app = new Hono<{ Bindings: Env }>()

  app.route("/api/auth", createAuthRoutes())
  app.route("/api/cf", createCfRoutes())
  app.route("/api/observability", createObservabilityRoutes())
  app.route("/api/projects", createProjectRoutes())
  app.route("/api/billing", createBillingRoutes())

  app.get("/api", (c) => c.json({ cloud: "calf" }))
  app.get("/api/", (c) => c.json({ cloud: "calf" }))

  return app
}
