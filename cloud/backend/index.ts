import { Hono } from "hono"

const app = new Hono<{ Bindings: Env }>().get("/api/", (c) => c.json({ cloud: "calf" }))

export type AppType = typeof app

export default app
