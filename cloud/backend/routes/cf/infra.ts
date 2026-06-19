import { Hono } from "hono"
import { createDb } from "db"
import Cloudflare from "cloudflare"
import { meterOperation, operationCredits } from "observability"

type Db = ReturnType<typeof createDb>

export function createInfraRoutes() {
  const app = new Hono<{
    Bindings: Env
    Variables: { userId: string; db: Db }
  }>()

  app.use("*", async (c, next) => {
    const userId = c.get("userId")
    const db = c.get("db")
    const path = c.req.path.replace(/^\/api\/cf\/infra/, "")
    const cost = operationCredits(path)
    const account = await db.platform.billing.get(userId)
    if (account.creditBalance < cost)
      return c.json(
        { error: "Insufficient credits", required: cost, balance: account.creditBalance },
        402,
      )
    await next()
    if (c.res.status < 400) {
      const project = projectName(c)
      meterOperation(c.env.USAGE_ANALYTICS, userId, project, path)
      await db.platform.billing.apply(userId, -cost, "usage", `${project}: ${path.slice(1)}`)
    }
  })

  const kvNs = ensureCfResource("kv", {
    createUrl: (id, _name) => `/accounts/${id}/storage/kv/namespaces`,
    createBody: (name) => ({ title: name }),
    extractId: (r) => r.id,
    listUrl: (id) => `/accounts/${id}/storage/kv/namespaces`,
    matchName: (item, name) => item.title === name,
    extractListId: (item) => item.id,
  })

  const d1Db = ensureCfResource("d1", {
    createUrl: (id, _name) => `/accounts/${id}/d1/database`,
    createBody: (name) => ({ name }),
    extractId: (r) => r.uuid,
    listUrl: (id) => `/accounts/${id}/d1/database`,
    matchName: (item, name) => item.name === name,
    extractListId: (item) => item.uuid,
  })

  const r2Bucket = ensureCfResource("r2", {
    createUrl: (id, _name) => `/accounts/${id}/r2/buckets`,
    createBody: (name) => ({ name }),
    extractId: (r) => r.name,
    listUrl: (id) => `/accounts/${id}/r2/buckets`,
    matchName: (item, name) => item.name === name,
    extractListId: (item) => item.name,
  })

  const queue = ensureCfResource("queue", {
    createUrl: (id, _name) => `/accounts/${id}/queues`,
    createBody: (name) => ({ queue_name: name }),
    extractId: (r) => r.queue_id,
    listUrl: (id) => `/accounts/${id}/queues`,
    matchName: (item, name) => item.queue_name === name,
    extractListId: (item) => item.queue_id,
  })

  const vectorIdx = ensureCfResource("vectorize", {
    createUrl: (id, _name) => `/accounts/${id}/vectorize/v2/indexes`,
    createBody: (name) => ({ name, dimensions: 384, metric: "cosine" }),
    extractId: (r) => r.id,
    listUrl: (id) => `/accounts/${id}/vectorize/v2/indexes`,
    matchName: (item, name) => item.name === name,
    extractListId: (item) => item.id,
  })

  app.post("/kv/get", async (c) => {
    const { key } = await c.req.json()
    const nsId = await kvNs(c)
    try {
      const value = await api(c).get(
        `/accounts/${account(c)}/storage/kv/namespaces/${nsId}/values/${encodeURIComponent(key)}`,
      )
      return c.json({ value: (value as any) ?? null })
    } catch (e: any) {
      if (e?.status === 404) return c.json({ value: null })
      throw e
    }
  })

  app.post("/kv/set", async (c) => {
    const { key, value } = await c.req.json()
    const nsId = await kvNs(c)
    await api(c).put(
      `/accounts/${account(c)}/storage/kv/namespaces/${nsId}/values/${encodeURIComponent(key)}`,
      {
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(value),
      },
    )
    return c.json({ success: true })
  })

  app.post("/kv/delete", async (c) => {
    const { key } = await c.req.json()
    const nsId = await kvNs(c)
    await api(c).delete(
      `/accounts/${account(c)}/storage/kv/namespaces/${nsId}/values/${encodeURIComponent(key)}`,
    )
    return c.json({ success: true })
  })

  app.post("/d1/query", async (c) => {
    const { sql, params } = await c.req.json()
    const dbId = await d1Db(c)
    const raw = (await api(c).post(`/accounts/${account(c)}/d1/database/${dbId}/query`, {
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sql, params: params ?? [] }),
    })) as any
    const qr = raw.result?.[0] ?? raw
    return c.json({ results: qr.results ?? [], success: qr.success ?? true, meta: qr.meta ?? {} })
  })

  app.post("/r2/upload", async (c) => {
    const bucket = await r2Bucket(c)
    const body = await c.req.parseBody()
    const key = body.key as string
    const file = body.file as File | Blob
    await api(c).put(
      `/accounts/${account(c)}/r2/buckets/${bucket}/objects/${encodeURIComponent(key)}`,
      {
        headers: { "Content-Type": file.type || "application/octet-stream" },
        body: file,
      },
    )
    return c.json({ success: true })
  })

  app.get("/r2/get", async (c) => {
    const bucket = await r2Bucket(c)
    const key = c.req.query("key")
    if (!key) return c.json({ error: "Missing key query parameter" }, 400)
    try {
      const obj = await api(c).get(
        `/accounts/${account(c)}/r2/buckets/${bucket}/objects/${encodeURIComponent(key)}`,
      )
      return c.body(obj as any)
    } catch (e: any) {
      if (e?.status === 404) return c.json({ error: "Object not found" }, 404)
      throw e
    }
  })

  app.post("/r2/delete", async (c) => {
    const { key } = await c.req.json()
    const bucket = await r2Bucket(c)
    await api(c).delete(
      `/accounts/${account(c)}/r2/buckets/${bucket}/objects/${encodeURIComponent(key)}`,
    )
    return c.json({ success: true })
  })

  app.post("/ai/run", async (c) => {
    const { model, input } = await c.req.json()
    const raw = (await api(c).post(`/accounts/${account(c)}/ai/run/${model}`, {
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    })) as any
    return c.json(raw.result ?? raw)
  })

  app.post("/vector/query", async (c) => {
    const { values, options } = await c.req.json()
    const idxId = await vectorIdx(c)
    const raw = (await api(c).post(`/accounts/${account(c)}/vectorize/v2/indexes/${idxId}/query`, {
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        vector: values,
        topK: options?.topK ?? 5,
        returnMetadata: options?.returnMetadata ?? false,
        ...(options?.namespace ? { namespace: options.namespace } : {}),
      }),
    })) as any
    return c.json(raw.result ?? raw)
  })

  app.post("/vector/insert", async (c) => {
    const { records } = await c.req.json()
    const idxId = await vectorIdx(c)
    await api(c).post(`/accounts/${account(c)}/vectorize/v2/indexes/${idxId}/insert`, {
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        vectors: records.map((r: any) => ({ id: r.id, values: r.values, metadata: r.metadata })),
      }),
    })
    return c.json({ success: true })
  })

  app.post("/email/send", async (c) => {
    const body = await c.req.json()
    console.log("[cloudcalf] email/send (mock)", JSON.stringify(body))
    return c.json({ success: true })
  })

  app.post("/queue/send", async (c) => {
    const { job, data } = await c.req.json()
    const qId = await queue(c)
    await api(c).post(`/accounts/${account(c)}/queues/${qId}/messages`, {
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: [{ body: JSON.stringify({ job, data }) }] }),
    })
    return c.json({ success: true })
  })

  return app
}

const api = (c: any) => new Cloudflare({ apiToken: c.env.CLOUDFLARE_API_TOKEN })
const account = (c: any) => c.env.CLOUDFLARE_ACCOUNT_ID as string
const projectName = (c: any) => c.req.header("x-cloudcalf-project") || "app"

interface CfResourceDef {
  createUrl: (accountId: string, name: string) => string
  createBody: (name: string) => Record<string, unknown>
  extractId: (result: any) => string
  listUrl: (accountId: string) => string
  matchName: (item: any, name: string) => boolean
  extractListId: (item: any) => string
}

function ensureCfResource(type: string, def: CfResourceDef) {
  const registryName = type as keyof Db["cf"]
  return async (c: any): Promise<string> => {
    const db = c.get("db") as Db
    const userId = c.get("userId") as string
    const name = `${projectName(c)}-${type}-dev`
    const registry = db.cf[registryName] as any

    const local = (await registry.listByUser(userId)).find((r: any) => r.name === name)
    if (local?.cloudflareId) {
      await connectToProject(db, userId, projectName(c), type, local.id)
      return local.cloudflareId
    }

    const cf = api(c)
    const aid = account(c)

    const listRaw = (await cf.get(def.listUrl(aid))) as any
    const match = (listRaw.result ?? []).find((item: any) => def.matchName(item, name))
    if (match) {
      const cid = def.extractListId(match)
      if (local) await registry.update(local.id, { cloudflareId: cid })
      const record = local ?? (await registry.create(userId, { name, cloudflareId: cid }))
      await connectToProject(db, userId, projectName(c), type, record.id)
      return cid
    }

    const created = (await cf.post(def.createUrl(aid, name), {
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(def.createBody(name)),
    })) as any
    const cid = def.extractId(created.result)
    if (local) await registry.update(local.id, { cloudflareId: cid })
    const record = local ?? (await registry.create(userId, { name, cloudflareId: cid }))
    await connectToProject(db, userId, projectName(c), type, record.id)
    return cid
  }
}

async function connectToProject(
  db: Db,
  userId: string,
  name: string,
  type: string,
  resourceId: string,
) {
  let project = await db.platform.projects.getByName(userId, name)
  if (!project) project = await db.platform.projects.create(userId, name)
  await db.platform.resources.connect(project.id, type, resourceId)
}
