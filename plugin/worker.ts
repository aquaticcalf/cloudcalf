import { mkdir, readFile, readdir, stat, writeFile } from "node:fs/promises"
import { extname, join, relative, resolve } from "node:path"
import { build } from "esbuild"
import { discoverRoutes, toImportPath } from "./routes.ts"

const methods = ["get", "post", "put", "delete", "patch", "options", "head"] as const

async function collectAssets(directory: string) {
  const assets: Record<string, { body: string; contentType: string }> = {}
  const types: Record<string, string> = {
    ".html": "text/html; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".svg": "image/svg+xml",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".webp": "image/webp",
    ".ico": "image/x-icon",
  }
  async function walk(current: string): Promise<void> {
    for (const name of await readdir(current)) {
      const file = join(current, name)
      if ((await stat(file)).isDirectory()) await walk(file)
      else
        assets[`/${relative(directory, file).replaceAll("\\", "/")}`] = {
          body: (await readFile(file)).toString("base64"),
          contentType: types[extname(file).toLowerCase()] || "application/octet-stream",
        }
    }
  }
  await walk(directory)
  return assets
}

export async function buildWorker(
  root: string,
  options: { includeAssets?: boolean; assetsDirectory?: string } = {},
) {
  const routes = discoverRoutes(root).filter((route) => route.kind === "endpoint")
  const generated = resolve(root, ".cloudcalf")
  const entry = join(generated, "worker.ts")
  const bundle = join(generated, "dist", "worker.js")
  await mkdir(join(generated, "dist"), { recursive: true })
  const assets = options.includeAssets
    ? await collectAssets(options.assetsDirectory || resolve(root, "dist"))
    : {}

  const imports = routes
    .map(
      (route, index) =>
        `import * as route${index} from ${JSON.stringify(toImportPath(route.file))}`,
    )
    .join("\n")
  const registrations = routes
    .flatMap((route, index) =>
      methods.map(
        (method) =>
          `if (route${index}.${method}) app.${method}(${JSON.stringify(route.path)}, ${method === "get" ? '(c, next) => c.req.header("accept")?.includes("text/html") ? next() : runWithEnv(c.env, () => route' + index + ".get(c))" : "c => runWithEnv(c.env, () => route" + index + "." + method + "(c))"})`,
      ),
    )
    .join("\n")
  const source = `
import { Hono, runWithEnv, jobs } from "cloudcalf/server"
${imports}
const app = new Hono()
const missing = (c, name) => c.json({ error: name + " is not configured" }, 503)
const internal = new Hono()
internal.post("/kv/get", async c => { if (!c.env.KV) return missing(c, "KV"); const { key } = await c.req.json(); const raw = await c.env.KV.get(key); return c.json({ value: raw == null ? null : JSON.parse(raw) }) })
internal.post("/kv/set", async c => { if (!c.env.KV) return missing(c, "KV"); const { key, value } = await c.req.json(); await c.env.KV.put(key, JSON.stringify(value)); return c.body(null, 204) })
internal.post("/kv/delete", async c => { if (!c.env.KV) return missing(c, "KV"); const { key } = await c.req.json(); await c.env.KV.delete(key); return c.body(null, 204) })
internal.post("/d1/query", async c => { if (!c.env.D1) return missing(c, "D1"); const { sql, params = [] } = await c.req.json(); return c.json(await c.env.D1.prepare(sql).bind(...params).all()) })
internal.post("/r2/upload", async c => { if (!c.env.R2) return missing(c, "R2"); const data = await c.req.formData(), key = data.get("key"), file = data.get("file"); if (typeof key !== "string" || !file) return c.json({ error: "key and file are required" }, 400); await c.env.R2.put(key, file); return c.body(null, 204) })
internal.get("/r2/get", async c => { if (!c.env.R2) return missing(c, "R2"); const object = await c.env.R2.get(c.req.query("key")); if (!object) return c.json({ error: "File not found" }, 404); return new Response(object.body) })
internal.post("/r2/delete", async c => { if (!c.env.R2) return missing(c, "R2"); const { key } = await c.req.json(); await c.env.R2.delete(key); return c.body(null, 204) })
internal.post("/ai/run", async c => { if (!c.env.AI) return missing(c, "AI"); const { model, input } = await c.req.json(); return c.json(await c.env.AI.run(model, input)) })
internal.post("/vector/query", async c => { if (!c.env.VECTOR) return missing(c, "Vectorize"); const { values, options } = await c.req.json(); return c.json(await c.env.VECTOR.query(values, options)) })
internal.post("/vector/insert", async c => { if (!c.env.VECTOR) return missing(c, "Vectorize"); const { records } = await c.req.json(); return c.json(await c.env.VECTOR.insert(records)) })
internal.post("/email/send", async c => { if (!c.env.EMAIL) return missing(c, "Email"); await c.env.EMAIL.send(await c.req.json()); return c.body(null, 204) })
internal.post("/queue/send", async c => { if (!c.env.QUEUE) return missing(c, "Queues"); await c.env.QUEUE.send(await c.req.json()); return c.body(null, 204) })
internal.get("/state", c => { if (!c.env.STATE) return missing(c, "Durable Objects"); const id = c.env.STATE.idFromName(c.req.query("room") || "default"); return c.env.STATE.get(id).fetch(c.req.raw) })
app.route("/_cloudcalf", internal)
${registrations}
const assets = ${JSON.stringify(assets)}
const decode = value => Uint8Array.from(atob(value), character => character.charCodeAt(0))
${options.includeAssets ? `app.get("*", c => { const pathname = new URL(c.req.url).pathname; const exact = assets[pathname]; const asset = exact || assets["/index.html"]; if (!asset) return c.notFound(); return new Response(decode(asset.body), { headers: { "content-type": asset.contentType, "cache-control": exact && pathname !== "/index.html" ? "public, max-age=31536000, immutable" : "no-cache" } }) })` : ""}
export class CloudcalfState {
  constructor(state) { this.state = state }
  async fetch(request) { if (request.headers.get("upgrade") !== "websocket") return new Response("WebSocket upgrade required", { status: 426 }); const pair = new WebSocketPair(); const [client, server] = Object.values(pair); this.state.acceptWebSocket(server); return new Response(null, { status: 101, webSocket: client }) }
  webSocketMessage(source, message) { for (const socket of this.state.getWebSockets()) if (socket !== source) socket.send(message) }
}
export default {
  fetch: (request, env, execution) => app.fetch(request, env, execution),
  async queue(batch, env) { for (const message of batch.messages) { const handler = jobs.get(message.body.job); if (!handler) { message.retry(); continue } await runWithEnv(env, () => handler(message.body.data)); message.ack() } },
}
`
  await writeFile(entry, source)
  await build({
    entryPoints: [entry],
    outfile: bundle,
    bundle: true,
    format: "esm",
    platform: "neutral",
    conditions: ["workerd", "worker", "import"],
    external: ["node:async_hooks"],
    sourcemap: true,
    logLevel: "silent",
  })
  return { entry, bundle }
}
