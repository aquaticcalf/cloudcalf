import { Hono } from "hono"
import { createDb } from "db"
import { getCookie } from "hono/cookie"
import { queryUsage } from "observability"

export function createObservabilityRoutes() {
  const app = new Hono<{ Bindings: Env; Variables: { userId: string } }>()

  app.use("*", async (c, next) => {
    const db = createDb(c.env.DB)
    const token = getCookie(c, "session")
    if (!token) return c.json({ error: "Unauthorized" }, 401)

    const session = await db.auth.getSession(token)
    if (!session || !session.userId) return c.json({ error: "Unauthorized" }, 401)

    c.set("userId", session.userId)
    await next()
  })

  app.get("/usage", async (c) => {
    const userId = c.get("userId")
    const accountId = c.env.CLOUDFLARE_ACCOUNT_ID
    const apiToken = c.env.CLOUDFLARE_API_TOKEN

    if (!accountId || !apiToken) {
      return c.json(
        {
          error: "cloudflare credentials not configured in environment bindings.",
        },
        500,
      )
    }

    try {
      const data = await queryUsage(accountId, apiToken, userId)
      return c.json(data)
    } catch (error) {
      return c.json({ error: "failed to fetch analytics", details: String(error) }, 500)
    }
  })

  return app
}
