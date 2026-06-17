import { Hono } from "hono"
import { createDb } from "db"

export function createD1Routes() {
  const app = new Hono<{
    Bindings: Env
    Variables: { userId: string; db: ReturnType<typeof createDb> }
  }>()

  app.post("/", async (c) => {
    const db = c.get("db")
    const userId = c.get("userId")
    const body = await c.req.json()
    const resource = await db.cf.d1.create(userId, body)
    return c.json(resource)
  })

  app.get("/", async (c) => {
    const db = c.get("db")
    const userId = c.get("userId")
    const resources = await db.cf.d1.listByUser(userId)
    return c.json(resources)
  })

  app.get("/:id", async (c) => {
    const db = c.get("db")
    const resource = await db.cf.d1.get(c.req.param("id"))
    return c.json(resource)
  })

  app.put("/:id", async (c) => {
    const db = c.get("db")
    const body = await c.req.json()
    const resource = await db.cf.d1.update(c.req.param("id"), body)
    return c.json(resource)
  })

  app.delete("/:id", async (c) => {
    const db = c.get("db")
    await db.cf.d1.delete(c.req.param("id"))
    return c.json({ success: true })
  })

  return app
}
