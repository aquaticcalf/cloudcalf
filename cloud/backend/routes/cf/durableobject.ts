import { Hono } from "hono"
import { createDb } from "db"

export function createDurableobjectRoutes() {
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
        { error: "Invalid name. Only lowercase alphanumeric characters and dashes are allowed." },
        400,
      )
    }

    const resource = await db.cf.durableobject.create(userId, body)
    return c.json(resource)
  })

  app.get("/", async (c) => {
    const db = c.get("db")
    const userId = c.get("userId")
    const resources = await db.cf.durableobject.listByUser(userId)
    return c.json(resources)
  })

  app.get("/:id", async (c) => {
    const db = c.get("db")
    const userId = c.get("userId")
    const resource = await db.cf.durableobject.get(c.req.param("id"))

    if (!resource || resource.userId !== userId) {
      return c.json({ error: "Durable Object not found" }, 404)
    }

    return c.json(resource)
  })

  app.put("/:id", async (c) => {
    const db = c.get("db")
    const userId = c.get("userId")
    const id = c.req.param("id")

    const doResource = await db.cf.durableobject.get(id)
    if (!doResource || doResource.userId !== userId) {
      return c.json({ error: "Durable Object not found" }, 404)
    }

    const body = await c.req.json()
    if (body.name && (typeof body.name !== "string" || !/^[a-z0-9-]+$/.test(body.name))) {
      return c.json({ error: "Invalid name." }, 400)
    }

    const resource = await db.cf.durableobject.update(id, body)
    return c.json(resource)
  })

  app.delete("/:id", async (c) => {
    const db = c.get("db")
    const userId = c.get("userId")
    const id = c.req.param("id")

    const doResource = await db.cf.durableobject.get(id)
    if (!doResource || doResource.userId !== userId) {
      return c.json({ error: "Durable Object not found" }, 404)
    }

    await db.cf.durableobject.delete(id)
    return c.json({ success: true })
  })

  return app
}
