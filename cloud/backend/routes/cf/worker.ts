import { Hono } from "hono"
import { createDb } from "db"
import Cloudflare from "cloudflare"

export function createWorkerRoutes() {
  const app = new Hono<{
    Bindings: Env
    Variables: { userId: string; db: ReturnType<typeof createDb> }
  }>()

  app.post("/", async (c) => {
    const db = c.get("db")
    const userId = c.get("userId")
    const body = await c.req.json()

    if (!body || typeof body.name !== "string" || !/^[a-z0-9-]+$/.test(body.name)) {
      return c.json(
        {
          error:
            "Invalid worker name. Only lowercase alphanumeric characters and dashes are allowed.",
        },
        400,
      )
    }

    const resource = await db.cf.worker.create(userId, body)
    return c.json(resource)
  })

  app.get("/", async (c) => {
    const db = c.get("db")
    const userId = c.get("userId")
    const resources = await db.cf.worker.listByUser(userId)
    return c.json(resources)
  })

  app.get("/:id", async (c) => {
    const db = c.get("db")
    const userId = c.get("userId")
    const resource = await db.cf.worker.get(c.req.param("id"))
    if (!resource || resource.userId !== userId) {
      return c.json({ error: "Worker not found" }, 404)
    }
    return c.json(resource)
  })

  app.put("/:id", async (c) => {
    const db = c.get("db")
    const userId = c.get("userId")
    const id = c.req.param("id")

    const worker = await db.cf.worker.get(id)
    if (!worker || worker.userId !== userId) {
      return c.json({ error: "Worker not found" }, 404)
    }

    const body = await c.req.json()
    if (body.name && (typeof body.name !== "string" || !/^[a-z0-9-]+$/.test(body.name))) {
      return c.json({ error: "Invalid worker name." }, 400)
    }

    const resource = await db.cf.worker.update(id, body)
    return c.json(resource)
  })

  app.put("/:id/upload", async (c) => {
    const db = c.get("db")
    const userId = c.get("userId")
    const id = c.req.param("id")

    const worker = await db.cf.worker.get(id)
    if (!worker || worker.userId !== userId) {
      return c.json({ error: "Worker not found" }, 404)
    }

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

    const client = new Cloudflare({ apiToken })

    try {
      const contentType = c.req.header("content-type") || "application/javascript"

      const cfData = await client.put(`/accounts/${accountId}/workers/scripts/${worker.name}`, {
        headers: { "Content-Type": contentType },
        body: c.req.raw.body,
      })

      const resource = await db.cf.worker.update(id, {})

      return c.json({ success: true, cfData, resource })
    } catch (error: any) {
      return c.json(
        {
          error: "failed to deploy to cloudflare",
          details: error.message || String(error),
        },
        500,
      )
    }
  })

  app.put("/:id/observability", async (c) => {
    const db = c.get("db")
    const userId = c.get("userId")
    const id = c.req.param("id")

    const worker = await db.cf.worker.get(id)
    if (!worker || worker.userId !== userId) {
      return c.json({ error: "Worker not found" }, 404)
    }

    const body = await c.req.json()

    const resource = await db.cf.worker.update(id, {
      observability: body.enabled,
    })

    return c.json({ success: true, resource })
  })

  app.delete("/:id", async (c) => {
    const db = c.get("db")
    const userId = c.get("userId")
    const id = c.req.param("id")

    const worker = await db.cf.worker.get(id)
    if (!worker || worker.userId !== userId) {
      return c.json({ error: "Worker not found" }, 404)
    }

    await db.cf.worker.delete(id)
    return c.json({ success: true })
  })

  return app
}
