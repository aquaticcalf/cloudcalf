import { Hono } from "hono"
import { createDb, type Env } from "db"

export function createVectorizeRoutes() {
  const app = new Hono<{
    Bindings: Env
    Variables: { userId: string; db: ReturnType<typeof createDb> }
  }>()

  app.post("/", async (c) => {
    const db = c.get("db")
    const userId = c.get("userId")
    const body = await c.req.json()
    const resource = await db.cf.vectorize.create(userId, body)
    return c.json(resource)
  })

  app.get("/", async (c) => {
    const db = c.get("db")
    const userId = c.get("userId")
    const resources = await db.cf.vectorize.listByUser(userId)
    return c.json(resources)
  })

  app.get("/:id", async (c) => {
    const db = c.get("db")
    const resource = await db.cf.vectorize.get(c.req.param("id"))
    return c.json(resource)
  })

  app.put("/:id", async (c) => {
    const db = c.get("db")
    const body = await c.req.json()
    const resource = await db.cf.vectorize.update(c.req.param("id"), body)
    return c.json(resource)
  })

  app.delete("/:id", async (c) => {
    const db = c.get("db")
    await db.cf.vectorize.delete(c.req.param("id"))
    return c.json({ success: true })
  })

  return app
}
