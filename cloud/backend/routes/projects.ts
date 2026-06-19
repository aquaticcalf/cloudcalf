import { Hono } from "hono"
import { createDb } from "db"
import { getCookie } from "hono/cookie"

const resourceTypes = [
  "kv",
  "r2",
  "d1",
  "queue",
  "vectorize",
  "ai",
  "analytics",
  "hyperdrive",
  "email",
  "fetcher",
  "dispatch",
  "durableobject",
  "ratelimit",
] as const

export function createProjectRoutes() {
  const app = new Hono<{
    Bindings: Env
    Variables: { userId: string; db: ReturnType<typeof createDb> }
  }>()
  app.use("*", async (c, next) => {
    const db = createDb(c.env.DB)
    const token = getCookie(c, "session")
    if (!token) return c.json({ error: "Unauthorized" }, 401)
    const session = await db.auth.getSession(token)
    if (!session) return c.json({ error: "Unauthorized" }, 401)
    c.set("userId", session.userId)
    c.set("db", db)
    await next()
  })

  app.get("/", async (c) => {
    const db = c.get("db")
    const userId = c.get("userId")
    const workers = await db.cf.worker.listByUser(userId)
    const existing = await db.platform.projects.listByUser(userId)
    for (const worker of workers) {
      if (
        !existing.some((project) => project.workerId === worker.id || project.name === worker.name)
      )
        await db.platform.projects.create(userId, worker.name, worker.id)
    }
    const projects = await db.platform.projects.listByUser(userId)
    const allResources = await Promise.all(
      resourceTypes.map(async (type) => [type, await db.cf[type].listByUser(userId)] as const),
    )
    return c.json(
      await Promise.all(
        projects.map(async (project) => {
          const links = await db.platform.resources.list(project.id)
          const resources = allResources.flatMap(([type, records]) =>
            records
              .filter(
                (resource) =>
                  links.some(
                    (link) => link.resourceType === type && link.resourceId === resource.id,
                  ) || resource.name === `${project.name}-${type}-dev`,
              )
              .map((resource) => ({
                id: resource.id,
                type,
                name: resource.name,
                connected: Boolean(resource.cloudflareId),
              })),
          )
          const deployments = await db.platform.deployments.list(project.id, 1)
          return {
            ...project,
            resources,
            resourceCount: resources.length,
            latestDeployment: deployments[0] ?? null,
          }
        }),
      ),
    )
  })

  app.get("/:id", async (c) => {
    const db = c.get("db")
    const userId = c.get("userId")
    const project = await db.platform.projects.get(c.req.param("id"))
    if (!project || project.userId !== userId) return c.json({ error: "Project not found" }, 404)
    const links = await db.platform.resources.list(project.id)
    const resources = (
      await Promise.all(
        resourceTypes.map(async (type) => {
          const records = await db.cf[type].listByUser(userId)
          return records
            .filter(
              (resource) =>
                links.some(
                  (link) => link.resourceType === type && link.resourceId === resource.id,
                ) || resource.name === `${project.name}-${type}-dev`,
            )
            .map((resource) => ({
              id: resource.id,
              type,
              name: resource.name,
              connected: Boolean(resource.cloudflareId),
              updatedAt: resource.updatedAt,
            }))
        }),
      )
    ).flat()
    const deployments = await db.platform.deployments.list(project.id)
    return c.json({ ...project, resources, deployments })
  })

  return app
}
