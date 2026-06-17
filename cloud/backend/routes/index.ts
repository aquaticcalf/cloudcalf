import { Hono } from "hono"
import type { Env } from "db"
import { createAuthRoutes } from "./auth"
import { createCfRoutes } from "./cf"

export function createRouter() {
  const app = new Hono<{ Bindings: Env }>()

  app.route("/api/auth", createAuthRoutes())
  app.route("/api/cf", createCfRoutes())

  app.get("/api", (c) => c.json({ cloud: "calf" }))

  return app
}
