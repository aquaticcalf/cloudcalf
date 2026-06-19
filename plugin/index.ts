import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs"
import { resolve } from "node:path"
import type { Plugin, ResolvedConfig } from "vite-plus"
import { discoverRoutes, toImportPath } from "./routes.ts"
import { buildWorker } from "./worker.ts"
import { sessionToken } from "./auth.ts"

const HTML = `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Cloudcalf</title>
</head>
<body>
  <div id="root"></div>
  <script type="module" src="/.cloudcalf/main.tsx"></script>
</body>
</html>`

export interface CloudcalfOptions {
  backendPort?: number
}

export default function cloudcalf(options: CloudcalfOptions = {}): Plugin {
  let config: ResolvedConfig
  let miniflare: any
  const backendPort = options.backendPort ?? 8787
  return {
    name: "cloudcalf",
    config(userConfig, { command }) {
      if (command !== "build") return
      return {
        build: {
          rollupOptions: {
            input: resolve(userConfig.root || process.cwd(), ".cloudcalf", "index.html"),
          },
        },
      }
    },
    configResolved(resolved) {
      config = resolved
      const dir = resolve(config.root, ".cloudcalf")
      mkdirSync(dir, { recursive: true })
      writeFileSync(resolve(dir, "index.html"), HTML)
      writeFileSync(
        resolve(dir, "main.tsx"),
        [
          'import { StrictMode } from "react"',
          'import { createRoot } from "react-dom/client"',
          'import { Router } from "cloudcalf/router"',
          "",
          'createRoot(document.getElementById("root")!).render(',
          "  <StrictMode><Router /></StrictMode>",
          ")",
        ].join("\n"),
      )
    },
    resolveId(id) {
      if (id === "virtual:cloudcalf/routes") return `\0${id}`
    },
    load(id) {
      if (id !== "\0virtual:cloudcalf/routes") return
      const pages = discoverRoutes(config.root).filter((route) => route.kind === "page")
      const imports = pages
        .map(
          (page, index) =>
            `import * as page${index} from ${JSON.stringify(toImportPath(page.file))}`,
        )
        .join("\n")
      const routes = pages
        .map(
          (page, index) =>
            `{ path: ${JSON.stringify(page.path)}, component: page${index}.default, meta: page${index}.meta }`,
        )
        .join(",")
      return `${imports}\nexport const routes = [${routes}]`
    },
    async configureServer(server) {
      const { Miniflare } = await import("miniflare")
      server.middlewares.use(async (req, res, next) => {
        const url = new URL(req.url || "/", "http://localhost")
        const pathname = url.pathname
        if (
          pathname.startsWith("/_cloudcalf") ||
          pathname.startsWith("/@") ||
          /\.\w+$/.test(pathname) ||
          !req.headers.accept?.includes("text/html")
        )
          return next()
        const htmlPath = resolve(config.root, ".cloudcalf", "index.html")
        if (!existsSync(htmlPath)) return next()
        const html = readFileSync(htmlPath, "utf-8")
        const transformed = await server.transformIndexHtml(pathname, html, req.originalUrl)
        res.statusCode = 200
        res.setHeader("content-type", "text/html")
        res.end(transformed)
      })
      server.middlewares.use(async (req, res, next) => {
        const url = new URL(req.url || "/", "http://localhost")
        if (!url.pathname.startsWith("/_cloudcalf")) return next()
        if ((req.headers.upgrade || "").toLowerCase() === "websocket") return next()
        const platformOrigin = process.env.CLOUDCALF_API_URL || "https://cloud.calf.lol"
        const token = await sessionToken(platformOrigin)
        if (!token) return next()
        let projectName = "app"
        try {
          projectName =
            JSON.parse(readFileSync(resolve(config.root, "package.json"), "utf-8")).name || "app"
        } catch {}
        const headers = new Headers()
        for (const [key, value] of Object.entries(req.headers))
          if (value) headers.set(key, Array.isArray(value) ? value.join(",") : value)
        headers.set("cookie", `session=${token}`)
        headers.set("x-cloudcalf-project", projectName)
        headers.delete("host")
        const body = req.method === "GET" || req.method === "HEAD" ? undefined : req
        const upstream = await fetch(
          `${platformOrigin}${url.pathname.replace("/_cloudcalf", "/api/cf/infra")}${url.search}`,
          {
            method: req.method,
            headers,
            body: body as any,
            redirect: "manual",
            duplex: "half",
          } as any,
        )
        const upstreamHeaders = Object.fromEntries(upstream.headers.entries())
        delete upstreamHeaders["content-encoding"]
        delete upstreamHeaders["content-length"]
        delete upstreamHeaders["transfer-encoding"]
        res.writeHead(upstream.status, upstreamHeaders)
        res.end(Buffer.from(await upstream.arrayBuffer()))
      })
      const rebuild = async () => {
        const { bundle } = await buildWorker(config.root)
        const settings = {
          scriptPath: bundle,
          modules: true,
          port: backendPort,
          compatibilityDate: "2025-09-01",
          compatibilityFlags: ["nodejs_compat"],
          kvNamespaces: ["KV"],
          d1Databases: ["D1"],
          r2Buckets: ["R2"],
          queueProducers: { QUEUE: { queueName: "cloudcalf" } },
          queueConsumers: { cloudcalf: {} },
          durableObjects: { STATE: { className: "CloudcalfState" } },
        }
        if (miniflare) await miniflare.setOptions(settings)
        else miniflare = new Miniflare(settings as any)
      }
      await rebuild()
      let timer: ReturnType<typeof setTimeout> | undefined
      server.watcher.on("all", (_event, file) => {
        if (!file.includes("app/") || !/\.[jt]sx?$/.test(file)) return
        clearTimeout(timer)
        timer = setTimeout(
          () => rebuild().catch((error) => config.logger.error(`[cloudcalf] ${error.message}`)),
          75,
        )
      })
      server.middlewares.use(async (request, response, next) => {
        const pathname = request.url?.split("?", 1)[0] || "/"
        const isViteAsset = pathname.startsWith("/@") || /\.\w+$/.test(pathname)
        if (
          request.method === "GET" &&
          !pathname.startsWith("/_cloudcalf") &&
          (isViteAsset || request.headers.accept?.includes("text/html"))
        )
          return next()
        try {
          const headers = new Headers()
          for (const [key, value] of Object.entries(request.headers))
            if (value) headers.set(key, Array.isArray(value) ? value.join(",") : value)
          const body = request.method === "GET" || request.method === "HEAD" ? undefined : request
          const upstream = await fetch(`http://127.0.0.1:${backendPort}${request.url}`, {
            method: request.method,
            headers,
            body: body as any,
            redirect: "manual",
            duplex: "half",
          } as any)
          const upstreamHeaders = Object.fromEntries(upstream.headers.entries())
          delete upstreamHeaders["content-encoding"]
          delete upstreamHeaders["content-length"]
          delete upstreamHeaders["transfer-encoding"]
          response.writeHead(upstream.status, upstreamHeaders)
          response.end(Buffer.from(await upstream.arrayBuffer()))
        } catch (error) {
          next(error)
        }
      })
      server.httpServer?.once("close", () => miniflare?.dispose())
    },
  }
}
